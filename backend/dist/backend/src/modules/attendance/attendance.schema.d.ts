import { z } from 'zod';
import { ServiceType, SubmissionStatus } from 'shared';
export declare const submitAttendanceSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        memberId: z.ZodString;
        isPresent: z.ZodBoolean;
        absenceReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | undefined;
    }, {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | undefined;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    entries: {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | undefined;
    }[];
    notes?: string | undefined;
}, {
    entries: {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | undefined;
    }[];
    notes?: string | undefined;
}>;
export declare const updateAttendanceSchema: z.ZodObject<{
    entries: z.ZodOptional<z.ZodArray<z.ZodObject<{
        memberId: z.ZodString;
        isPresent: z.ZodBoolean;
        absenceReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | null | undefined;
    }, {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | null | undefined;
    }>, "many">>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    entries?: {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | null | undefined;
    }[] | undefined;
    notes?: string | null | undefined;
}, {
    entries?: {
        memberId: string;
        isPresent: boolean;
        absenceReason?: string | null | undefined;
    }[] | undefined;
    notes?: string | null | undefined;
}>;
export declare const listAttendanceQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    departmentId: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    serviceType: z.ZodOptional<z.ZodNativeEnum<typeof ServiceType>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof SubmissionStatus>>;
    weekStart: z.ZodOptional<z.ZodString>;
    fromDate: z.ZodOptional<z.ZodString>;
    toDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: SubmissionStatus | undefined;
    teamId?: string | undefined;
    departmentId?: string | undefined;
    serviceType?: ServiceType | undefined;
    weekStart?: string | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}, {
    status?: SubmissionStatus | undefined;
    teamId?: string | undefined;
    departmentId?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    serviceType?: ServiceType | undefined;
    weekStart?: string | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}>;
export declare const attendanceIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const createAttendanceRecordSchema: z.ZodObject<{
    departmentId: z.ZodString;
    serviceDate: z.ZodEffects<z.ZodString, string, string>;
    serviceType: z.ZodNativeEnum<typeof ServiceType>;
}, "strip", z.ZodTypeAny, {
    departmentId: string;
    serviceType: ServiceType;
    serviceDate: string;
}, {
    departmentId: string;
    serviceType: ServiceType;
    serviceDate: string;
}>;
export declare const triggerRecordCreationSchema: z.ZodObject<{
    serviceType: z.ZodNativeEnum<typeof ServiceType>;
    serviceDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    serviceType: ServiceType;
    serviceDate?: string | undefined;
}, {
    serviceType: ServiceType;
    serviceDate?: string | undefined;
}>;
export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>;
export type TriggerRecordCreationInput = z.infer<typeof triggerRecordCreationSchema>;
//# sourceMappingURL=attendance.schema.d.ts.map