import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  weeklyReportQuerySchema,
  exportReportQuerySchema,
} from './reports.schema';

const router = Router();

// All routes require authentication and Admin role
router.use(authenticate);
router.use(requireAdmin());

router.get(
  '/weekly',
  validate({ query: weeklyReportQuerySchema }),
  reportsController.getWeeklyReport
);

router.get(
  '/export',
  validate({ query: exportReportQuerySchema }),
  reportsController.exportReport
);

export default router;
