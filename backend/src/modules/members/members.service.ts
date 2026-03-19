import { prisma } from '../../utils/prisma';
import { createAuditLog, generateDiff } from '../../utils/auditLog';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { Role, Member, MemberWithRelations, PaginatedResponse } from 'shared';
import { CreateMemberInput, UpdateMemberInput, ListMembersQuery } from './members.schema';
import { TokenPayload } from '../../utils/jwt';

export class MembersService {
  async listMembers(
    query: ListMembersQuery,
    currentUser: TokenPayload
  ): Promise<PaginatedResponse<Member>> {
    // Only HODs can list members (of their own department)
    if (currentUser.role !== Role.HOD) {
      throw new ForbiddenError('Only HODs can access member list');
    }

    if (!currentUser.departmentId) {
      throw new ForbiddenError('You are not assigned to any department');
    }

    const { page, limit, search, includeInactive } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      departmentId: currentUser.departmentId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.member.count({ where }),
    ]);

    return {
      success: true,
      data: members.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        departmentId: m.departmentId,
        createdById: m.createdById,
        isActive: m.isActive,
        birthMonth: m.birthMonth,
        birthDay: m.birthDay,
        phoneNumber: m.phoneNumber,
        email: m.email,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMemberById(
    id: string,
    currentUser: TokenPayload
  ): Promise<MemberWithRelations> {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!member) {
      throw new NotFoundError('Member');
    }

    // Permission check - HODs can only see members in their department
    if (currentUser.role === Role.HOD && member.departmentId !== currentUser.departmentId) {
      throw new ForbiddenError('Access denied to this member');
    }

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      departmentId: member.departmentId,
      createdById: member.createdById,
      isActive: member.isActive,
      birthMonth: member.birthMonth,
      birthDay: member.birthDay,
      phoneNumber: member.phoneNumber,
      email: member.email,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      department: member.department as any,
      createdBy: member.createdBy ? {
        id: member.createdBy.id,
        email: '',
        firstName: member.createdBy.firstName,
        lastName: member.createdBy.lastName,
        role: Role.HOD,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      } : undefined,
    };
  }

  async createMember(
    input: CreateMemberInput,
    currentUser: TokenPayload
  ): Promise<Member> {
    // Only HODs can create members
    if (currentUser.role !== Role.HOD) {
      throw new ForbiddenError('Only HODs can add members');
    }

    if (!currentUser.departmentId) {
      throw new ForbiddenError('You are not assigned to any department');
    }

    const { firstName, lastName, birthMonth, birthDay, phoneNumber, email } = input;

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        departmentId: currentUser.departmentId,
        createdById: currentUser.userId,
        birthMonth: birthMonth || null,
        birthDay: birthDay || null,
        phoneNumber: phoneNumber || null,
        email: email || null,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'CREATE',
      entityType: 'Member',
      entityId: member.id,
      diff: { firstName, lastName, departmentId: currentUser.departmentId, birthMonth, birthDay, phoneNumber, email },
    });

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      departmentId: member.departmentId,
      createdById: member.createdById,
      isActive: member.isActive,
      birthMonth: member.birthMonth,
      birthDay: member.birthDay,
      phoneNumber: member.phoneNumber,
      email: member.email,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  }

  async updateMember(
    id: string,
    input: UpdateMemberInput,
    currentUser: TokenPayload
  ): Promise<Member> {
    const existingMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      throw new NotFoundError('Member');
    }

    // Permission check - HODs can only update members in their department
    if (currentUser.role !== Role.HOD) {
      throw new ForbiddenError('Only HODs can update members');
    }

    if (existingMember.departmentId !== currentUser.departmentId) {
      throw new ForbiddenError('Access denied to this member');
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.birthMonth !== undefined && { birthMonth: input.birthMonth }),
        ...(input.birthDay !== undefined && { birthDay: input.birthDay }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber || null }),
        ...(input.email !== undefined && { email: input.email || null }),
      },
    });

    // Create audit log
    const diff = generateDiff(
      {
        firstName: existingMember.firstName,
        lastName: existingMember.lastName,
        isActive: existingMember.isActive,
        birthMonth: existingMember.birthMonth,
        birthDay: existingMember.birthDay,
        phoneNumber: existingMember.phoneNumber,
        email: existingMember.email,
      },
      {
        firstName: member.firstName,
        lastName: member.lastName,
        isActive: member.isActive,
        birthMonth: member.birthMonth,
        birthDay: member.birthDay,
        phoneNumber: member.phoneNumber,
        email: member.email,
      }
    );

    if (Object.keys(diff).length > 0) {
      await createAuditLog({
        userId: currentUser.userId,
        userRole: currentUser.role as Role,
        action: 'UPDATE',
        entityType: 'Member',
        entityId: member.id,
        diff,
      });
    }

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      departmentId: member.departmentId,
      createdById: member.createdById,
      isActive: member.isActive,
      birthMonth: member.birthMonth,
      birthDay: member.birthDay,
      phoneNumber: member.phoneNumber,
      email: member.email,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  }

  async deactivateMember(
    id: string,
    currentUser: TokenPayload
  ): Promise<void> {
    const existingMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      throw new NotFoundError('Member');
    }

    // Permission check - HODs can only deactivate members in their department
    if (currentUser.role !== Role.HOD) {
      throw new ForbiddenError('Only HODs can deactivate members');
    }

    if (existingMember.departmentId !== currentUser.departmentId) {
      throw new ForbiddenError('Access denied to this member');
    }

    await prisma.member.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'DELETE',
      entityType: 'Member',
      entityId: id,
      diff: { isActive: { old: true, new: false } },
    });
  }

  async reactivateMember(
    id: string,
    currentUser: TokenPayload
  ): Promise<void> {
    const existingMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      throw new NotFoundError('Member');
    }

    // Permission check - HODs can only reactivate members in their department
    if (currentUser.role !== Role.HOD) {
      throw new ForbiddenError('Only HODs can reactivate members');
    }

    if (existingMember.departmentId !== currentUser.departmentId) {
      throw new ForbiddenError('Access denied to this member');
    }

    await prisma.member.update({
      where: { id },
      data: { isActive: true },
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'UPDATE',
      entityType: 'Member',
      entityId: id,
      diff: { isActive: { old: false, new: true } },
    });
  }
}

export const membersService = new MembersService();
