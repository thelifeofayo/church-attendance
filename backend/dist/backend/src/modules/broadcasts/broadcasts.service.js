"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastsService = exports.BroadcastsService = void 0;
const prisma_1 = require("../../utils/prisma");
const email_1 = require("../../utils/email");
const errors_1 = require("../../utils/errors");
const shared_1 = require("shared");
const logger_1 = require("../../utils/logger");
class BroadcastsService {
    async listBroadcasts(query, currentUser) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;
        const where = {};
        // Team Heads can only see their own broadcasts
        if (currentUser.role === shared_1.Role.TEAM_HEAD) {
            where.createdById = currentUser.userId;
        }
        if (status) {
            where.status = status;
        }
        const [broadcasts, total] = await Promise.all([
            prisma_1.prisma.broadcast.findMany({
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
            prisma_1.prisma.broadcast.count({ where }),
        ]);
        return {
            success: true,
            data: broadcasts.map((b) => ({
                id: b.id,
                subject: b.subject,
                body: b.body,
                recipientType: b.recipientType,
                teamIds: b.teamIds,
                status: b.status,
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
                    role: b.createdBy.role,
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
    async createBroadcast(input, currentUser) {
        const { subject, body, recipientType, teamIds } = input;
        // Team Heads can only send to 'members' or 'hods' within their team
        if (currentUser.role === shared_1.Role.TEAM_HEAD) {
            if (!['members', 'hods'].includes(recipientType)) {
                throw new errors_1.ForbiddenError('Team Heads can only send broadcasts to members or HODs in their team');
            }
        }
        const broadcast = await prisma_1.prisma.broadcast.create({
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
            recipientType: broadcast.recipientType,
            teamIds: broadcast.teamIds,
            status: broadcast.status,
            sentCount: broadcast.sentCount,
            failedCount: broadcast.failedCount,
            createdById: broadcast.createdById,
            sentAt: broadcast.sentAt?.toISOString() || null,
            createdAt: broadcast.createdAt.toISOString(),
            updatedAt: broadcast.updatedAt.toISOString(),
        };
    }
    async sendBroadcast(id, currentUser) {
        const broadcast = await prisma_1.prisma.broadcast.findUnique({
            where: { id },
        });
        if (!broadcast) {
            throw new errors_1.NotFoundError('Broadcast');
        }
        // Team Heads can only send their own broadcasts
        if (currentUser.role === shared_1.Role.TEAM_HEAD && broadcast.createdById !== currentUser.userId) {
            throw new errors_1.ForbiddenError('You can only send your own broadcasts');
        }
        if (broadcast.status !== 'draft') {
            throw new errors_1.ForbiddenError('Broadcast has already been sent');
        }
        // Update status to sending
        await prisma_1.prisma.broadcast.update({
            where: { id },
            data: { status: 'sending' },
        });
        // Get recipients based on recipientType
        const recipients = await this.getRecipients(broadcast.recipientType, broadcast.teamIds, currentUser);
        logger_1.logger.info(`Sending broadcast "${broadcast.subject}" to ${recipients.length} recipients`);
        // Send emails
        const { sent, failed } = await email_1.emailService.sendBulkEmails(recipients, broadcast.subject, broadcast.body);
        // Update broadcast with results
        const updated = await prisma_1.prisma.broadcast.update({
            where: { id },
            data: {
                status: failed > 0 && sent === 0 ? 'failed' : 'sent',
                sentCount: sent,
                failedCount: failed,
                sentAt: new Date(),
            },
        });
        logger_1.logger.info(`Broadcast complete: ${sent} sent, ${failed} failed`);
        return {
            id: updated.id,
            subject: updated.subject,
            body: updated.body,
            recipientType: updated.recipientType,
            teamIds: updated.teamIds,
            status: updated.status,
            sentCount: updated.sentCount,
            failedCount: updated.failedCount,
            createdById: updated.createdById,
            sentAt: updated.sentAt?.toISOString() || null,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        };
    }
    async getRecipients(recipientType, teamIds, currentUser) {
        const recipients = [];
        // For Team Heads, always scope to their team
        const effectiveTeamIds = currentUser.role === shared_1.Role.TEAM_HEAD
            ? [currentUser.teamId]
            : teamIds;
        switch (recipientType) {
            case 'all': {
                // Get all users with email
                const users = await prisma_1.prisma.user.findMany({
                    where: { isActive: true },
                    select: { email: true, firstName: true, lastName: true },
                });
                recipients.push(...users);
                // Get all active members with email
                const members = await prisma_1.prisma.member.findMany({
                    where: { isActive: true, email: { not: null } },
                    select: { email: true, firstName: true, lastName: true },
                });
                recipients.push(...members.map((m) => ({
                    email: m.email,
                    firstName: m.firstName,
                    lastName: m.lastName,
                })));
                break;
            }
            case 'admins': {
                const admins = await prisma_1.prisma.user.findMany({
                    where: { role: 'ADMIN', isActive: true },
                    select: { email: true, firstName: true, lastName: true },
                });
                recipients.push(...admins);
                break;
            }
            case 'team_heads': {
                const teamHeads = await prisma_1.prisma.user.findMany({
                    where: { role: 'TEAM_HEAD', isActive: true },
                    select: { email: true, firstName: true, lastName: true },
                });
                recipients.push(...teamHeads);
                break;
            }
            case 'hods': {
                const hodWhere = { role: 'HOD', isActive: true };
                if (effectiveTeamIds.length > 0) {
                    hodWhere.departmentAsHOD = { teamId: { in: effectiveTeamIds } };
                }
                const hods = await prisma_1.prisma.user.findMany({
                    where: hodWhere,
                    select: { email: true, firstName: true, lastName: true },
                });
                recipients.push(...hods);
                break;
            }
            case 'members': {
                const memberWhere = { isActive: true, email: { not: null } };
                if (effectiveTeamIds.length > 0) {
                    memberWhere.department = { teamId: { in: effectiveTeamIds } };
                }
                const members = await prisma_1.prisma.member.findMany({
                    where: memberWhere,
                    select: { email: true, firstName: true, lastName: true },
                });
                recipients.push(...members.map((m) => ({
                    email: m.email,
                    firstName: m.firstName,
                    lastName: m.lastName,
                })));
                break;
            }
            case 'custom': {
                // For custom, use teamIds to filter
                if (effectiveTeamIds.length > 0) {
                    // Get HODs in selected teams
                    const hods = await prisma_1.prisma.user.findMany({
                        where: {
                            role: 'HOD',
                            isActive: true,
                            departmentAsHOD: { teamId: { in: effectiveTeamIds } },
                        },
                        select: { email: true, firstName: true, lastName: true },
                    });
                    recipients.push(...hods);
                    // Get members in selected teams
                    const members = await prisma_1.prisma.member.findMany({
                        where: {
                            isActive: true,
                            email: { not: null },
                            department: { teamId: { in: effectiveTeamIds } },
                        },
                        select: { email: true, firstName: true, lastName: true },
                    });
                    recipients.push(...members.map((m) => ({
                        email: m.email,
                        firstName: m.firstName,
                        lastName: m.lastName,
                    })));
                }
                break;
            }
        }
        // Remove duplicates by email
        const seen = new Set();
        return recipients.filter((r) => {
            if (seen.has(r.email.toLowerCase())) {
                return false;
            }
            seen.add(r.email.toLowerCase());
            return true;
        });
    }
    async deleteBroadcast(id, currentUser) {
        const broadcast = await prisma_1.prisma.broadcast.findUnique({
            where: { id },
        });
        if (!broadcast) {
            throw new errors_1.NotFoundError('Broadcast');
        }
        // Team Heads can only delete their own drafts
        if (currentUser.role === shared_1.Role.TEAM_HEAD) {
            if (broadcast.createdById !== currentUser.userId) {
                throw new errors_1.ForbiddenError('You can only delete your own broadcasts');
            }
        }
        if (broadcast.status !== 'draft') {
            throw new errors_1.ForbiddenError('Only draft broadcasts can be deleted');
        }
        await prisma_1.prisma.broadcast.delete({
            where: { id },
        });
    }
}
exports.BroadcastsService = BroadcastsService;
exports.broadcastsService = new BroadcastsService();
//# sourceMappingURL=broadcasts.service.js.map