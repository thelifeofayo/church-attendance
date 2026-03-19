import { z } from 'zod';
import { Role } from 'shared';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.nativeEnum(Role),
  teamId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  birthMonth: z.number().int().min(1).max(12).optional(),
  birthDay: z.number().int().min(1).max(31).optional(),
  phoneNumber: z.string().max(20).optional(),
}).refine(
  (data) => {
    if (data.role === Role.TEAM_HEAD && !data.teamId) {
      return false;
    }
    return true;
  },
  { message: 'Team Head must be assigned to a team', path: ['teamId'] }
);

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  birthMonth: z.number().int().min(1).max(12).nullable().optional(),
  birthDay: z.number().int().min(1).max(31).nullable().optional(),
  phoneNumber: z.string().max(20).nullable().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  role: z.nativeEnum(Role).optional(),
  teamId: z.string().uuid().optional(),
  search: z.string().optional(),
  includeInactive: z.string().transform((v) => v === 'true').default('false'),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
