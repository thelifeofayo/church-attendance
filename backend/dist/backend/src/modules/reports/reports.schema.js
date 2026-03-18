"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveQuerySchema = exports.exportReportQuerySchema = exports.weeklyReportQuerySchema = void 0;
const zod_1 = require("zod");
const shared_1 = require("shared");
exports.weeklyReportQuerySchema = zod_1.z.object({
    weekStart: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    serviceType: zod_1.z.nativeEnum(shared_1.ServiceType).optional(),
    teamId: zod_1.z.string().uuid().optional(),
});
exports.exportReportQuerySchema = zod_1.z.object({
    weekStart: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    serviceType: zod_1.z.nativeEnum(shared_1.ServiceType).optional(),
    teamId: zod_1.z.string().uuid().optional(),
    format: zod_1.z.enum(['pdf', 'csv']),
});
exports.archiveQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional(),
    serviceType: zod_1.z.nativeEnum(shared_1.ServiceType).optional(),
    teamId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=reports.schema.js.map