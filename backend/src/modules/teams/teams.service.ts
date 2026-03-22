import { prisma } from '../../utils/prisma';
import { createAuditLog, generateDiff } from '../../utils/auditLog';
import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors';
import { Role, Team, TeamWithRelations, PaginatedResponse } from 'shared';
import { CreateTeamInput, UpdateTeamInput, ListTeamsQuery } from './teams.schema';
import { TokenPayload } from '../../utils/jwt';

export class TeamsService {
  private async getOrCreateOrganisation(): Promise<string> {
    let org = await prisma.organisation.findFirst();
    if (!org) {
      org = await prisma.organisation.create({
        data: {
          name: 'Church',
          timezone: 'Africa/Lagos',
        },
      });
    }
    return org.id;
  }

  async listTeams(
    query: ListTeamsQuery,
    currentUser: TokenPayload
  ): Promise<PaginatedResponse<TeamWithRelations>> {
    const { page, limit, search, includeInactive } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Team Heads and Sub-Team Heads can only see their own team
    if (currentUser.role === Role.TEAM_HEAD || currentUser.role === Role.SUB_TEAM_HEAD) {
      where.id = currentUser.teamId;
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          teamHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: { departments: true },
          },
        },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      success: true,
      data: teams.map((t) => ({
        id: t.id,
        name: t.name,
        organisationId: t.organisationId,
        teamHeadId: t.teamHeadId,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        teamHead: t.teamHead ? {
          id: t.teamHead.id,
          email: t.teamHead.email,
          firstName: t.teamHead.firstName,
          lastName: t.teamHead.lastName,
          role: Role.TEAM_HEAD,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        } : null,
        _count: t._count,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTeamById(
    id: string,
    currentUser: TokenPayload
  ): Promise<TeamWithRelations> {
    // Team Heads and Sub-Team Heads can only view their own team
    if ((currentUser.role === Role.TEAM_HEAD || currentUser.role === Role.SUB_TEAM_HEAD) && currentUser.teamId !== id) {
      throw new ForbiddenError('Access denied to this team');
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        teamHead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        departments: {
          where: { isActive: true },
          include: {
            hod: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: { members: { where: { isActive: true } } },
            },
          },
        },
        _count: {
          select: { departments: { where: { isActive: true } } },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team');
    }

    return {
      id: team.id,
      name: team.name,
      organisationId: team.organisationId,
      teamHeadId: team.teamHeadId,
      isActive: team.isActive,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      teamHead: team.teamHead ? {
        id: team.teamHead.id,
        email: team.teamHead.email,
        firstName: team.teamHead.firstName,
        lastName: team.teamHead.lastName,
        role: Role.TEAM_HEAD,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      } : null,
      departments: team.departments.map((d) => ({
        id: d.id,
        name: d.name,
        teamId: d.teamId,
        hodId: d.hodId,
        assistantHodId: d.assistantHodId,
        isActive: d.isActive,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      _count: team._count,
    };
  }

  async createTeam(
    input: CreateTeamInput,
    currentUser: TokenPayload
  ): Promise<Team> {
    const { name, teamHeadId } = input;

    // Only Admins can create teams
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only Admins can create teams');
    }

    const organisationId = await this.getOrCreateOrganisation();

    // Check for duplicate name
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        organisationId,
      },
    });

    if (existingTeam) {
      throw new ConflictError('A team with this name already exists');
    }

    // Verify team head if provided
    if (teamHeadId) {
      const user = await prisma.user.findUnique({
        where: { id: teamHeadId },
        include: { teamAsHead: true },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.role !== Role.TEAM_HEAD) {
        throw new ConflictError('User must have TEAM_HEAD role');
      }

      if (user.teamAsHead) {
        throw new ConflictError('User is already assigned as head of another team');
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        organisationId,
        teamHeadId,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'CREATE',
      entityType: 'Team',
      entityId: team.id,
      diff: { name, teamHeadId },
    });

    return {
      id: team.id,
      name: team.name,
      organisationId: team.organisationId,
      teamHeadId: team.teamHeadId,
      isActive: team.isActive,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  async updateTeam(
    id: string,
    input: UpdateTeamInput,
    currentUser: TokenPayload
  ): Promise<Team> {
    // Only Admins can update teams
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only Admins can update teams');
    }

    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });

    if (!existingTeam) {
      throw new NotFoundError('Team');
    }

    // Check for duplicate name
    if (input.name) {
      const duplicateName = await prisma.team.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          organisationId: existingTeam.organisationId,
          id: { not: id },
        },
      });

      if (duplicateName) {
        throw new ConflictError('A team with this name already exists');
      }
    }

    // Verify new team head if provided
    if (input.teamHeadId) {
      const user = await prisma.user.findUnique({
        where: { id: input.teamHeadId },
        include: { teamAsHead: true },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.role !== Role.TEAM_HEAD) {
        throw new ConflictError('User must have TEAM_HEAD role');
      }

      if (user.teamAsHead && user.teamAsHead.id !== id) {
        throw new ConflictError('User is already assigned as head of another team');
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.teamHeadId !== undefined && { teamHeadId: input.teamHeadId }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    // Create audit log
    const diff = generateDiff(
      {
        name: existingTeam.name,
        teamHeadId: existingTeam.teamHeadId,
        isActive: existingTeam.isActive,
      },
      {
        name: team.name,
        teamHeadId: team.teamHeadId,
        isActive: team.isActive,
      }
    );

    if (Object.keys(diff).length > 0) {
      await createAuditLog({
        userId: currentUser.userId,
        userRole: currentUser.role as Role,
        action: 'UPDATE',
        entityType: 'Team',
        entityId: team.id,
        diff,
      });
    }

    return {
      id: team.id,
      name: team.name,
      organisationId: team.organisationId,
      teamHeadId: team.teamHeadId,
      isActive: team.isActive,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  async deactivateTeam(
    id: string,
    currentUser: TokenPayload
  ): Promise<void> {
    // Only Admins can deactivate teams
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only Admins can deactivate teams');
    }

    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });

    if (!existingTeam) {
      throw new NotFoundError('Team');
    }

    await prisma.team.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'DELETE',
      entityType: 'Team',
      entityId: id,
      diff: { isActive: { old: true, new: false } },
    });
  }
}

export const teamsService = new TeamsService();
