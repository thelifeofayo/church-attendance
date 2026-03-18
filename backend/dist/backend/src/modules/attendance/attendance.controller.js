"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceController = exports.AttendanceController = void 0;
const attendance_service_1 = require("./attendance.service");
class AttendanceController {
    async list(req, res, next) {
        try {
            const result = await attendance_service_1.attendanceService.listAttendanceRecords(req.query, req.user);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const record = await attendance_service_1.attendanceService.getAttendanceById(req.params.id, req.user);
            res.json({
                success: true,
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async submit(req, res, next) {
        try {
            const record = await attendance_service_1.attendanceService.submitAttendance(req.params.id, req.body, req.user);
            res.json({
                success: true,
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const record = await attendance_service_1.attendanceService.updateAttendance(req.params.id, req.body, req.user);
            res.json({
                success: true,
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async sendReminder(req, res, next) {
        try {
            await attendance_service_1.attendanceService.sendReminder(req.params.id, req.user);
            res.json({
                success: true,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async triggerRecordCreation(req, res, next) {
        try {
            const { serviceType } = req.body;
            const created = await attendance_service_1.attendanceService.createRecordsForServiceDay(serviceType);
            res.json({
                success: true,
                data: { created },
                message: `Created ${created} attendance records for ${serviceType}`,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AttendanceController = AttendanceController;
exports.attendanceController = new AttendanceController();
//# sourceMappingURL=attendance.controller.js.map