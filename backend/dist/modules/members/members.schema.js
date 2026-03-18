"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberIdParamSchema = exports.listMembersQuerySchema = exports.updateMemberSchema = exports.createMemberSchema = void 0;
const zod_1 = require("zod");
exports.createMemberSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(100),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100),
    birthMonth: zod_1.z.number().int().min(1).max(12).optional(),
    birthDay: zod_1.z.number().int().min(1).max(31).optional(),
    phoneNumber: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email('Invalid email address').max(255).optional().or(zod_1.z.literal('')),
}).refine((data) => {
    // If one of birthMonth or birthDay is provided, both must be provided
    if ((data.birthMonth && !data.birthDay) || (!data.birthMonth && data.birthDay)) {
        return false;
    }
    return true;
}, { message: 'Both birth month and day must be provided together' });
exports.updateMemberSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    isActive: zod_1.z.boolean().optional(),
    birthMonth: zod_1.z.number().int().min(1).max(12).nullable().optional(),
    birthDay: zod_1.z.number().int().min(1).max(31).nullable().optional(),
    phoneNumber: zod_1.z.string().max(20).nullable().optional(),
    email: zod_1.z.string().email('Invalid email address').max(255).nullable().optional().or(zod_1.z.literal('')),
});
exports.listMembersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('50'),
    search: zod_1.z.string().optional(),
    includeInactive: zod_1.z.string().transform((v) => v === 'true').default('false'),
});
exports.memberIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid member ID'),
});
//# sourceMappingURL=members.schema.js.map