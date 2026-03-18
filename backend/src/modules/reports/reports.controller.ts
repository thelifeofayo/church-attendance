import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { ApiResponse } from 'shared';
import { WeeklyReportQuery, ExportReportQuery } from './reports.schema';

export class ReportsController {
  async getWeeklyReport(
    req: Request<unknown, unknown, unknown, WeeklyReportQuery>,
    res: Response<ApiResponse<unknown>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const report = await reportsService.getWeeklyReport(req.query);
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(
    req: Request<unknown, unknown, unknown, ExportReportQuery>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { format, weekStart } = req.query;

      if (format === 'pdf') {
        const pdf = await reportsService.generatePDF(req.query);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${weekStart}.pdf`);
        res.send(pdf);
      } else {
        const csv = await reportsService.generateCSV(req.query);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${weekStart}.csv`);
        res.send(csv);
      }
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
