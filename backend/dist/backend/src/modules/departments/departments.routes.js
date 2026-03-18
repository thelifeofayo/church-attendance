"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departments_controller_1 = require("./departments.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const departments_schema_1 = require("./departments.schema");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// List and get - All authenticated users (filtered by role)
router.get('/', (0, rbac_1.requireAuthenticated)(), (0, validate_1.validate)({ query: departments_schema_1.listDepartmentsQuerySchema }), departments_controller_1.departmentsController.list);
router.get('/:id', (0, rbac_1.requireAuthenticated)(), (0, validate_1.validate)({ params: departments_schema_1.departmentIdParamSchema }), departments_controller_1.departmentsController.getById);
// Create, update, delete - Admin and Team Heads only
router.post('/', (0, rbac_1.requireAdminOrTeamHead)(), (0, validate_1.validate)({ body: departments_schema_1.createDepartmentSchema }), departments_controller_1.departmentsController.create);
router.patch('/:id', (0, rbac_1.requireAdminOrTeamHead)(), (0, validate_1.validate)({ params: departments_schema_1.departmentIdParamSchema, body: departments_schema_1.updateDepartmentSchema }), departments_controller_1.departmentsController.update);
router.patch('/:id/assign-hod', (0, rbac_1.requireAdminOrTeamHead)(), (0, validate_1.validate)({ params: departments_schema_1.departmentIdParamSchema, body: departments_schema_1.assignHODSchema }), departments_controller_1.departmentsController.assignHOD);
router.delete('/:id', (0, rbac_1.requireAdminOrTeamHead)(), (0, validate_1.validate)({ params: departments_schema_1.departmentIdParamSchema }), departments_controller_1.departmentsController.deactivate);
exports.default = router;
//# sourceMappingURL=departments.routes.js.map