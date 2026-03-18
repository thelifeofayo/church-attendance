"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
class DashboardController {
    async getHODDashboard(req, res, next) {
        try {
            const data = await dashboard_service_1.dashboardService.getHODDashboard(req.user);
            res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTeamHeadDashboard(req, res, next) {
        try {
            const data = await dashboard_service_1.dashboardService.getTeamHeadDashboard(req.user);
            res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAdminDashboard(req, res, next) {
        try {
            const data = await dashboard_service_1.dashboardService.getAdminDashboard(req.user);
            res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map