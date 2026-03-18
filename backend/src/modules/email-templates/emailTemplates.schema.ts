import { z } from 'zod';

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required'),
});

export const updateEmailTemplateSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listEmailTemplatesQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});

export const emailTemplateIdParamSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
});

export const listEmailLogsQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  status: z.enum(['sent', 'failed', 'pending']).optional(),
});

export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export type ListEmailTemplatesQuery = z.infer<typeof listEmailTemplatesQuerySchema>;
export type ListEmailLogsQuery = z.infer<typeof listEmailLogsQuerySchema>;
