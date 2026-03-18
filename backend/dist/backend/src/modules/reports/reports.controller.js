"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
class ReportsController {
    async getWeeklyReport(req, res, next) {
        try {
            const report = await reports_service_1.reportsService.getWeeklyReport(req.query);
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async exportReport(req, res, next) {
        try {
            const { format, weekStart } = req.query;
            if (format === 'pdf') {
                const pdf = await reports_service_1.reportsService.generatePDF(req.query);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${weekStart}.pdf`);
                res.send(pdf);
            }
            else {
                const csv = await reports_service_1.reportsService.generateCSV(req.query);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${weekStart}.csv`);
                res.send(csv);
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportsController = ReportsController;
exports.reportsController = new ReportsController();
//# sourceMappingURL=reports.controller.js.map