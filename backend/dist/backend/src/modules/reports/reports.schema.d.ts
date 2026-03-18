import { z } from 'zod';
import { ServiceType } from 'shared';
export declare const weeklyReportQuerySchema: z.ZodObject<{
    weekStart: z.ZodEffects<z.ZodString, string, string>;
    serviceType: z.ZodOptional<z.ZodNativeEnum<typeof ServiceType>>;
    teamId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    weekStart: string;
    teamId?: string | undefined;
    serviceType?: ServiceType | undefined;
}, {
    weekStart: string;
    teamId?: string | undefined;
    serviceType?: ServiceType | undefined;
}>;
export declare const exportReportQuerySchema: z.ZodObject<{
    weekStart: z.ZodEffects<z.ZodString, string, string>;
    serviceType: z.ZodOptional<z.ZodNativeEnum<typeof ServiceType>>;
    teamId: z.ZodOptional<z.ZodString>;
    format: z.ZodEnum<["pdf", "csv"]>;
}, "strip", z.ZodTypeAny, {
    format: "pdf" | "csv";
    weekStart: string;
    teamId?: string | undefined;
    serviceType?: ServiceType | undefined;
}, {
    format: "pdf" | "csv";
    weekStart: string;
    teamId?: string | undefined;
    serviceType?: ServiceType | undefined;
}>;
export declare const archiveQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    fromDate: z.ZodOptional<z.ZodString>;
    toDate: z.ZodOptional<z.ZodString>;
    serviceType: z.ZodOptional<z.ZodNativeEnum<typeof ServiceType>>;
    teamId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    teamId?: string | undefined;
    serviceType?: ServiceType | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}, {
    teamId?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    serviceType?: ServiceType | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}>;
export type WeeklyReportQuery = z.infer<typeof weeklyReportQuerySchema>;
export type ExportReportQuery = z.infer<typeof exportReportQuerySchema>;
export type ArchiveQuery = z.infer<typeof archiveQuerySchema>;
//# sourceMappingURL=reports.schema.d.ts.map