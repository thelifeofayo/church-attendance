import { z } from 'zod';
export declare const createMemberSchema: z.ZodEffects<z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    birthMonth: z.ZodOptional<z.ZodNumber>;
    birthDay: z.ZodOptional<z.ZodNumber>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
}>, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
}>;
export declare const updateMemberSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    birthMonth: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    birthDay: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodNullable<z.ZodString>>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    email?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
    birthMonth?: number | null | undefined;
    birthDay?: number | null | undefined;
    phoneNumber?: string | null | undefined;
}, {
    email?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
    birthMonth?: number | null | undefined;
    birthDay?: number | null | undefined;
    phoneNumber?: string | null | undefined;
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