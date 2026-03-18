import { prisma } from '../../utils/prisma';
import { ForbiddenError } from '../../utils/errors';
import {
  Role,
  ServiceType,
  SubmissionStatus,
  HODDashboardData,
  TeamHeadDashboardData,
  AdminDashboardData,
  ServiceDaySummary,
  DepartmentAttendanceSummary,
  TeamAttendanceSummary,
} from 'shared';
import { TokenPayload } from '../../utils/jwt';

export class DashboardService {
  private getWeekBounds(): { start: Date; end: Date; wednesday: Date; sunday: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Calculate Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    // Calculate Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Wednesday of current week
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);

    // Sunday date (same as end of week)
    const sundayDate = new Date(sunday);
    sundayDate.setHours(0, 0, 0, 0);

    return {
      start: monday,
      end: sunday,
      wednesday,
      sunday: sundayDate,
    };
  }

  async getHODDashboard(currentUser: TokenPayload): Promise<HODDashboardData> {
    if (currentUser.role !== Role.HOD) {
      throw new ForbiddenError('Access denied');
    }

    if (!currentUser.departmentId) {
      throw new ForbiddenError('You are not assigned to any department');
    }

    const week = this.getWeekBounds();

    // Get department info
    const department = await prisma.department.findUnique({
      where: { id: currentUser.departmentId },
      include: {
        team: { select: { id: true, name: true } },
        hod: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { members: { where: { isActive: true } } } },
      },
    });

    if (!department) {
      throw new ForbiddenError('Department not found');
    }

    // Get current week attendance records
    const [wednesdayRecord, sundayRecord] = await Promise.all([
      prisma.attendanceRecord.findFirst({
        where: {
          departmentId: currentUser.departmentId,
          serviceDate: week.wednesday,
          serviceType: ServiceType.WEDNESDAY,
        },
        include: {
          entries: { include: { member: { select: { firstName: true, lastName: true } } } },
          _count: { select: { entries: true } },
        },
      }),
      prisma.attendanceRecord.findFirst({
        where: {
          departmentId: currentUser.departmentId,
          serviceDate: week.sunday,
          serviceType: ServiceType.SUNDAY,
        },
        include: {
          entries: { include: { member: { select: { firstName: true, lastName: true } } } },
          _count: { select: { entries: true } },
        },
      }),
    ]);

    // Get recent submissions (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const recentSubmissions = await prisma.attendanceRecord.findMany({
      where: {
        departmentId: currentUser.departmentId,
        status: SubmissionStatus.SUBMITTED,
        serviceDate: { gte: twelveWeeksAgo },
      },
      orderBy: { serviceDate: 'desc' },
      take: 24, // 12 weeks x 2 services
      include: {
        _count: { select: { entries: { where: { isPresent: true } } } },
      },
    });

    const formatRecord = (record: typeof wednesdayRecord) => {
      if (!record) return null;
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
        entries: record.entries.map((e) => ({
          id: e.id,
          attendanceRecordId: e.attendanceRecordId,
          memberId: e.memberId,
          isPresent: e.isPresent,
          absenceReason: (e as any).absenceReason || null,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
          member: {
            id: e.memberId,
            firstName: e.member.firstName,
            lastName: e.member.lastName,
            departmentId: record.departmentId,
            createdById: '',
            isActive: true,
            createdAt: '',
            updatedAt: '',
          },
        })),
        _count: record._count,
      };
    };

    return {
      department: {
        id: department.id,
        name: department.name,
        teamId: department.teamId,
        hodId: department.hodId,
        isActive: department.isActive,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
        team: department.team,
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
        _count: department._count,
      },
      memberCount: department._count.members,
      currentWeekRecords: {
        wednesday: formatRecord(wednesdayRecord),
        sunday: formatRecord(sundayRecord),
      },
      recentSubmissions: recentSubmissions.map((r) => ({
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
        _count: r._count,
      })),
    };
  }

  async getTeamHeadDashboard(currentUser: TokenPayload): Promise<TeamHeadDashboardData> {
    if (currentUser.role !== Role.TEAM_HEAD) {
      throw new ForbiddenError('Access denied');
    }

    if (!currentUser.teamId) {
      throw new ForbiddenError('You are not assigned to any team');
    }

    const week = this.getWeekBounds();

    // Get team info
    const team = await prisma.team.findUnique({
      where: { id: currentUser.teamId },
      include: {
        teamHead: { select: { id: true, firstName: true, lastName: true } },
        departments: {
          where: { isActive: true },
          include: {
            hod: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
      },
    });

    if (!team) {
      throw new ForbiddenError('Team not found');
    }

    // Get attendance records for the week
    const records = await prisma.attendanceRecord.findMany({
      where: {
        department: { teamId: currentUser.teamId },
        serviceDate: { gte: week.start, lte: week.end },
      },
      include: {
        _count: {
          select: {
            entries: { where: { isPresent: true } },
          },
        },
        entries: { select: { isPresent: true } },
      },
    });

    // Calculate summaries
    const wednesdayRecords = records.filter((r) => r.serviceType === ServiceType.WEDNESDAY);
    const sundayRecords = records.filter((r) => r.serviceType === ServiceType.SUNDAY);

    const calculateSummary = (recs: typeof records, serviceDate: Date): ServiceDaySummary => {
      const totalExpected = team.departments.reduce((sum, d) => sum + d._count.members, 0);
      const totalPresent = recs.reduce((sum, r) => sum + r._count.entries, 0);
      const submitted = recs.filter((r) => r.status === SubmissionStatus.SUBMITTED).length;
      const pending = recs.filter((r) => r.status === SubmissionStatus.NOT_STARTED).length;
      const notSubmitted = recs.filter((r) => r.status === SubmissionStatus.NOT_SUBMITTED).length;

      return {
        serviceDate: serviceDate.toISOString().split('T')[0],
        totalExpected,
        totalPresent,
        attendancePercentage: totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0,
        submittedCount: submitted,
        pendingCount: pending,
        notSubmittedCount: notSubmitted,
      };
    };

    // Department breakdown
    const departmentBreakdown: DepartmentAttendanceSummary[] = team.departments.map((dept) => {
      const wedRec = wednesdayRecords.find((r) => r.departmentId === dept.id);
      const sunRec = sundayRecords.find((r) => r.departmentId === dept.id);

      return {
        department: {
          id: dept.id,
          name: dept.name,
          teamId: dept.teamId,
          hodId: dept.hodId,
          isActive: dept.isActive,
          createdAt: dept.createdAt.toISOString(),
          updatedAt: dept.updatedAt.toISOString(),
        },
        hodName: dept.hod ? `${dept.hod.firstName} ${dept.hod.lastName}` : null,
        memberCount: dept._count.members,
        wednesday: wedRec ? {
          status: wedRec.status as SubmissionStatus,
          present: wedRec._count.entries,
          percentage: dept._count.members > 0 ? Math.round((wedRec._count.entries / dept._count.members) * 100) : 0,
        } : null,
        sunday: sunRec ? {
          status: sunRec.status as SubmissionStatus,
          present: sunRec._count.entries,
          percentage: dept._count.members > 0 ? Math.round((sunRec._count.entries / dept._count.members) * 100) : 0,
        } : null,
      };
    });

    return {
      team: {
        id: team.id,
        name: team.name,
        organisationId: team.organisationId,
        teamHeadId: team.teamHeadId,
        isActive: team.isActive,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
        teamHead: team.teamHead ? {
          id: team.teamHead.id,
          email: '',
          firstName: team.teamHead.firstName,
          lastName: team.teamHead.lastName,
          role: Role.TEAM_HEAD,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        } : null,
      },
      departmentCount: team.departments.length,
      totalMembers: team.departments.reduce((sum, d) => sum + d._count.members, 0),
      currentWeekSummary: {
        wednesday: calculateSummary(wednesdayRecords, week.wednesday),
        sunday: calculateSummary(sundayRecords, week.sunday),
      },
      departmentBreakdown,
    };
  }

  async getAdminDashboard(_currentUser: TokenPayload): Promise<AdminDashboardData> {
    const week = this.getWeekBounds();

    // Get totals
    const [totalTeams, totalDepartments, totalMembers] = await Promise.all([
      prisma.team.count({ where: { isActive: true } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.member.count({ where: { isActive: true } }),
    ]);

    // Get all teams with their departments
    const teams = await prisma.team.findMany({
      where: { isActive: true },
      include: {
        teamHead: { select: { id: true, firstName: true, lastName: true } },
        departments: {
          where: { isActive: true },
          include: {
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
      },
    });

    // Get attendance records for the week
    const records = await prisma.attendanceRecord.findMany({
      where: {
        department: { isActive: true },
        serviceDate: { gte: week.start, lte: week.end },
      },
      include: {
        department: { select: { teamId: true } },
        _count: { select: { entries: { where: { isPresent: true } } } },
      },
    });

    const wednesdayRecords = records.filter((r) => r.serviceType === ServiceType.WEDNESDAY);
    const sundayRecords = records.filter((r) => r.serviceType === ServiceType.SUNDAY);

    // Calculate overall summary
    const calculateOverallSummary = (recs: typeof records, serviceDate: Date): ServiceDaySummary => {
      const totalExpected = totalMembers;
      const totalPresent = recs.reduce((sum, r) => sum + r._count.entries, 0);
      const submitted = recs.filter((r) => r.status === SubmissionStatus.SUBMITTED).length;
      const pending = recs.filter((r) => r.status === SubmissionStatus.NOT_STARTED).length;
      const notSubmitted = recs.filter((r) => r.status === SubmissionStatus.NOT_SUBMITTED).length;

      return {
        serviceDate: serviceDate.toISOString().split('T')[0],
        totalExpected,
        totalPresent,
        attendancePercentage: totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0,
        submittedCount: submitted,
        pendingCount: pending,
        notSubmittedCount: notSubmitted,
      };
    };

    // Team breakdown
    const teamBreakdown: TeamAttendanceSummary[] = teams.map((team) => {
      const teamWedRecs = wednesdayRecords.filter((r) => r.department.teamId === team.id);
      const teamSunRecs = sundayRecords.filter((r) => r.department.teamId === team.id);
      const teamMemberCount = team.departments.reduce((sum, d) => sum + d._count.members, 0);
      const deptCount = team.departments.length;

      return {
        team: {
          id: team.id,
          name: team.name,
          organisationId: team.organisationId,
          teamHeadId: team.teamHeadId,
          isActive: team.isActive,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString(),
        },
        teamHeadName: team.teamHead ? `${team.teamHead.firstName} ${team.teamHead.lastName}` : null,
        departmentCount: deptCount,
        totalExpected: teamMemberCount,
        wednesday: {
          totalPresent: teamWedRecs.reduce((sum, r) => sum + r._count.entries, 0),
          percentage: teamMemberCount > 0
            ? Math.round((teamWedRecs.reduce((sum, r) => sum + r._count.entries, 0) / teamMemberCount) * 100)
            : 0,
          submissionCompleteness: deptCount > 0
            ? Math.round((teamWedRecs.filter((r) => r.status === SubmissionStatus.SUBMITTED).length / deptCount) * 100)
            : 0,
        },
        sunday: {
          totalPresent: teamSunRecs.reduce((sum, r) => sum + r._count.entries, 0),
          percentage: teamMemberCount > 0
            ? Math.round((teamSunRecs.reduce((sum, r) => sum + r._count.entries, 0) / teamMemberCount) * 100)
            : 0,
          submissionCompleteness: deptCount > 0
            ? Math.round((teamSunRecs.filter((r) => r.status === SubmissionStatus.SUBMITTED).length / deptCount) * 100)
            : 0,
        },
      };
    });

    return {
      totalTeams,
      totalDepartments,
      totalMembers,
      currentWeekSummary: {
        wednesday: calculateOverallSummary(wednesdayRecords, week.wednesday),
        sunday: calculateOverallSummary(sundayRecords, week.sunday),
      },
      teamBreakdown,
    };
  }
}

export const dashboardService = new DashboardService();
