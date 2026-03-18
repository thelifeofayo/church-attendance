"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastIdParamSchema = exports.listBroadcastsQuerySchema = exports.createBroadcastSchema = void 0;
const zod_1 = require("zod");
exports.createBroadcastSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1, 'Subject is required').max(200),
    body: zod_1.z.string().min(1, 'Body is required'),
    recipientType: zod_1.z.enum(['all', 'admins', 'team_heads', 'hods', 'members', 'custom']),
    teamIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.listBroadcastsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    status: zod_1.z.enum(['draft', 'sending', 'sent', 'failed']).optional(),
});
exports.broadcastIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid broadcast ID'),
});
//# sourceMappingURL=broadcasts.schema.js.map