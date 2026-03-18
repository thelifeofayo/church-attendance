"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentIdParamSchema = exports.listDepartmentsQuerySchema = exports.assignHODSchema = exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
exports.createDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Department name is required').max(200),
    teamId: zod_1.z.string().uuid().optional(), // Optional for Team Heads (auto-filled)
});
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.assignHODSchema = zod_1.z.object({
    hodId: zod_1.z.string().uuid('Invalid HOD ID').nullable(),
});
exports.listDepartmentsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    teamId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    includeInactive: zod_1.z.string().transform((v) => v === 'true').default('false'),
});
exports.departmentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid department ID'),
});
//# sourceMappingURL=departments.schema.js.map