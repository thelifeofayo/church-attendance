import { prisma } from '../../utils/prisma';
import { emailService } from '../../utils/email';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { Role, Broadcast, BroadcastWithCreator, PaginatedResponse } from 'shared';
import { CreateBroadcastInput, ListBroadcastsQuery } from './broadcasts.schema';
import { TokenPayload } from '../../utils/jwt';
import { logger } from '../../utils/logger';

interface Recipient {
  email: string;
  firstName: string;
  lastName: string;
}

export class BroadcastsService {
  async listBroadcasts(
    query: ListBroadcastsQuery,
    currentUser: TokenPayload
  ): Promise<PaginatedResponse<BroadcastWithCreator>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Team Heads can only see their own broadcasts
    if (currentUser.role === Role.TEAM_HEAD) {
      where.createdById = currentUser.userId;
    }

    if (status) {
      where.status = status;
    }

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      }),
      prisma.broadcast.count({ where }),
    ]);

    return {
      success: true,
      data: broadcasts.map((b) => ({
        id: b.id,
        subject: b.subject,
        body: b.body,
        recipientType: b.recipientType as Broadcast['recipientType'],
        teamIds: b.teamIds,
        status: b.status as Broadcast['status'],
        sentCount: b.sentCount,
        failedCount: b.failedCount,
        createdById: b.createdById,
        sentAt: b.sentAt?.toISOString() || null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        createdBy: {
          id: b.createdBy.id,
          email: b.createdBy.email,
          firstName: b.createdBy.firstName,
          lastName: b.createdBy.lastName,
          role: b.createdBy.role as Role,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createBroadcast(
    input: CreateBroadcastInput,
    currentUser: TokenPayload
  ): Promise<Broadcast> {
    const { subject, body, recipientType, teamIds } = input;

    // Team Heads can only send to 'members' or 'hods' within their team
    if (currentUser.role === Role.TEAM_HEAD) {
      if (!['members', 'hods'].includes(recipientType)) {
        throw new ForbiddenError('Team Heads can only send broadcasts to members or HODs in their team');
      }
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        subject,
        body,
        recipientType,
        teamIds: teamIds || [],
        createdById: currentUser.userId,
        status: 'draft',
      },
    });

    return {
      id: broadcast.id,
      subject: broadcast.subject,
      body: broadcast.body,
      recipientType: broadcast.recipientType as Broadcast['recipientType'],
      teamIds: broadcast.teamIds,
      status: broadcast.status as Broadcast['status'],
      sentCount: broadcast.sentCount,
      failedCount: broadcast.failedCount,
      createdById: broadcast.createdById,
      sentAt: broadcast.sentAt?.toISOString() || null,
      createdAt: broadcast.createdAt.toISOString(),
      updatedAt: broadcast.updatedAt.toISOString(),
    };
  }

  async sendBroadcast(
    id: string,
    currentUser: TokenPayload
  ): Promise<Broadcast> {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
    });

    if (!broadcast) {
      throw new NotFoundError('Broadcast');
    }

    // Team Heads can only send their own broadcasts
    if (currentUser.role === Role.TEAM_HEAD && broadcast.createdById !== currentUser.userId) {
      throw new ForbiddenError('You can only send your own broadcasts');
    }

    if (broadcast.status !== 'draft') {
      throw new ForbiddenError('Broadcast has already been sent');
    }

    // Update status to sending
    await prisma.broadcast.update({
      where: { id },
      data: { status: 'sending' },
    });

    // Get recipients based on recipientType
    const recipients = await this.getRecipients(
      broadcast.recipientType,
      broadcast.teamIds,
      currentUser
    );

    logger.info(`Sending broadcast "${broadcast.subject}" to ${recipients.length} recipients`);

    // Send emails
    const { sent, failed } = await emailService.sendBulkEmails(
      recipients,
      broadcast.subject,
      broadcast.body
    );

    // Update broadcast with results
    const updated = await prisma.broadcast.update({
      where: { id },
      data: {
        status: failed > 0 && sent === 0 ? 'failed' : 'sent',
        sentCount: sent,
        failedCount: failed,
        sentAt: new Date(),
      },
    });

    logger.info(`Broadcast complete: ${sent} sent, ${failed} failed`);

    return {
      id: updated.id,
      subject: updated.subject,
      body: updated.body,
      recipientType: updated.recipientType as Broadcast['recipientType'],
      teamIds: updated.teamIds,
      status: updated.status as Broadcast['status'],
      sentCount: updated.sentCount,
      failedCount: updated.failedCount,
      createdById: updated.createdById,
      sentAt: updated.sentAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  private async getRecipients(
    recipientType: string,
    teamIds: string[],
    currentUser: TokenPayload
  ): Promise<Recipient[]> {
    const recipients: Recipient[] = [];

    // For Team Heads, always scope to their team
    const effectiveTeamIds = currentUser.role === Role.TEAM_HEAD
      ? [currentUser.teamId!]
      : teamIds;

    switch (recipientType) {
      case 'all': {
        // Get all users with email
        const users = await prisma.user.findMany({
          where: { isActive: true },
          select: { email: true, firstName: true, lastName: true },
        });
        recipients.push(...users);

        // Get all active members with email
        const members = await prisma.member.findMany({
          where: { isActive: true, email: { not: null } },
          select: { email: true, firstName: true, lastName: true },
        });
        recipients.push(...members.map((m) => ({
          email: m.email!,
          firstName: m.firstName,
          lastName: m.lastName,
        })));
        break;
      }

      case 'admins': {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN', isActive: true },
          select: { email: true, firstName: true, lastName: true },
        });
        recipients.push(...admins);
        break;
      }

      case 'team_heads': {
        const teamHeads = await prisma.user.findMany({
          where: { role: 'TEAM_HEAD', isActive: true },
          select: { email: true, firstName: true, lastName: true },
        });
        recipients.push(...teamHeads);
        break;
      }

      case 'hods': {
        const hodWhere: Record<string, unknown> = { role: 'HOD', isActive: true };
        if (effectiveTeamIds.length > 0) {
          hodWhere.departmentAsHOD = { teamId: { in: effectiveTeamIds } };
        }
        const hods = await prisma.user.findMany({
          where: hodWhere,
          select: { email: true, firstName: true, lastName: true },
        });
        recipients.push(...hods);
        break;
      }

      case 'members': {
        const memberWhere: Record<string, unknown> = { isActive: true, email: { not: null } };
        if (effectiveTeamIds.length > 0) {
          memberWhere.department = { teamId: { in: effectiveTeamIds } };
        }
        const members = await prisma.member.findMany({
          where: memberWhere,
          select: { email: true, firstName: true, lastName: true },
        });
        recipients.push(...members.map((m) => ({
          email: m.email!,
          firstName: m.firstName,
          lastName: m.lastName,
        })));
        break;
      }

      case 'custom': {
        // For custom, use teamIds to filter
        if (effectiveTeamIds.length > 0) {
          // Get HODs in selected teams
          const hods = await prisma.user.findMany({
            where: {
              role: 'HOD',
              isActive: true,
              departmentAsHOD: { teamId: { in: effectiveTeamIds } },
            },
            select: { email: true, firstName: true, lastName: true },
          });
          recipients.push(...hods);

          // Get members in selected teams
          const members = await prisma.member.findMany({
            where: {
              isActive: true,
              email: { not: null },
              department: { teamId: { in: effectiveTeamIds } },
            },
            select: { email: true, firstName: true, lastName: true },
          });
          recipients.push(...members.map((m) => ({
            email: m.email!,
            firstName: m.firstName,
            lastName: m.lastName,
          })));
        }
        break;
      }
    }

    // Remove duplicates by email
    const seen = new Set<string>();
    return recipients.filter((r) => {
      if (seen.has(r.email.toLowerCase())) {
        return false;
      }
      seen.add(r.email.toLowerCase());
      return true;
    });
  }

  async deleteBroadcast(id: string, currentUser: TokenPayload): Promise<void> {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
    });

    if (!broadcast) {
      throw new NotFoundError('Broadcast');
    }

    // Team Heads can only delete their own drafts
    if (currentUser.role === Role.TEAM_HEAD) {
      if (broadcast.createdById !== currentUser.userId) {
        throw new ForbiddenError('You can only delete your own broadcasts');
      }
    }

    if (broadcast.status !== 'draft') {
      throw new ForbiddenError('Only draft broadcasts can be deleted');
    }

    await prisma.broadcast.delete({
      where: { id },
    });
  }
}

export const broadcastsService = new BroadcastsService();
