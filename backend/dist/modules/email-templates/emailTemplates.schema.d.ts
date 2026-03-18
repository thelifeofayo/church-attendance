import { z } from 'zod';
export declare const createEmailTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    subject: string;
    name: string;
    body: string;
}, {
    subject: string;
    name: string;
    body: string;
}>;
export declare const updateEmailTemplateSchema: z.ZodObject<{
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    subject?: string | undefined;
    isActive?: boolean | undefined;
    body?: string | undefined;
}, {
    subject?: string | undefined;
    isActive?: boolean | undefined;
    body?: string | undefined;
}>;
export declare const listEmailTemplatesQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>;
export declare const emailTemplateIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export type ListEmailTemplatesQuery = z.infer<typeof listEmailTemplatesQuerySchema>;
//# sourceMappingURL=emailTemplates.schema.d.ts.map