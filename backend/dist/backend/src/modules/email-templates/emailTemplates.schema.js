"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplateIdParamSchema = exports.listEmailTemplatesQuerySchema = exports.updateEmailTemplateSchema = exports.createEmailTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createEmailTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(50),
    subject: zod_1.z.string().min(1, 'Subject is required').max(200),
    body: zod_1.z.string().min(1, 'Body is required'),
});
exports.updateEmailTemplateSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1).max(200).optional(),
    body: zod_1.z.string().min(1).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.listEmailTemplatesQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
});
exports.emailTemplateIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid template ID'),
});
//# sourceMappingURL=emailTemplates.schema.js.map