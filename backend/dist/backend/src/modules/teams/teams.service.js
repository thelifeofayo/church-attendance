"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsService = exports.TeamsService = void 0;
const prisma_1 = require("../../utils/prisma");
const auditLog_1 = require("../../utils/auditLog");
const errors_1 = require("../../utils/errors");
const shared_1 = require("shared");
class TeamsService {
    async getOrCreateOrganisation() {
        let org = await prisma_1.prisma.organisation.findFirst();
        if (!org) {
            org = await prisma_1.prisma.organisation.create({
                data: {
                    name: 'Church',
                    timezone: 'Africa/Lagos',
                },
            });
        }
        return org.id;
    }
    async listTeams(query, currentUser) {
        const { page, limit, search, includeInactive } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (!includeInactive) {
            where.isActive = true;
        }
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        // Team Heads and Sub-Team Heads can only see their own team
        if (currentUser.role === shared_1.Role.TEAM_HEAD || currentUser.role === shared_1.Role.SUB_TEAM_HEAD) {
            where.id = currentUser.teamId;
        }
        const [teams, total] = await Promise.all([
            prisma_1.prisma.team.findMany({
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
            prisma_1.prisma.team.count({ where }),
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
                    role: shared_1.Role.TEAM_HEAD,
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
    async getTeamById(id, currentUser) {
        // Team Heads and Sub-Team Heads can only view their own team
        if ((currentUser.role === shared_1.Role.TEAM_HEAD || currentUser.role === shared_1.Role.SUB_TEAM_HEAD) && currentUser.teamId !== id) {
            throw new errors_1.ForbiddenError('Access denied to this team');
        }
        const team = await prisma_1.prisma.team.findUnique({
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
            throw new errors_1.NotFoundError('Team');
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
                role: shared_1.Role.TEAM_HEAD,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            } : null,
            departments: team.departments.map((d) => ({
                id: d.id,
                name: d.name,
                teamId: d.teamId,
                hodId: d.hodId,
                isActive: d.isActive,
                createdAt: d.createdAt.toISOString(),
                updatedAt: d.updatedAt.toISOString(),
            })),
            _count: team._count,
        };
    }
    async createTeam(input, currentUser) {
        const { name, teamHeadId } = input;
        // Only Admins can create teams
        if (currentUser.role !== shared_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only Admins can create teams');
        }
        const organisationId = await this.getOrCreateOrganisation();
        // Check for duplicate name
        const existingTeam = await prisma_1.prisma.team.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                organisationId,
            },
        });
        if (existingTeam) {
            throw new errors_1.ConflictError('A team with this name already exists');
        }
        // Verify team head if provided
        if (teamHeadId) {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: teamHeadId },
                include: { teamAsHead: true },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User');
            }
            if (user.role !== shared_1.Role.TEAM_HEAD) {
                throw new errors_1.ConflictError('User must have TEAM_HEAD role');
            }
            if (user.teamAsHead) {
                throw new errors_1.ConflictError('User is already assigned as head of another team');
            }
        }
        const team = await prisma_1.prisma.team.create({
            data: {
                name,
                organisationId,
                teamHeadId,
            },
        });
        // Create audit log
        await (0, auditLog_1.createAuditLog)({
            userId: currentUser.userId,
            userRole: currentUser.role,
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
    async updateTeam(id, input, currentUser) {
        // Only Admins can update teams
        if (currentUser.role !== shared_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only Admins can update teams');
        }
        const existingTeam = await prisma_1.prisma.team.findUnique({
            where: { id },
        });
        if (!existingTeam) {
            throw new errors_1.NotFoundError('Team');
        }
        // Check for duplicate name
        if (input.name) {
            const duplicateName = await prisma_1.prisma.team.findFirst({
                where: {
                    name: { equals: input.name, mode: 'insensitive' },
                    organisationId: existingTeam.organisationId,
                    id: { not: id },
                },
            });
            if (duplicateName) {
                throw new errors_1.ConflictError('A team with this name already exists');
            }
        }
        // Verify new team head if provided
        if (input.teamHeadId) {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: input.teamHeadId },
                include: { teamAsHead: true },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User');
            }
            if (user.role !== shared_1.Role.TEAM_HEAD) {
                throw new errors_1.ConflictError('User must have TEAM_HEAD role');
            }
            if (user.teamAsHead && user.teamAsHead.id !== id) {
                throw new errors_1.ConflictError('User is already assigned as head of another team');
            }
        }
        const team = await prisma_1.prisma.team.update({
            where: { id },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.teamHeadId !== undefined && { teamHeadId: input.teamHeadId }),
                ...(input.isActive !== undefined && { isActive: input.isActive }),
            },
        });
        // Create audit log
        const diff = (0, auditLog_1.generateDiff)({
            name: existingTeam.name,
            teamHeadId: existingTeam.teamHeadId,
            isActive: existingTeam.isActive,
        }, {
            name: team.name,
            teamHeadId: team.teamHeadId,
            isActive: team.isActive,
        });
        if (Object.keys(diff).length > 0) {
            await (0, auditLog_1.createAuditLog)({
                userId: currentUser.userId,
                userRole: currentUser.role,
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
    async deactivateTeam(id, currentUser) {
        // Only Admins can deactivate teams
        if (currentUser.role !== shared_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only Admins can deactivate teams');
        }
        const existingTeam = await prisma_1.prisma.team.findUnique({
            where: { id },
        });
        if (!existingTeam) {
            throw new errors_1.NotFoundError('Team');
        }
        await prisma_1.prisma.team.update({
            where: { id },
            data: { isActive: false },
        });
        // Create audit log
        await (0, auditLog_1.createAuditLog)({
            userId: currentUser.userId,
            userRole: currentUser.role,
            action: 'DELETE',
            entityType: 'Team',
            entityId: id,
            diff: { isActive: { old: true, new: false } },
        });
    }
}
exports.TeamsService = TeamsService;
exports.teamsService = new TeamsService();
//# sourceMappingURL=teams.service.js.map