// ============================================
// Church Attendance System - Shared Types
// ============================================

// Enums
export enum Role {
  ADMIN = 'ADMIN',
  TEAM_HEAD = 'TEAM_HEAD',
  HOD = 'HOD',
}

export enum ServiceType {
  WEDNESDAY = 'WEDNESDAY',
  SUNDAY = 'SUNDAY',
}

export enum SubmissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  SUBMITTED = 'SUBMITTED',
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  LOCKED = 'LOCKED',
}

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Organisation
export interface Organisation extends BaseEntity {
  name: string;
  timezone: string;
}

// Team
export interface Team extends BaseEntity {
  name: string;
  organisationId: string;
  teamHeadId: string | null;
  isActive: boolean;
}

export interface TeamWithRelations extends Team {
  teamHead?: User | null;
  departments?: Department[];
  _count?: {
    departments: number;
  };
}

// Department
export interface Department extends BaseEntity {
  name: string;
  teamId: string;
  hodId: string | null;
  isActive: boolean;
}

export interface DepartmentWithRelations extends Department {
  team?: Team;
  hod?: User | null;
  members?: Member[];
  _count?: {
    members: number;
  };
}

// User
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  birthMonth?: number | null;
  birthDay?: number | null;
  phoneNumber?: string | null;
}

export interface UserWithRelations extends User {
  teamAsHead?: Team | null;
  departmentAsHOD?: Department | null;
}

// Member
export interface Member extends BaseEntity {
  firstName: string;
  lastName: string;
  departmentId: string;
  createdById: string;
  isActive: boolean;
  // New fields
  birthMonth: number | null;
  birthDay: number | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface MemberWithRelations extends Member {
  department?: Department;
  createdBy?: User;
}

// Attendance Record
export interface AttendanceRecord extends BaseEntity {
  departmentId: string;
  serviceDate: string;
  serviceType: ServiceType;
  submittedAt: string | null;
  submittedById: string | null;
  notes: string | null;
  isLocked: boolean;
  status: SubmissionStatus;
}

export interface AttendanceRecordWithRelations extends AttendanceRecord {
  department?: Department;
  submittedBy?: User | null;
  entries?: AttendanceEntryWithRelations[];
  _count?: {
    entries: number;
  };
}

// Attendance Entry
export interface AttendanceEntry extends BaseEntity {
  attendanceRecordId: string;
  memberId: string;
  isPresent: boolean;
  absenceReason: string | null;
}

export interface AttendanceEntryWithRelations extends AttendanceEntry {
  member?: Member;
}

// Service Config
export interface ServiceConfig extends BaseEntity {
  organisationId: string;
  serviceType: ServiceType;
  deadlineTime: string;
  editWindowMinutes: number;
  reminderMinutesBefore: number;
}

// Reminder Log
export interface ReminderLog extends BaseEntity {
  attendanceRecordId: string;
  triggeredById: string;
  channel: 'email' | 'in_app';
  sentAt: string;
}

// Audit Log
export interface AuditLog extends BaseEntity {
  userId: string;
  userRole: Role;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'OVERRIDE';
  entityType: string;
  entityId: string;
  timestamp: string;
  diffJson: Record<string, unknown> | null;
}

// Email Template
export interface EmailTemplate extends BaseEntity {
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

// Email Log
export interface EmailLog {
  id: string;
  templateId: string | null;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage: string | null;
  sentAt: string;
}

// Broadcast
export type BroadcastRecipientType = 'all' | 'admins' | 'team_heads' | 'hods' | 'members' | 'custom';
export type BroadcastStatus = 'draft' | 'sending' | 'sent' | 'failed';

export interface Broadcast extends BaseEntity {
  subject: string;
  body: string;
  recipientType: BroadcastRecipientType;
  teamIds: string[];
  status: BroadcastStatus;
  sentCount: number;
  failedCount: number;
  createdById: string;
  sentAt: string | null;
}

export interface BroadcastWithCreator extends Broadcast {
  createdBy?: User;
}

// ============================================
// API Request/Response Types
// ============================================

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresPasswordChange: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// User Management
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  teamId?: string; // Required for TEAM_HEAD
  departmentId?: string; // Required for HOD
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

// Team Management
export interface CreateTeamRequest {
  name: string;
  teamHeadId?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  teamHeadId?: string;
  isActive?: boolean;
}

// Department Management
export interface CreateDepartmentRequest {
  name: string;
  teamId?: string; // Auto-filled for Team Heads
}

export interface UpdateDepartmentRequest {
  name?: string;
  isActive?: boolean;
}

export interface AssignHODRequest {
  hodId: string;
}

// Member Management
export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  birthMonth?: number;
  birthDay?: number;
  phoneNumber?: string;
  email?: string;
}

export interface UpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  birthMonth?: number | null;
  birthDay?: number | null;
  phoneNumber?: string | null;
  email?: string | null;
}

// Attendance
export interface SubmitAttendanceRequest {
  entries: {
    memberId: string;
    isPresent: boolean;
    absenceReason?: string;
  }[];
  notes?: string;
}

export interface UpdateAttendanceRequest {
  entries?: {
    memberId: string;
    isPresent: boolean;
    absenceReason?: string;
  }[];
  notes?: string;
}

// Reports
export interface WeeklyReportParams {
  weekStart: string; // ISO date string
  serviceType?: ServiceType;
  teamId?: string;
}

export interface ExportReportParams {
  weekStart: string;
  serviceType?: ServiceType;
  teamId?: string;
  format: 'pdf' | 'csv';
}

// Email Template Management
export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  body: string;
}

export interface UpdateEmailTemplateRequest {
  subject?: string;
  body?: string;
  isActive?: boolean;
}

// Broadcast Management
export interface CreateBroadcastRequest {
  subject: string;
  body: string;
  recipientType: BroadcastRecipientType;
  teamIds?: string[];
}

export interface SendBroadcastRequest {
  broadcastId: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface HODDashboardData {
  department: DepartmentWithRelations;
  memberCount: number;
  currentWeekRecords: {
    wednesday: AttendanceRecordWithRelations | null;
    sunday: AttendanceRecordWithRelations | null;
  };
  recentSubmissions: AttendanceRecordWithRelations[];
}

export interface TeamHeadDashboardData {
  team: TeamWithRelations;
  departmentCount: number;
  totalMembers: number;
  currentWeekSummary: {
    wednesday: ServiceDaySummary;
    sunday: ServiceDaySummary;
  };
  departmentBreakdown: DepartmentAttendanceSummary[];
}

export interface AdminDashboardData {
  totalTeams: number;
  totalDepartments: number;
  totalMembers: number;
  currentWeekSummary: {
    wednesday: ServiceDaySummary;
    sunday: ServiceDaySummary;
  };
  teamBreakdown: TeamAttendanceSummary[];
}

export interface ServiceDaySummary {
  serviceDate: string;
  totalExpected: number;
  totalPresent: number;
  attendancePercentage: number;
  submittedCount: number;
  pendingCount: number;
  notSubmittedCount: number;
}

export interface DepartmentAttendanceSummary {
  department: Department;
  hodName: string | null;
  memberCount: number;
  wednesday: {
    status: SubmissionStatus;
    present: number;
    percentage: number;
  } | null;
  sunday: {
    status: SubmissionStatus;
    present: number;
    percentage: number;
  } | null;
}

export interface TeamAttendanceSummary {
  team: Team;
  teamHeadName: string | null;
  departmentCount: number;
  totalExpected: number;
  wednesday: {
    totalPresent: number;
    percentage: number;
    submissionCompleteness: number;
  };
  sunday: {
    totalPresent: number;
    percentage: number;
    submissionCompleteness: number;
  };
}

// ============================================
// API Response Wrapper
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
