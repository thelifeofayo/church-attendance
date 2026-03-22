import { Router, Request, Response } from 'express';
import { ServiceType } from 'shared';
import { attendanceService } from '../attendance/attendance.service';
import { logger } from '../../utils/logger';
import { config } from '../../config';

const router = Router();

function verifyCronSecret(req: Request, res: Response): boolean {
  const secret = req.headers.authorization?.replace('Bearer ', '');
  if (!config.cronSecret || secret !== config.cronSecret) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

// POST /api/cron/attendance-wednesday
router.post('/attendance-wednesday', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    const created = await attendanceService.createRecordsForServiceDay(ServiceType.WEDNESDAY);
    logger.info(`Cron: created ${created} Wednesday attendance records`);
    res.json({ success: true, created });
  } catch (error) {
    logger.error('Cron: failed to create Wednesday attendance records', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// POST /api/cron/attendance-sunday
router.post('/attendance-sunday', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    const created = await attendanceService.createRecordsForServiceDay(ServiceType.SUNDAY);
    logger.info(`Cron: created ${created} Sunday attendance records`);
    res.json({ success: true, created });
  } catch (error) {
    logger.error('Cron: failed to create Sunday attendance records', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

export default router;
