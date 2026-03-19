import { z } from 'zod';
import { ServiceType, SubmissionStatus } from 'shared';

export const submitAttendanceSchema = z.object({
  entries: z.array(
    z.object({
      memberId: z.string().min(1, 'Member ID is required'),
      isPresent: z.boolean(),
      absenceReason: z.string().max(200, 'Absence reason cannot exceed 200 characters').optional(),
    })
  ).min(1, 'At least one attendance entry is required'),
  notes: z.string().max(300, 'Notes cannot exceed 300 characters').optional(),
});

export const updateAttendanceSchema = z.object({
  entries: z.array(
    z.object({
      memberId: z.string().min(1, 'Member ID is required'),
      isPresent: z.boolean(),
      absenceReason: z.string().max(200, 'Absence reason cannot exceed 200 characters').nullable().optional(),
    })
  ).optional(),
  notes: z.string().max(300, 'Notes cannot exceed 300 characters').nullable().optional(),
});

export const listAttendanceQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  weekStart: z.string().optional(), // ISO date string (Monday of the week)
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const attendanceIdParamSchema = z.object({
  id: z.string().uuid('Invalid attendance record ID'),
});

export const createAttendanceRecordSchema = z.object({
  departmentId: z.string().uuid('Invalid department ID'),
  serviceDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  serviceType: z.nativeEnum(ServiceType),
});

export const triggerRecordCreationSchema = z.object({
  serviceType: z.nativeEnum(ServiceType),
  serviceDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date').optional(),
});

export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>;
export type TriggerRecordCreationInput = z.infer<typeof triggerRecordCreationSchema>;
