import { prisma } from '../../utils/prisma';
import { createAuditLog, generateDiff } from '../../utils/auditLog';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { Role, Department, DepartmentWithRelations, PaginatedResponse } from 'shared';
import { CreateDepartmentInput, UpdateDepartmentInput, AssignHODInput, ListDepartmentsQuery } from './departments.schema';
import { TokenPayload } from '../../utils/jwt';

export class DepartmentsService {
  async listDepartments(
    query: ListDepartmentsQuery,
    currentUser: TokenPayload
  ): Promise<PaginatedResponse<DepartmentWithRelations>> {
    const { page, limit, teamId, search, includeInactive } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Role-based filtering
    if (currentUser.role === Role.TEAM_HEAD) {
      where.teamId = currentUser.teamId;
    } else if (currentUser.role === Role.HOD) {
      where.id = currentUser.departmentId;
    } else if (teamId) {
      where.teamId = teamId;
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
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
          _count: {
            select: { members: { where: { isActive: true } } },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      success: true,
      data: departments.map((d) => ({
        id: d.id,
        name: d.name,
        teamId: d.teamId,
        hodId: d.hodId,
        isActive: d.isActive,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        team: d.team as any,
        hod: d.hod ? {
          id: d.hod.id,
          email: d.hod.email,
          firstName: d.hod.firstName,
          lastName: d.hod.lastName,
          role: Role.HOD,
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

  async getDepartmentById(
    id: string,
    currentUser: TokenPayload
  ): Promise<DepartmentWithRelations> {
    const department = await prisma.department.findUnique({
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
      throw new NotFoundError('Department');
    }

    // Permission checks
    if (currentUser.role === Role.TEAM_HEAD && department.teamId !== currentUser.teamId) {
      throw new ForbiddenError('Access denied to this department');
    }

    if (currentUser.role === Role.HOD && department.id !== currentUser.departmentId) {
      throw new ForbiddenError('Access denied to this department');
    }

    return {
      id: department.id,
      name: department.name,
      teamId: department.teamId,
      hodId: department.hodId,
      isActive: department.isActive,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
      team: department.team as any,
      hod: department.hod ? {
        id: department.hod.id,
        email: department.hod.email,
        firstName: department.hod.firstName,
        lastName: department.hod.lastName,
        role: Role.HOD,
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

  async createDepartment(
    input: CreateDepartmentInput,
    currentUser: TokenPayload
  ): Promise<Department> {
    const { name } = input;
    let teamId = input.teamId;

    // Team Heads can only create departments in their own team
    if (currentUser.role === Role.TEAM_HEAD) {
      if (!currentUser.teamId) {
        throw new ForbiddenError('You are not assigned to any team');
      }
      teamId = currentUser.teamId;
    } else if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only Admins and Team Heads can create departments');
    }

    if (!teamId) {
      throw new BadRequestError('Team ID is required');
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team');
    }

    // Check for duplicate name within the team
    const existingDept = await prisma.department.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        teamId,
      },
    });

    if (existingDept) {
      throw new ConflictError('A department with this name already exists in this team');
    }

    const department = await prisma.department.create({
      data: {
        name,
        teamId,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
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
      isActive: department.isActive,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    };
  }

  async updateDepartment(
    id: string,
    input: UpdateDepartmentInput,
    currentUser: TokenPayload
  ): Promise<Department> {
    const existingDept = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDept) {
      throw new NotFoundError('Department');
    }

    const requestedTeamId = input.teamId;
    const targetTeamId = requestedTeamId ?? existingDept.teamId;

    // Permission checks
    if (currentUser.role === Role.TEAM_HEAD && existingDept.teamId !== currentUser.teamId) {
      throw new ForbiddenError('Access denied to this department');
    }

    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.TEAM_HEAD) {
      throw new ForbiddenError('Only Admins and Team Heads can update departments');
    }

    // Team Heads can only move departments within their own team
    if (currentUser.role === Role.TEAM_HEAD && requestedTeamId && requestedTeamId !== currentUser.teamId) {
      throw new ForbiddenError('Access denied to change department team');
    }

    // If team is changing, verify the team exists
    if (requestedTeamId && requestedTeamId !== existingDept.teamId) {
      const team = await prisma.team.findUnique({ where: { id: requestedTeamId } });
      if (!team) {
        throw new NotFoundError('Team');
      }
    }

    // Check for duplicate name
    if (input.name) {
      const duplicateName = await prisma.department.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          teamId: targetTeamId,
          id: { not: id },
        },
      });

      if (duplicateName) {
        throw new ConflictError('A department with this name already exists in this team');
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(requestedTeamId && { teamId: requestedTeamId }),
      },
    });

    // Create audit log
    const diff = generateDiff(
      {
        name: existingDept.name,
        isActive: existingDept.isActive,
        teamId: existingDept.teamId,
      },
      {
        name: department.name,
        isActive: department.isActive,
        teamId: department.teamId,
      }
    );

    if (Object.keys(diff).length > 0) {
      await createAuditLog({
        userId: currentUser.userId,
        userRole: currentUser.role as Role,
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
      isActive: department.isActive,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    };
  }

  async assignHOD(
    id: string,
    input: AssignHODInput,
    currentUser: TokenPayload
  ): Promise<Department> {
    const { hodId } = input;

    const existingDept = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDept) {
      throw new NotFoundError('Department');
    }

    // Permission checks
    if (currentUser.role === Role.TEAM_HEAD && existingDept.teamId !== currentUser.teamId) {
      throw new ForbiddenError('Access denied to this department');
    }

    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.TEAM_HEAD) {
      throw new ForbiddenError('Only Admins and Team Heads can assign HODs');
    }

    // If assigning a new HOD
    if (hodId) {
      const user = await prisma.user.findUnique({
        where: { id: hodId },
        include: { departmentAsHOD: true },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.role !== Role.HOD) {
        throw new ConflictError('User must have HOD role');
      }

      if (user.departmentAsHOD && user.departmentAsHOD.id !== id) {
        throw new ConflictError('User is already assigned as HOD of another department');
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: { hodId },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
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
      isActive: department.isActive,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    };
  }

  async deactivateDepartment(
    id: string,
    currentUser: TokenPayload
  ): Promise<void> {
    const existingDept = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDept) {
      throw new NotFoundError('Department');
    }

    // Permission checks
    if (currentUser.role === Role.TEAM_HEAD && existingDept.teamId !== currentUser.teamId) {
      throw new ForbiddenError('Access denied to this department');
    }

    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.TEAM_HEAD) {
      throw new ForbiddenError('Only Admins and Team Heads can deactivate departments');
    }

    await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'DELETE',
      entityType: 'Department',
      entityId: id,
      diff: { isActive: { old: true, new: false } },
    });
  }
}

export const departmentsService = new DepartmentsService();
