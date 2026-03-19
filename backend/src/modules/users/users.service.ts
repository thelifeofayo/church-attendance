import { prisma } from '../../utils/prisma';
import { hashPassword } from '../../utils/password';
import { createAuditLog, generateDiff } from '../../utils/auditLog';
import { ForbiddenError, NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import { Role, User, UserWithRelations, PaginatedResponse } from 'shared';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema';
import { TokenPayload } from '../../utils/jwt';
import { v4 as uuidv4 } from 'uuid';

export class UsersService {
  async listUsers(
    query: ListUsersQuery,
    currentUser: TokenPayload
  ): Promise<PaginatedResponse<User>> {
    const { page, limit, role, teamId, search, includeInactive } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on current user's role
    const where: Record<string, unknown> = {};

    // Filter by active status
    if (!includeInactive) {
      where.isActive = true;
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Team filter (for Team Heads, restrict to their team)
    if (currentUser.role === Role.TEAM_HEAD) {
      // Team Heads can only see HODs in their team
      where.role = Role.HOD;
      where.departmentAsHOD = {
        team: { id: currentUser.teamId },
      };
    } else if (teamId) {
      // Admin filtering by team
      where.OR = [
        { teamAsHead: { id: teamId } },
        { departmentAsHOD: { teamId } },
      ];
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          birthMonth: true,
          birthDay: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
          teamAsHead: { select: { id: true, name: true } },
          departmentAsHOD: {
            select: {
              id: true,
              name: true,
              team: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users.map((u) => ({
        ...u,
        role: u.role as Role,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(
    id: string,
    currentUser: TokenPayload
  ): Promise<UserWithRelations> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        teamAsHead: { select: { id: true, name: true } },
        departmentAsHOD: {
          select: {
            id: true,
            name: true,
            team: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Team Heads can only view HODs in their team
    if (currentUser.role === Role.TEAM_HEAD) {
      if (user.role !== Role.HOD) {
        throw new ForbiddenError('Access denied');
      }
      if (user.departmentAsHOD?.team.id !== currentUser.teamId) {
        throw new ForbiddenError('Access denied to users outside your team');
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      teamAsHead: user.teamAsHead as any,
      departmentAsHOD: user.departmentAsHOD as any,
    };
  }

  async createUser(
    input: CreateUserInput,
    currentUser: TokenPayload
  ): Promise<User & { temporaryPassword: string }> {
    const DEFAULT_PASSWORD = 'Password123';

    const { email, firstName, lastName, role, teamId, departmentId, birthMonth, birthDay, phoneNumber } = input;

    // Permission checks
    if (currentUser.role === Role.TEAM_HEAD) {
      // Team Heads can only create HODs
      if (role !== Role.HOD) {
        throw new ForbiddenError('Team Heads can only create HOD accounts');
      }
    }

    // Admin can create any role
    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.TEAM_HEAD) {
      throw new ForbiddenError('Insufficient permissions to create users');
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Always set the default onboarding password.
    // We also set resetToken/resetTokenExpiry to force the user to change it on first login.
    const tempPassword = DEFAULT_PASSWORD;
    // Tag the onboarding default-password requirement so forgot-password flows
    // don't accidentally force users to change on login.
    const resetToken = `DEFAULT_${uuidv4()}`;
    const resetTokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        role,
        passwordHash,
        resetToken,
        resetTokenExpiry,
        ...(birthMonth !== undefined && { birthMonth }),
        ...(birthDay !== undefined && { birthDay }),
        ...(phoneNumber !== undefined && { phoneNumber }),
      },
    });

    // Handle role-specific assignments
    if (role === Role.TEAM_HEAD && teamId) {
      // Verify team exists and doesn't have a head
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundError('Team');
      }

      if (team.teamHeadId) {
        throw new ConflictError('This team already has a Team Head assigned');
      }

      await prisma.team.update({
        where: { id: teamId },
        data: { teamHeadId: user.id },
      });
    }

    if (role === Role.HOD && departmentId) {
      // Verify department exists and belongs to current user's team (if Team Head)
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { team: true },
      });

      if (!department) {
        throw new NotFoundError('Department');
      }

      if (currentUser.role === Role.TEAM_HEAD && department.teamId !== currentUser.teamId) {
        throw new ForbiddenError('Cannot assign HOD to department outside your team');
      }

      if (department.hodId) {
        throw new ConflictError('This department already has an HOD assigned');
      }

      await prisma.department.update({
        where: { id: departmentId },
        data: { hodId: user.id },
      });
    }

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      diff: { email, firstName, lastName, role },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      isActive: user.isActive,
      birthMonth: user.birthMonth,
      birthDay: user.birthDay,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      temporaryPassword: tempPassword,
    };
  }

  async updateUser(
    id: string,
    input: UpdateUserInput,
    currentUser: TokenPayload
  ): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        departmentAsHOD: { select: { teamId: true } },
      },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Permission checks for Team Heads
    if (currentUser.role === Role.TEAM_HEAD) {
      if (existingUser.role !== Role.HOD) {
        throw new ForbiddenError('Team Heads can only update HOD accounts');
      }
      if (existingUser.departmentAsHOD?.teamId !== currentUser.teamId) {
        throw new ForbiddenError('Access denied to users outside your team');
      }
    }

    // Check email uniqueness if being updated
    if (input.email && input.email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictError('A user with this email already exists');
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.email && { email: input.email.toLowerCase() }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.birthMonth !== undefined && { birthMonth: input.birthMonth }),
        ...(input.birthDay !== undefined && { birthDay: input.birthDay }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
      },
    });

    // Create audit log
    const diff = generateDiff(
      {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        isActive: existingUser.isActive,
      },
      {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive,
      }
    );

    if (Object.keys(diff).length > 0) {
      await createAuditLog({
        userId: currentUser.userId,
        userRole: currentUser.role as Role,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        diff,
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      isActive: user.isActive,
      birthMonth: user.birthMonth,
      birthDay: user.birthDay,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async deactivateUser(
    id: string,
    currentUser: TokenPayload
  ): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        departmentAsHOD: { select: { teamId: true } },
      },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Cannot deactivate yourself
    if (existingUser.id === currentUser.userId) {
      throw new BadRequestError('Cannot deactivate your own account');
    }

    // Permission checks for Team Heads
    if (currentUser.role === Role.TEAM_HEAD) {
      if (existingUser.role !== Role.HOD) {
        throw new ForbiddenError('Team Heads can only deactivate HOD accounts');
      }
      if (existingUser.departmentAsHOD?.teamId !== currentUser.teamId) {
        throw new ForbiddenError('Access denied to users outside your team');
      }
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      diff: { isActive: { old: true, new: false } },
    });
  }
}

export const usersService = new UsersService();
