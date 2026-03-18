import { Request, Response, NextFunction } from 'express';
import { ApiResponse, HODDashboardData, TeamHeadDashboardData, AdminDashboardData } from 'shared';
export declare class DashboardController {
    getHODDashboard(req: Request, res: Response<ApiResponse<HODDashboardData>>, next: NextFunction): Promise<void>;
    getTeamHeadDashboard(req: Request, res: Response<ApiResponse<TeamHeadDashboardData>>, next: NextFunction): Promise<void>;
    getAdminDashboard(req: Request, res: Response<ApiResponse<AdminDashboardData>>, next: NextFunction): Promise<void>;
}
export declare const dashboardController: DashboardController;
//# sourceMappingURL=dashboard.controller.d.ts.map