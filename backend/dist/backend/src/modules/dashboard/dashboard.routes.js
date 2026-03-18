"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
router.get('/hod', (0, rbac_1.requireHOD)(), dashboard_controller_1.dashboardController.getHODDashboard);
router.get('/team-head', (0, rbac_1.requireTeamHead)(), dashboard_controller_1.dashboardController.getTeamHeadDashboard);
router.get('/admin', (0, rbac_1.requireAdmin)(), dashboard_controller_1.dashboardController.getAdminDashboard);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map