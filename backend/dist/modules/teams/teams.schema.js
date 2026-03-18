"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamIdParamSchema = exports.listTeamsQuerySchema = exports.updateTeamSchema = exports.createTeamSchema = void 0;
const zod_1 = require("zod");
exports.createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Team name is required').max(200),
    teamHeadId: zod_1.z.string().uuid().optional(),
});
exports.updateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    teamHeadId: zod_1.z.string().uuid().nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.listTeamsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    search: zod_1.z.string().optional(),
    includeInactive: zod_1.z.string().transform((v) => v === 'true').default('false'),
});
exports.teamIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid team ID'),
});
//# sourceMappingURL=teams.schema.js.map