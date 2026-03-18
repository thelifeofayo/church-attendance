"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const reports_schema_1 = require("./reports.schema");
const router = (0, express_1.Router)();
// All routes require authentication and Admin role
router.use(auth_1.authenticate);
router.use((0, rbac_1.requireAdmin)());
router.get('/weekly', (0, validate_1.validate)({ query: reports_schema_1.weeklyReportQuerySchema }), reports_controller_1.reportsController.getWeeklyReport);
router.get('/export', (0, validate_1.validate)({ query: reports_schema_1.exportReportQuerySchema }), reports_controller_1.reportsController.exportReport);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map