import { z } from 'zod';
export declare const createMemberSchema: z.ZodEffects<z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    birthMonth: z.ZodOptional<z.ZodNumber>;
    birthDay: z.ZodOptional<z.ZodNumber>;
    phoneNumber: z.ZodString;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
}>, {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
}>;
export declare const updateMemberSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    birthMonth: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    birthDay: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
    birthMonth?: number | null | undefined;
    birthDay?: number | null | undefined;
    phoneNumber?: string | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
    birthMonth?: number | null | undefined;
    birthDay?: number | null | undefined;
    phoneNumber?: string | undefined;
}>;
export declare const listMembersQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    search: z.ZodOptional<z.ZodString>;
    includeInactive: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    includeInactive: boolean;
    search?: string | undefined;
}, {
    search?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    includeInactive?: string | undefined;
}>;
export declare const memberIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
//# sourceMappingURL=members.schema.d.ts.map