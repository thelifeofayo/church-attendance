import { Router } from 'express';
import { teamsController } from './teams.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrTeamHead, requireAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createTeamSchema,
  updateTeamSchema,
  listTeamsQuerySchema,
  teamIdParamSchema,
} from './teams.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and get - Admin and Team Heads (Team Heads see only their team)
router.get(
  '/',
  requireAdminOrTeamHead(),
  validate({ query: listTeamsQuerySchema }),
  teamsController.list
);

router.get(
  '/:id',
  requireAdminOrTeamHead(),
  validate({ params: teamIdParamSchema }),
  teamsController.getById
);

// Create, update, delete - Admin only
router.post(
  '/',
  requireAdmin(),
  validate({ body: createTeamSchema }),
  teamsController.create
);

router.patch(
  '/:id',
  requireAdmin(),
  validate({ params: teamIdParamSchema, body: updateTeamSchema }),
  teamsController.update
);

router.delete(
  '/:id',
  requireAdmin(),
  validate({ params: teamIdParamSchema }),
  teamsController.deactivate
);

export default router;
