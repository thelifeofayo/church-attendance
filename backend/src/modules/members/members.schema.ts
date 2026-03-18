import { z } from 'zod';

export const createMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  birthMonth: z.number().int().min(1).max(12).optional(),
  birthDay: z.number().int().min(1).max(31).optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20),
  email: z.string().min(1, 'Email is required').email('Invalid email address').max(255),
}).refine((data) => {
  // If one of birthMonth or birthDay is provided, both must be provided
  if ((data.birthMonth && !data.birthDay) || (!data.birthMonth && data.birthDay)) {
    return false;
  }
  return true;
}, { message: 'Both birth month and day must be provided together' });

export const updateMemberSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  birthMonth: z.number().int().min(1).max(12).nullable().optional(),
  birthDay: z.number().int().min(1).max(31).nullable().optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20).optional(),
  email: z.string().min(1, 'Email is required').email('Invalid email address').max(255).optional(),
});

export const listMembersQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  search: z.string().optional(),
  includeInactive: z.string().transform((v) => v === 'true').default('false'),
});

export const memberIdParamSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
