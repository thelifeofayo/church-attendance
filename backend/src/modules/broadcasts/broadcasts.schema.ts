import { z } from 'zod';

export const createBroadcastSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required'),
  recipientType: z.enum(['all', 'admins', 'team_heads', 'hods', 'members', 'custom']),
  teamIds: z.array(z.string().uuid()).optional(),
});

export const listBroadcastsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['draft', 'sending', 'sent', 'failed']).optional(),
});

export const broadcastIdParamSchema = z.object({
  id: z.string().uuid('Invalid broadcast ID'),
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
export type ListBroadcastsQuery = z.infer<typeof listBroadcastsQuerySchema>;
