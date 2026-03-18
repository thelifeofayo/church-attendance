import { z } from 'zod';
import { ServiceType } from 'shared';

export const weeklyReportQuerySchema = z.object({
  weekStart: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  serviceType: z.nativeEnum(ServiceType).optional(),
  teamId: z.string().uuid().optional(),
});

export const exportReportQuerySchema = z.object({
  weekStart: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  serviceType: z.nativeEnum(ServiceType).optional(),
  teamId: z.string().uuid().optional(),
  format: z.enum(['pdf', 'csv']),
});

export const archiveQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  teamId: z.string().uuid().optional(),
});

export type WeeklyReportQuery = z.infer<typeof weeklyReportQuerySchema>;
export type ExportReportQuery = z.infer<typeof exportReportQuerySchema>;
export type ArchiveQuery = z.infer<typeof archiveQuerySchema>;
