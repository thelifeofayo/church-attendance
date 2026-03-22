"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentsService = exports.DepartmentsService = void 0;
const prisma_1 = require("../../utils/prisma");
const auditLog_1 = require("../../utils/auditLog");
const errors_1 = require("../../utils/errors");
const shared_1 = require("shared");
class DepartmentsService {
    async ensureUserIsMember(userId, departmentId, createdById) {
        // Get user details first
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                birthMonth: true,
                birthDay: true,
                phoneNumber: true,
                email: true,
            },
        });
        if (!user)
            return;
        // Check if user is already a member of this department
        // We'll check by matching name and email (if available)
        const existingMember = await prisma_1.prisma.member.findFirst({
            where: {
                departmentId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email || null,
            },
        });
        if (!existingMember) {
            // Create member record
            await prisma_1.prisma.member.create({
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    departmentId,
                    createdById,
                    birthMonth: user.birthMonth,
                    birthDay: user.birthDay,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                },
            });
        }
    }
    async listDepartments(query, currentUser) {
        const { page, limit, teamId, search, includeInactive } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (!includeInactive) {
            where.isActive = true;
        }
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        // Role-based filtering
        if (currentUser.role === shared_1.Role.TEAM_HEAD || currentUser.role === shared_1.Role.SUB_TEAM_HEAD) {
            where.teamId = currentUser.teamId;
        }
        else if (currentUser.role === shared_1.Role.HOD || currentUser.role === shared_1.Role.ASSISTANT_HOD) {
            where.id = currentUser.departmentId;
        }
        else if (teamId) {
            where.teamId = teamId;
        }
        const [departments, total] = await Promise.all([
            prisma_1.prisma.department.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    team: { select: { id: true, name: true } },
                    hod: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    assistantHod: {
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
            }),
            prisma_1.prisma.department.count({ where }),
        ]);
        return {
            success: true,
            data: departments.map((d) => ({
                id: d.id,
                name: d.name,
                teamId: d.teamId,
                hodId: d.hodId,
                assistantHodId: d.assistantHodId,
                isActive: d.isActive,
                createdAt: d.createdAt.toISOString(),
                updatedAt: d.updatedAt.toISOString(),
                team: d.team,
                hod: d.hod ? {
                    id: d.hod.id,
                    email: d.hod.email,
                    firstName: d.hod.firstName,
                    lastName: d.hod.lastName,
                    role: shared_1.Role.HOD,
                    isActive: true,
                    createdAt: '',
                    updatedAt: '',
                } : null,
                assistantHod: d.assistantHod ? {
                    id: d.assistantHod.id,
                    email: d.assistantHod.email,
                    firstName: d.assistantHod.firstName,
                    lastName: d.assistantHod.lastName,
                    role: shared_1.Role.ASSISTANT_HOD,
                    isActive: true,
                    createdAt: '',
                    updatedAt: '',
                } : null,
                _count: d._count,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getDepartmentById(id, currentUser) {
        const department = await prisma_1.prisma.department.findUnique({
            where: { id },
            include: {
                team: { select: { id: true, name: true } },
                hod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                assistantHod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                members: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        isActive: true,
                        createdAt: true,
                    },
                    orderBy: { firstName: 'asc' },
                },
                _count: {
                    select: { members: { where: { isActive: true } } },
                },
            },
        });
        if (!department) {
            throw new errors_1.NotFoundError('Department');
        }
        // Permission checks
        if ((currentUser.role === shared_1.Role.TEAM_HEAD || currentUser.role === shared_1.Role.SUB_TEAM_HEAD) && department.teamId !== currentUser.teamId) {
            throw new errors_1.ForbiddenError('Access denied to this department');
        }
        if ((currentUser.role === shared_1.Role.HOD || currentUser.role === shared_1.Role.ASSISTANT_HOD) && department.id !== currentUser.departmentId) {
            throw new errors_1.ForbiddenError('Access denied to this department');
        }
        return {
            id: department.id,
            name: department.name,
            teamId: department.teamId,
            hodId: department.hodId,
            assistantHodId: department.assistantHodId,
            isActive: department.isActive,
            createdAt: department.createdAt.toISOString(),
            updatedAt: department.updatedAt.toISOString(),
            team: department.team,
            hod: department.hod ? {
                id: department.hod.id,
                email: department.hod.email,
                firstName: department.hod.firstName,
                lastName: department.hod.lastName,
                role: shared_1.Role.HOD,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            } : null,
            assistantHod: department.assistantHod ? {
                id: department.assistantHod.id,
                email: department.assistantHod.email,
                firstName: department.assistantHod.firstName,
                lastName: department.assistantHod.lastName,
                role: shared_1.Role.ASSISTANT_HOD,
                isActive: true,
                createdAt: '',
                updatedAt: '',
            } : null,
            members: department.members.map((m) => ({
                id: m.id,
                firstName: m.firstName,
                lastName: m.lastName,
                departmentId: department.id,
                createdById: '',
                isActive: m.isActive,
                birthMonth: null,
                birthDay: null,
                phoneNumber: null,
                email: null,
                createdAt: m.createdAt.toISOString(),
                updatedAt: '',
            })),
            _count: department._count,
        };
    }
    async createDepartment(input, currentUser) {
        const { name } = input;
        let teamId = input.teamId;
        // Team Heads can only create departments in their own team
        if (currentUser.role === shared_1.Role.TEAM_HEAD) {
            if (!currentUser.teamId) {
                throw new errors_1.ForbiddenError('You are not assigned to any team');
            }
            teamId = currentUser.teamId;
        }
        else if (currentUser.role !== shared_1.Role.ADMIN) {
            throw new errors_1.ForbiddenError('Only Admins and Team Heads can create departments');
        }
        if (!teamId) {
            throw new errors_1.BadRequestError('Team ID is required');
        }
        // Verify team exists
        const team = await prisma_1.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team) {
            throw new errors_1.NotFoundError('Team');
        }
        // Check for duplicate name within the team
        const existingDept = await prisma_1.prisma.department.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                teamId,
            },
        });
        if (existingDept) {
            throw new errors_1.ConflictError('A department with this name already exists in this team');
        }
        const department = await prisma_1.prisma.department.create({
            data: {
                name,
                teamId,
            },
        });
        // Create audit log
        await (0, auditLog_1.createAuditLog)({
            userId: currentUser.userId,
            userRole: currentUser.role,
            action: 'CREATE',
            entityType: 'Department',
            entityId: department.id,
            diff: { name, teamId },
        });
        return {
            id: department.id,
            name: department.name,
            teamId: department.teamId,
            hodId: department.hodId,
            assistantHodId: department.assistantHodId,
            isActive: department.isActive,
            createdAt: department.createdAt.toISOString(),
            updatedAt: department.updatedAt.toISOString(),
        };
    }
    async updateDepartment(id, input, currentUser) {
        const existingDept = await prisma_1.prisma.department.findUnique({
            where: { id },
        });
        if (!existingDept) {
            throw new errors_1.NotFoundError('Department');
        }
        const requestedTeamId = input.teamId;
        const targetTeamId = requestedTeamId ?? existingDept.teamId;
        // Permission checks
        if (currentUser.role === shared_1.Role.TEAM_HEAD && existingDept.teamId !== currentUser.teamId) {
            throw new errors_1.ForbiddenError('Access denied to this department');
        }
        if (currentUser.role !== shared_1.Role.ADMIN && currentUser.role !== shared_1.Role.TEAM_HEAD) {
            throw new errors_1.ForbiddenError('Only Admins and Team Heads can update departments');
        }
        // Team Heads can only move departments within their own team
        if (currentUser.role === shared_1.Role.TEAM_HEAD && requestedTeamId && requestedTeamId !== currentUser.teamId) {
            throw new errors_1.ForbiddenError('Access denied to change department team');
        }
        // If team is changing, verify the team exists
        if (requestedTeamId && requestedTeamId !== existingDept.teamId) {
            const team = await prisma_1.prisma.team.findUnique({ where: { id: requestedTeamId } });
            if (!team) {
                throw new errors_1.NotFoundError('Team');
            }
        }
        // Check for duplicate name
        if (input.name) {
            const duplicateName = await prisma_1.prisma.department.findFirst({
                where: {
                    name: { equals: input.name, mode: 'insensitive' },
                    teamId: targetTeamId,
                    id: { not: id },
                },
            });
            if (duplicateName) {
                throw new errors_1.ConflictError('A department with this name already exists in this team');
            }
        }
        const department = await prisma_1.prisma.department.update({
            where: { id },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.isActive !== undefined && { isActive: input.isActive }),
                ...(requestedTeamId && { teamId: requestedTeamId }),
            },
        });
        // Create audit log
        const diff = (0, auditLog_1.generateDiff)({
            name: existingDept.name,
            isActive: existingDept.isActive,
            teamId: existingDept.teamId,
        }, {
            name: department.name,
            isActive: department.isActive,
            teamId: department.teamId,
        });
        if (Object.keys(diff).length > 0) {
            await (0, auditLog_1.createAuditLog)({
                userId: currentUser.userId,
                userRole: currentUser.role,
                action: 'UPDATE',
                entityType: 'Department',
                entityId: department.id,
                diff,
            });
        }
        return {
            id: department.id,
            name: department.name,
            teamId: department.teamId,
            hodId: department.hodId,
            assistantHodId: department.assistantHodId,
            isActive: department.isActive,
            createdAt: department.createdAt.toISOString(),
            updatedAt: department.updatedAt.toISOString(),
        };
    }
    async assignHOD(id, input, currentUser) {
        const { hodId } = input;
        const existingDept = await prisma_1.prisma.department.findUnique({
            where: { id },
        });
        if (!existingDept) {
            throw new errors_1.NotFoundError('Department');
        }
        // Permission checks
        if (currentUser.role === shared_1.Role.TEAM_HEAD && existingDept.teamId !== currentUser.teamId) {
            throw new errors_1.ForbiddenError('Access denied to this department');
        }
        if (currentUser.role !== shared_1.Role.ADMIN && currentUser.role !== shared_1.Role.TEAM_HEAD) {
            throw new errors_1.ForbiddenError('Only Admins and Team Heads can assign HODs');
        }
        // If assigning a new HOD
        if (hodId) {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: hodId },
                include: { departmentAsHOD: true },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User');
            }
            if (user.role !== shared_1.Role.HOD) {
                throw new errors_1.ConflictError('User must have HOD role');
            }
            if (user.departmentAsHOD && user.departmentAsHOD.id !== id) {
                throw new errors_1.ConflictError('User is already assigned as HOD of another department');
            }
        }
        const department = await prisma_1.prisma.department.update({
            where: { id },
            data: { hodId },
        });
        // If an HOD was assigned, ensure they are also a member of the department
        if (hodId) {
            await this.ensureUserIsMember(hodId, id, currentUser.userId);
        }
        // Create audit log
        await (0, auditLog_1.createAuditLog)({
            userId: currentUser.userId,
            userRole: currentUser.role,
            action: 'UPDATE',
            entityType: 'Department',
            entityId: department.id,
            diff: { hodId: { old: existingDept.hodId, new: hodId } },
        });
        return {
            id: department.id,
            name: department.name,
            teamId: department.teamId,
            hodId: department.hodId,
            assistantHodId: department.assistantHodId,
            isActive: department.isActive,
            createdAt: department.createdAt.toISOString(),
            updatedAt: department.updatedAt.toISOString(),
        };
    }
    async assignAssistantHOD(id, input, currentUser) {
        const { assistantHodId } = input;
        const existingDept = await prisma_1.prisma.department.findUnique({
            where: { id },
        });
        if (!existingDept) {
            throw new errors_1.NotFoundError('Department');
        }
        // Permission checks
        if ((currentUser.role === shared_1.Role.TEAM_HEAD || currentUser.role === shared_1.Role.SUB_TEAM_HEAD) && existingDept.teamId !== currentUser.teamId) {
            throw new errors_1.ForbiddenError('Access denied to this department');
        }
        if (currentUser.role !== shared_1.Role.ADMIN && currentUser.role !== shared_1.Role.TEAM_HEAD && currentUser.role !== shared_1.Role.SUB_TEAM_HEAD) {
            throw new errors_1.ForbiddenError('Only Admins and Team Heads can assign Assistant HODs');
        }
        // If assigning a new Assistant HOD
        if (assistantHodId) {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: assistantHodId },
                include: { departmentAsAssistantHOD: true },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User');
            }
            if (user.role !== shared_1.Role.ASSISTANT_HOD) {
                throw new errors_1.ConflictError('User must have ASSISTANT_HOD role');
            }
            if (user.departmentAsAssistantHOD && user.departmentAsAssistantHOD.id !== id) {
                throw new errors_1.ConflictError('User is already assigned as Assistant HOD of another department');
            }
        }
        const department = await prisma_1.prisma.department.update({
            where: { id },
            data: { assistantHodId },
        });
        // If an Assistant HOD was assigned, ensure they are also a member of the department
        if (assistantHodId) {
            await this.ensureUserIsMember(assistantHodId, id, currentUser.userId);
        }
        // Create audit log
        await (0, auditLog_1.createAuditLog)({
            userId: currentUser.userId,
            userRole: currentUser.role,
            action: 'UPDATE',
            entityType: 'Department',
            entityId: department.id,
            diff: { assistantHodId: { old: existingDept.assistantHodId, new: assistantHodId } },
        });
        return {
            id: department.id,
            name: department.name,
            teamId: department.teamId,
            hodId: department.hodId,
            assistantHodId: department.assistantHodId,
            isActive: department.isActive,
            createdAt: department.createdAt.toISOString(),
            updatedAt: department.updatedAt.toISOString(),
        };
    }
    async deactivateDepartment(id, currentUser) {
        const existingDept = await prisma_1.prisma.department.findUnique({
            where: { id },
        });
        if (!existingDept) {
            throw new errors_1.NotFoundError('Department');
        }
        // Permission checks
        if (currentUser.role === shared_1.Role.TEAM_HEAD && existingDept.teamId !== currentUser.teamId) {
            throw new errors_1.ForbiddenError('Access denied to this department');
        }
        if (currentUser.role !== shared_1.Role.ADMIN && currentUser.role !== shared_1.Role.TEAM_HEAD) {
            throw new errors_1.ForbiddenError('Only Admins and Team Heads can deactivate departments');
        }
        await prisma_1.prisma.department.update({
            where: { id },
            data: { isActive: false },
        });
        // Create audit log
        await (0, auditLog_1.createAuditLog)({
            userId: currentUser.userId,
            userRole: currentUser.role,
            action: 'DELETE',
            entityType: 'Department',
            entityId: id,
            diff: { isActive: { old: true, new: false } },
        });
    }
}
exports.DepartmentsService = DepartmentsService;
exports.departmentsService = new DepartmentsService();
//# sourceMappingURL=departments.service.js.map