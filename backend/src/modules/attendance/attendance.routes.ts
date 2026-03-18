import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate } from '../../middleware/auth';
import { requireAuthenticated, requireHOD, requireAdminOrTeamHead, requireAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  submitAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceQuerySchema,
  attendanceIdParamSchema,
  triggerRecordCreationSchema,
} from './attendance.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and get - All authenticated users (filtered by role)
router.get(
  '/',
  requireAuthenticated(),
  validate({ query: listAttendanceQuerySchema }),
  attendanceController.list
);

// Trigger attendance record creation - Admin only (for manual creation if cron missed)
// Must be before /:id to avoid "trigger-creation" being matched as an ID
router.post(
  '/trigger-creation',
  requireAdmin(),
  validate({ body: triggerRecordCreationSchema }),
  attendanceController.triggerRecordCreation
);

router.get(
  '/:id',
  requireAuthenticated(),
  validate({ params: attendanceIdParamSchema }),
  attendanceController.getById
);

// Submit - HOD only
router.post(
  '/:id/submit',
  requireHOD(),
  validate({ params: attendanceIdParamSchema, body: submitAttendanceSchema }),
  attendanceController.submit
);

// Update - HOD (within window) or Admin (override)
router.patch(
  '/:id',
  requireAuthenticated(),
  validate({ params: attendanceIdParamSchema, body: updateAttendanceSchema }),
  attendanceController.update
);

// Send reminder - Admin or Team Head
router.post(
  '/:id/remind',
  requireAdminOrTeamHead(),
  validate({ params: attendanceIdParamSchema }),
  attendanceController.sendReminder
);

export default router;
