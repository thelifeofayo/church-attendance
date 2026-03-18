"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAttendanceJobs = startAttendanceJobs;
exports.triggerAttendanceRecordCreation = triggerAttendanceRecordCreation;
const node_cron_1 = __importDefault(require("node-cron"));
const shared_1 = require("shared");
const attendance_service_1 = require("../modules/attendance/attendance.service");
const logger_1 = require("../utils/logger");
// Schedule: Run at 00:01 AM on Wednesdays and Sundays
const WEDNESDAY_SCHEDULE = '1 0 * * 3'; // 00:01 on Wednesday
const SUNDAY_SCHEDULE = '1 0 * * 0'; // 00:01 on Sunday
function startAttendanceJobs() {
    // Wednesday job
    node_cron_1.default.schedule(WEDNESDAY_SCHEDULE, async () => {
        logger_1.logger.info('Running Wednesday attendance record creation job');
        try {
            const created = await attendance_service_1.attendanceService.createRecordsForServiceDay(shared_1.ServiceType.WEDNESDAY);
            logger_1.logger.info(`Created ${created} Wednesday attendance records`);
        }
        catch (error) {
            logger_1.logger.error('Error creating Wednesday attendance records', error);
        }
    });
    // Sunday job
    node_cron_1.default.schedule(SUNDAY_SCHEDULE, async () => {
        logger_1.logger.info('Running Sunday attendance record creation job');
        try {
            const created = await attendance_service_1.attendanceService.createRecordsForServiceDay(shared_1.ServiceType.SUNDAY);
            logger_1.logger.info(`Created ${created} Sunday attendance records`);
        }
        catch (error) {
            logger_1.logger.error('Error creating Sunday attendance records', error);
        }
    });
    logger_1.logger.info('Attendance record creation jobs scheduled');
}
// Manual trigger function (useful for testing or initial setup)
async function triggerAttendanceRecordCreation(serviceType) {
    logger_1.logger.info(`Manually triggering ${serviceType} attendance record creation`);
    const created = await attendance_service_1.attendanceService.createRecordsForServiceDay(serviceType);
    logger_1.logger.info(`Created ${created} ${serviceType} attendance records`);
    return created;
}
//# sourceMappingURL=attendanceRecordCreator.js.map