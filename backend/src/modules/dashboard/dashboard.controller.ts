import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponse, HODDashboardData, TeamHeadDashboardData, AdminDashboardData } from 'shared';

export class DashboardController {
  async getHODDashboard(
    req: Request,
    res: Response<ApiResponse<HODDashboardData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await dashboardService.getHODDashboard(req.user!);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTeamHeadDashboard(
    req: Request,
    res: Response<ApiResponse<TeamHeadDashboardData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await dashboardService.getTeamHeadDashboard(req.user!);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminDashboard(
    req: Request,
    res: Response<ApiResponse<AdminDashboardData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await dashboardService.getAdminDashboard(req.user!);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
