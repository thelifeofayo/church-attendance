import { Router } from 'express';
import { broadcastsController } from './broadcasts.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrTeamHead } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createBroadcastSchema,
  listBroadcastsQuerySchema,
  broadcastIdParamSchema,
} from './broadcasts.schema';

const router = Router();

// All routes require authentication and Admin or Team Head role
router.use(authenticate);
router.use(requireAdminOrTeamHead());

router.get(
  '/',
  validate({ query: listBroadcastsQuerySchema }),
  broadcastsController.list
);

router.post(
  '/',
  validate({ body: createBroadcastSchema }),
  broadcastsController.create
);

router.post(
  '/:id/send',
  validate({ params: broadcastIdParamSchema }),
  broadcastsController.send
);

router.delete(
  '/:id',
  validate({ params: broadcastIdParamSchema }),
  broadcastsController.delete
);

export default router;
