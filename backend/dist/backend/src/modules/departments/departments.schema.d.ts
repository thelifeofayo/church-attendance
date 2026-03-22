import { z } from 'zod';
export declare const createDepartmentSchema: z.ZodObject<{
    name: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    teamId?: string | undefined;
}, {
    name: string;
    teamId?: string | undefined;
}>;
export declare const updateDepartmentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    teamId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    teamId?: string | undefined;
}, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    teamId?: string | undefined;
}>;
export declare const assignHODSchema: z.ZodObject<{
    hodId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    hodId: string | null;
}, {
    hodId: string | null;
}>;
export declare const assignAssistantHODSchema: z.ZodObject<{
    assistantHodId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    assistantHodId: string | null;
}, {
    assistantHodId: string | null;
}>;
export declare const listDepartmentsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    teamId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    includeInactive: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    includeInactive: boolean;
    search?: string | undefined;
    teamId?: string | undefined;
}, {
    search?: string | undefined;
    teamId?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    includeInactive?: string | undefined;
}>;
export declare const departmentIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type AssignHODInput = z.infer<typeof assignHODSchema>;
export type AssignAssistantHODInput = z.infer<typeof assignAssistantHODSchema>;
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
//# sourceMappingURL=departments.schema.d.ts.map