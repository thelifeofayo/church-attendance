"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("shared");
const attendance_service_1 = require("../attendance/attendance.service");
const logger_1 = require("../../utils/logger");
const config_1 = require("../../config");
const router = (0, express_1.Router)();
function verifyCronSecret(req, res) {
    const secret = req.headers.authorization?.replace('Bearer ', '');
    if (!config_1.config.cronSecret || secret !== config_1.config.cronSecret) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return false;
    }
    return true;
}
// POST /api/cron/attendance-wednesday
router.post('/attendance-wednesday', async (req, res) => {
    if (!verifyCronSecret(req, res))
        return;
    try {
        const created = await attendance_service_1.attendanceService.createRecordsForServiceDay(shared_1.ServiceType.WEDNESDAY);
        logger_1.logger.info(`Cron: created ${created} Wednesday attendance records`);
        res.json({ success: true, created });
    }
    catch (error) {
        logger_1.logger.error('Cron: failed to create Wednesday attendance records', error);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});
// POST /api/cron/attendance-sunday
router.post('/attendance-sunday', async (req, res) => {
    if (!verifyCronSecret(req, res))
        return;
    try {
        const created = await attendance_service_1.attendanceService.createRecordsForServiceDay(shared_1.ServiceType.SUNDAY);
        logger_1.logger.info(`Cron: created ${created} Sunday attendance records`);
        res.json({ success: true, created });
    }
    catch (error) {
        logger_1.logger.error('Cron: failed to create Sunday attendance records', error);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});
exports.default = router;
//# sourceMappingURL=cron.routes.js.map