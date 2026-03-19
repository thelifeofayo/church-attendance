import { z } from 'zod';
import { Role } from 'shared';
export declare const createUserSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodNativeEnum<typeof Role>;
    teamId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    birthMonth: z.ZodOptional<z.ZodNumber>;
    birthDay: z.ZodOptional<z.ZodNumber>;
    phoneNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
    teamId?: string | undefined;
    departmentId?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
    teamId?: string | undefined;
    departmentId?: string | undefined;
}>, {
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
    teamId?: string | undefined;
    departmentId?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    birthMonth?: number | undefined;
    birthDay?: number | undefined;
    phoneNumber?: string | undefined;
    teamId?: string | undefined;
    departmentId?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    birthMonth: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    birthDay: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
    birthMonth?: number | null | undefined;
    birthDay?: number | null | undefined;
    phoneNumber?: string | null | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
    birthMonth?: number | null | undefined;
    birthDay?: number | null | undefined;
    phoneNumber?: string | null | undefined;
}>;
export declare const listUsersQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof Role>>;
    teamId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    includeInactive: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    includeInactive: boolean;
    search?: string | undefined;
    role?: Role | undefined;
    teamId?: string | undefined;
}, {
    search?: string | undefined;
    role?: Role | undefined;
    teamId?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    includeInactive?: string | undefined;
}>;
export declare const userIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
//# sourceMappingURL=users.schema.d.ts.map