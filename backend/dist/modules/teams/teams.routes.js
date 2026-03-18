"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teams_controller_1 = require("./teams.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const teams_schema_1 = require("./teams.schema");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// List and get - Admin and Team Heads (Team Heads see only their team)
router.get('/', (0, rbac_1.requireAdminOrTeamHead)(), (0, validate_1.validate)({ query: teams_schema_1.listTeamsQuerySchema }), teams_controller_1.teamsController.list);
router.get('/:id', (0, rbac_1.requireAdminOrTeamHead)(), (0, validate_1.validate)({ params: teams_schema_1.teamIdParamSchema }), teams_controller_1.teamsController.getById);
// Create, update, delete - Admin only
router.post('/', (0, rbac_1.requireAdmin)(), (0, validate_1.validate)({ body: teams_schema_1.createTeamSchema }), teams_controller_1.teamsController.create);
router.patch('/:id', (0, rbac_1.requireAdmin)(), (0, validate_1.validate)({ params: teams_schema_1.teamIdParamSchema, body: teams_schema_1.updateTeamSchema }), teams_controller_1.teamsController.update);
router.delete('/:id', (0, rbac_1.requireAdmin)(), (0, validate_1.validate)({ params: teams_schema_1.teamIdParamSchema }), teams_controller_1.teamsController.deactivate);
exports.default = router;
//# sourceMappingURL=teams.routes.js.map