import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(200),
  teamHeadId: z.string().uuid().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  teamHeadId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const listTeamsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  includeInactive: z.string().transform((v) => v === 'true').default('false'),
});

export const teamIdParamSchema = z.object({
  id: z.string().uuid('Invalid team ID'),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
