"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("./attendance.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const attendance_schema_1 = require("./attendance.schema");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// List and get - All authenticated users (filtered by role)
router.get('/', (0, rbac_1.requireAuthenticated)(), (0, validate_1.validate)({ query: attendance_schema_1.listAttendanceQuerySchema }), attendance_controller_1.attendanceController.list);
// Trigger attendance record creation - Admin only (for manual creation if cron missed)
// Must be before /:id to avoid "trigger-creation" being matched as an ID
router.post('/trigger-creation', (0, rbac_1.requireAdmin)(), (0, validate_1.validate)({ body: attendance_schema_1.triggerRecordCreationSchema }), attendance_controller_1.attendanceController.triggerRecordCreation);
router.get('/:id', (0, rbac_1.requireAuthenticated)(), (0, validate_1.validate)({ params: attendance_schema_1.attendanceIdParamSchema }), attendance_controller_1.attendanceController.getById);
// Submit - HOD or Assistant HOD
router.post('/:id/submit', (0, rbac_1.requireHODOrAssistant)(), (0, validate_1.validate)({ params: attendance_schema_1.attendanceIdParamSchema, body: attendance_schema_1.submitAttendanceSchema }), attendance_controller_1.attendanceController.submit);
// Update - HOD (within window) or Admin (override)
router.patch('/:id', (0, rbac_1.requireAuthenticated)(), (0, validate_1.validate)({ params: attendance_schema_1.attendanceIdParamSchema, body: attendance_schema_1.updateAttendanceSchema }), attendance_controller_1.attendanceController.update);
// Send reminder - Admin or Team Head
router.post('/:id/remind', (0, rbac_1.requireAdminOrTeamHead)(), (0, validate_1.validate)({ params: attendance_schema_1.attendanceIdParamSchema }), attendance_controller_1.attendanceController.sendReminder);
exports.default = router;
//# sourceMappingURL=attendance.routes.js.map