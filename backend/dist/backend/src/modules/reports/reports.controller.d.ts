import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from 'shared';
import { WeeklyReportQuery, ExportReportQuery } from './reports.schema';
export declare class ReportsController {
    getWeeklyReport(req: Request<unknown, unknown, unknown, WeeklyReportQuery>, res: Response<ApiResponse<unknown>>, next: NextFunction): Promise<void>;
    exportReport(req: Request<unknown, unknown, unknown, ExportReportQuery>, res: Response, next: NextFunction): Promise<void>;
}
export declare const reportsController: ReportsController;
//# sourceMappingURL=reports.controller.d.ts.map