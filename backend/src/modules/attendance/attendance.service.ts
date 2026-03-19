import { prisma } from '../../utils/prisma';
import { createAuditLog } from '../../utils/auditLog';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { Role, ServiceType, SubmissionStatus, AttendanceRecord, AttendanceRecordWithRelations, PaginatedResponse } from 'shared';
import { SubmitAttendanceInput, UpdateAttendanceInput, ListAttendanceQuery } from './attendance.schema';
import { TokenPayload } from '../../utils/jwt';
import { config } from '../../config';

export class AttendanceService {
  async listAttendanceRecords(
    query: ListAttendanceQuery,
    currentUser: TokenPayload
  ): Promise<PaginatedResponse<AttendanceRecordWithRelations>> {
    const { page, limit, departmentId, teamId, serviceType, status, weekStart, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (currentUser.role === Role.HOD) {
      where.departmentId = currentUser.departmentId;
    } else if (currentUser.role === Role.TEAM_HEAD) {
      where.department = { teamId: currentUser.teamId };
    }

    // Additional filters
    if (departmentId && currentUser.role === Role.ADMIN) {
      where.departmentId = departmentId;
    }

    if (teamId && (currentUser.role === Role.ADMIN)) {
      where.department = { teamId };
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (status) {
      where.status = status;
    }

    // Date filters
    if (weekStart) {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      where.serviceDate = {
        gte: start,
        lte: end,
      };
    } else if (fromDate || toDate) {
      where.serviceDate = {};
      if (fromDate) {
        (where.serviceDate as Record<string, Date>).gte = new Date(fromDate);
      }
      if (toDate) {
        (where.serviceDate as Record<string, Date>).lte = new Date(toDate);
      }
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ serviceDate: 'desc' }, { serviceType: 'asc' }],
        include: {
          department: {
            select: {
              id: true,
              name: true,
              team: { select: { id: true, name: true } },
            },
          },
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          entries: {
            select: {
              isPresent: true,
            },
          },
          _count: {
            select: { entries: true },
          },
        },
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    return {
      success: true,
      data: records.map((r) => ({
        id: r.id,
        departmentId: r.departmentId,
        serviceDate: r.serviceDate.toISOString().split('T')[0],
        serviceType: r.serviceType as ServiceType,
        submittedAt: r.submittedAt?.toISOString() || null,
        submittedById: r.submittedById,
        notes: r.notes,
        isLocked: r.isLocked,
        status: r.status as SubmissionStatus,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        department: r.department as any,
        submittedBy: r.submittedBy ? {
          id: r.submittedBy.id,
          email: '',
          firstName: r.submittedBy.firstName,
          lastName: r.submittedBy.lastName,
          role: Role.HOD,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        } : null,
        entries: r.entries.map((e) => ({ isPresent: e.isPresent })) as any,
        _count: r._count,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAttendanceById(
    id: string,
    currentUser: TokenPayload
  ): Promise<AttendanceRecordWithRelations> {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            teamId: true,
            team: { select: { id: true, name: true } },
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        entries: {
          orderBy: { member: { firstName: 'asc' } },
          select: {
            id: true,
            attendanceRecordId: true,
            memberId: true,
            isPresent: true,
            absenceReason: true,
            createdAt: true,
            updatedAt: true,
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('Attendance record');
    }

    // Permission checks
    if (currentUser.role === Role.HOD && record.departmentId !== currentUser.departmentId) {
      throw new ForbiddenError('Access denied to this attendance record');
    }

    if (currentUser.role === Role.TEAM_HEAD && record.department.teamId !== currentUser.teamId) {
      throw new ForbiddenError('Access denied to this attendance record');
    }

    return {
      id: record.id,
      departmentId: record.departmentId,
      serviceDate: record.serviceDate.toISOString().split('T')[0],
      serviceType: record.serviceType as ServiceType,
      submittedAt: record.submittedAt?.toISOString() || null,
      submittedById: record.submittedById,
      notes: record.notes,
      isLocked: record.isLocked,
      status: record.status as SubmissionStatus,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      department: record.department as any,
      submittedBy: record.submittedBy ? {
        id: record.submittedBy.id,
        email: '',
        firstName: record.submittedBy.firstName,
        lastName: record.submittedBy.lastName,
        role: Role.HOD,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      } : null,
      entries: record.entries.map((e) => ({
        id: e.id,
        attendanceRecordId: e.attendanceRecordId,
        memberId: e.memberId,
        isPresent: e.isPresent,
        absenceReason: e.absenceReason,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        member: {
          id: e.member.id,
          firstName: e.member.firstName,
          lastName: e.member.lastName,
          departmentId: record.departmentId,
          createdById: '',
          isActive: e.member.isActive,
          birthMonth: null,
          birthDay: null,
          phoneNumber: null,
          email: null,
          createdAt: '',
          updatedAt: '',
        },
      })),
    };
  }

  async submitAttendance(
    id: string,
    input: SubmitAttendanceInput,
    currentUser: TokenPayload
  ): Promise<AttendanceRecord> {
    // Only HODs can submit attendance
    if (currentUser.role !== Role.HOD) {
      throw new ForbiddenError('Only HODs can submit attendance');
    }

    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, teamId: true } },
      },
    });

    if (!record) {
      throw new NotFoundError('Attendance record');
    }

    // Permission check
    if (record.departmentId !== currentUser.departmentId) {
      throw new ForbiddenError('Access denied to this attendance record');
    }

    // Check if already locked
    if (record.isLocked) {
      throw new BadRequestError('This attendance record is locked and cannot be modified');
    }

    // Check if already submitted (shouldn't submit twice without edit)
    if (record.status === SubmissionStatus.SUBMITTED) {
      throw new BadRequestError('Attendance already submitted. Use the edit endpoint to modify.');
    }

    const { entries, notes } = input;

    // Verify all members belong to the department
    const memberIds = entries.map((e) => e.memberId);
    const validMembers = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        departmentId: record.departmentId,
        isActive: true,
      },
    });

    if (validMembers.length !== memberIds.length) {
      throw new BadRequestError('One or more invalid member IDs');
    }

    // Create attendance entries and update record
    await prisma.$transaction(async (tx) => {
      // Delete any existing entries
      await tx.attendanceEntry.deleteMany({
        where: { attendanceRecordId: id },
      });

      // Create new entries
      await tx.attendanceEntry.createMany({
        data: entries.map((e) => ({
          attendanceRecordId: id,
          memberId: e.memberId,
          isPresent: e.isPresent,
          absenceReason: e.isPresent ? null : (e.absenceReason || null),
        })),
      });

      // Update record
      await tx.attendanceRecord.update({
        where: { id },
        data: {
          status: SubmissionStatus.SUBMITTED,
          submittedAt: new Date(),
          submittedById: currentUser.userId,
          notes: notes || null,
        },
      });
    });

    // Create audit log
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action: 'SUBMIT',
      entityType: 'AttendanceRecord',
      entityId: id,
      diff: {
        status: SubmissionStatus.SUBMITTED,
        entriesCount: entries.length,
        presentCount: entries.filter((e) => e.isPresent).length,
      },
    });

    const updated = await prisma.attendanceRecord.findUnique({ where: { id } });

    return {
      id: updated!.id,
      departmentId: updated!.departmentId,
      serviceDate: updated!.serviceDate.toISOString().split('T')[0],
      serviceType: updated!.serviceType as ServiceType,
      submittedAt: updated!.submittedAt?.toISOString() || null,
      submittedById: updated!.submittedById,
      notes: updated!.notes,
      isLocked: updated!.isLocked,
      status: updated!.status as SubmissionStatus,
      createdAt: updated!.createdAt.toISOString(),
      updatedAt: updated!.updatedAt.toISOString(),
    };
  }

  async updateAttendance(
    id: string,
    input: UpdateAttendanceInput,
    currentUser: TokenPayload
  ): Promise<AttendanceRecord> {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, teamId: true } },
      },
    });

    if (!record) {
      throw new NotFoundError('Attendance record');
    }

    // Check if locked (Admin can override)
    if (record.isLocked && currentUser.role !== Role.ADMIN) {
      throw new BadRequestError('This attendance record is locked');
    }

    // Permission checks based on role
    if (currentUser.role === Role.HOD) {
      if (record.departmentId !== currentUser.departmentId) {
        throw new ForbiddenError('Access denied to this attendance record');
      }

      // Check edit window for HODs
      if (record.submittedAt) {
        const editWindowMs = config.attendance.defaultEditWindowMinutes * 60 * 1000;
        const submittedTime = new Date(record.submittedAt).getTime();
        const now = Date.now();

        if (now - submittedTime > editWindowMs) {
          throw new BadRequestError('Edit window has expired. Contact Ministry Team for corrections.');
        }
      }
    } else if (currentUser.role === Role.TEAM_HEAD) {
      throw new ForbiddenError('Team Heads cannot edit attendance records');
    }

    const { entries, notes } = input;

    // Update entries if provided
    if (entries && entries.length > 0) {
      const memberIds = entries.map((e) => e.memberId);
      const validMembers = await prisma.member.findMany({
        where: {
          id: { in: memberIds },
          departmentId: record.departmentId,
        },
      });

      if (validMembers.length !== memberIds.length) {
        throw new BadRequestError('One or more invalid member IDs');
      }

      await prisma.$transaction(async (tx) => {
        // Update or create entries
        for (const entry of entries) {
          const absenceReason = entry.isPresent ? null : (entry.absenceReason || null);
          await tx.attendanceEntry.upsert({
            where: {
              attendanceRecordId_memberId: {
                attendanceRecordId: id,
                memberId: entry.memberId,
              },
            },
            update: { isPresent: entry.isPresent, absenceReason },
            create: {
              attendanceRecordId: id,
              memberId: entry.memberId,
              isPresent: entry.isPresent,
              absenceReason,
            },
          });
        }

        // Update notes if provided
        if (notes !== undefined) {
          await tx.attendanceRecord.update({
            where: { id },
            data: { notes },
          });
        }
      });
    } else if (notes !== undefined) {
      await prisma.attendanceRecord.update({
        where: { id },
        data: { notes },
      });
    }

    // Create audit log
    const action = currentUser.role === Role.ADMIN ? 'OVERRIDE' : 'UPDATE';
    await createAuditLog({
      userId: currentUser.userId,
      userRole: currentUser.role as Role,
      action,
      entityType: 'AttendanceRecord',
      entityId: id,
      diff: { entries: entries?.length || 0, notes },
    });

    const updated = await prisma.attendanceRecord.findUnique({ where: { id } });

    return {
      id: updated!.id,
      departmentId: updated!.departmentId,
      serviceDate: updated!.serviceDate.toISOString().split('T')[0],
      serviceType: updated!.serviceType as ServiceType,
      submittedAt: updated!.submittedAt?.toISOString() || null,
      submittedById: updated!.submittedById,
      notes: updated!.notes,
      isLocked: updated!.isLocked,
      status: updated!.status as SubmissionStatus,
      createdAt: updated!.createdAt.toISOString(),
      updatedAt: updated!.updatedAt.toISOString(),
    };
  }

  async createAttendanceRecord(
    departmentId: string,
    serviceDate: Date,
    serviceType: ServiceType
  ): Promise<AttendanceRecord> {
    // Check if record already exists
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        departmentId_serviceDate_serviceType: {
          departmentId,
          serviceDate,
          serviceType,
        },
      },
    });

    if (existing) {
      return {
        id: existing.id,
        departmentId: existing.departmentId,
        serviceDate: existing.serviceDate.toISOString().split('T')[0],
        serviceType: existing.serviceType as ServiceType,
        submittedAt: existing.submittedAt?.toISOString() || null,
        submittedById: existing.submittedById,
        notes: existing.notes,
        isLocked: existing.isLocked,
        status: existing.status as SubmissionStatus,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: existing.updatedAt.toISOString(),
      };
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        departmentId,
        serviceDate,
        serviceType,
        status: SubmissionStatus.NOT_STARTED,
      },
    });

    return {
      id: record.id,
      departmentId: record.departmentId,
      serviceDate: record.serviceDate.toISOString().split('T')[0],
      serviceType: record.serviceType as ServiceType,
      submittedAt: record.submittedAt?.toISOString() || null,
      submittedById: record.submittedById,
      notes: record.notes,
      isLocked: record.isLocked,
      status: record.status as SubmissionStatus,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  // Create attendance records for all active departments for a service day
  async createRecordsForServiceDay(serviceType: ServiceType, serviceDate?: Date): Promise<number> {
    const targetDate = serviceDate || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let created = 0;

    for (const dept of departments) {
      const existing = await prisma.attendanceRecord.findUnique({
        where: {
          departmentId_serviceDate_serviceType: {
            departmentId: dept.id,
            serviceDate: targetDate,
            serviceType,
          },
        },
      });

      if (!existing) {
        await prisma.attendanceRecord.create({
          data: {
            departmentId: dept.id,
            serviceDate: targetDate,
            serviceType,
            status: SubmissionStatus.NOT_STARTED,
          },
        });
        created++;
      }
    }

    return created;
  }

  async sendReminder(
    id: string,
    currentUser: TokenPayload
  ): Promise<void> {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            hod: { select: { id: true, email: true, firstName: true } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('Attendance record');
    }

    // Permission checks
    if (currentUser.role === Role.TEAM_HEAD) {
      if (record.department.teamId !== currentUser.teamId) {
        throw new ForbiddenError('Access denied');
      }
    } else if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenError('Only Admins and Team Heads can send reminders');
    }

    if (!record.department.hod) {
      throw new BadRequestError('No HOD assigned to this department');
    }

    // Log the reminder
    await prisma.reminderLog.create({
      data: {
        attendanceRecordId: id,
        triggeredById: currentUser.userId,
        channel: 'email', // TODO: Make configurable
      },
    });

    // TODO: Actually send the email/notification
    console.log(`Reminder sent to ${record.department.hod.email} for attendance record ${id}`);
  }
}

export const attendanceService = new AttendanceService();
