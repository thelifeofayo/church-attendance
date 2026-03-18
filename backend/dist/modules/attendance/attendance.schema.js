"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerRecordCreationSchema = exports.createAttendanceRecordSchema = exports.attendanceIdParamSchema = exports.listAttendanceQuerySchema = exports.updateAttendanceSchema = exports.submitAttendanceSchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("shared");
exports.submitAttendanceSchema = zod_1.z.object({
    entries: zod_1.z.array(zod_1.z.object({
        memberId: zod_1.z.string().uuid('Invalid member ID'),
        isPresent: zod_1.z.boolean(),
        absenceReason: zod_1.z.string().max(200, 'Absence reason cannot exceed 200 characters').optional(),
    })).min(1, 'At least one attendance entry is required'),
    notes: zod_1.z.string().max(300, 'Notes cannot exceed 300 characters').optional(),
});
exports.updateAttendanceSchema = zod_1.z.object({
    entries: zod_1.z.array(zod_1.z.object({
        memberId: zod_1.z.string().uuid('Invalid member ID'),
        isPresent: zod_1.z.boolean(),
        absenceReason: zod_1.z.string().max(200, 'Absence reason cannot exceed 200 characters').nullable().optional(),
    })).optional(),
    notes: zod_1.z.string().max(300, 'Notes cannot exceed 300 characters').nullable().optional(),
});
exports.listAttendanceQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    departmentId: zod_1.z.string().uuid().optional(),
    teamId: zod_1.z.string().uuid().optional(),
    serviceType: zod_1.z.nativeEnum(shared_1.ServiceType).optional(),
    status: zod_1.z.nativeEnum(shared_1.SubmissionStatus).optional(),
    weekStart: zod_1.z.string().optional(), // ISO date string (Monday of the week)
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional(),
});
exports.attendanceIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid attendance record ID'),
});
exports.createAttendanceRecordSchema = zod_1.z.object({
    departmentId: zod_1.z.string().uuid('Invalid department ID'),
    serviceDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    serviceType: zod_1.z.nativeEnum(shared_1.ServiceType),
});
exports.triggerRecordCreationSchema = zod_1.z.object({
    serviceType: zod_1.z.nativeEnum(shared_1.ServiceType),
});
//# sourceMappingURL=attendance.schema.js.map