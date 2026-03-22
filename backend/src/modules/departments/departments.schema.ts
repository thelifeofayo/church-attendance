import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(200),
  teamId: z.string().uuid().optional(), // Optional for Team Heads (auto-filled)
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
  teamId: z.string().uuid().optional(),
});

export const assignHODSchema = z.object({
  hodId: z.string().uuid('Invalid HOD ID').nullable(),
});

export const assignAssistantHODSchema = z.object({
  assistantHodId: z.string().uuid('Invalid Assistant HOD ID').nullable(),
});

export const listDepartmentsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  teamId: z.string().uuid().optional(),
  search: z.string().optional(),
  includeInactive: z.string().transform((v) => v === 'true').default('false'),
});

export const departmentIdParamSchema = z.object({
  id: z.string().uuid('Invalid department ID'),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type AssignHODInput = z.infer<typeof assignHODSchema>;
export type AssignAssistantHODInput = z.infer<typeof assignAssistantHODSchema>;
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
