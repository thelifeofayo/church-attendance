"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamSchema = exports.listUsersQuerySchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("shared");
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    firstName: zod_1.z.string().min(1, 'First name is required').max(100),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100),
    role: zod_1.z.nativeEnum(shared_1.Role),
    teamId: zod_1.z.string().uuid().optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    birthMonth: zod_1.z.number().int().min(1).max(12).optional(),
    birthDay: zod_1.z.number().int().min(1).max(31).optional(),
    phoneNumber: zod_1.z.string().max(20).optional(),
}).refine((data) => {
    if (data.role === shared_1.Role.TEAM_HEAD && !data.teamId) {
        return false;
    }
    return true;
}, { message: 'Team Head must be assigned to a team', path: ['teamId'] });
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    isActive: zod_1.z.boolean().optional(),
    birthMonth: zod_1.z.number().int().min(1).max(12).nullable().optional(),
    birthDay: zod_1.z.number().int().min(1).max(31).nullable().optional(),
    phoneNumber: zod_1.z.string().max(20).nullable().optional(),
});
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    role: zod_1.z.nativeEnum(shared_1.Role).optional(),
    teamId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    includeInactive: zod_1.z.string().transform((v) => v === 'true').default('false'),
});
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid user ID'),
});
//# sourceMappingURL=users.schema.js.map