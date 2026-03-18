import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { requireHOD, requireTeamHead, requireAdmin } from '../../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/hod', requireHOD(), dashboardController.getHODDashboard);
router.get('/team-head', requireTeamHead(), dashboardController.getTeamHeadDashboard);
router.get('/admin', requireAdmin(), dashboardController.getAdminDashboard);

export default router;
