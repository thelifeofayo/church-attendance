import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrTeamHead } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from './users.schema';

const router = Router();

// All routes require authentication and Admin/Team Head role
router.use(authenticate);
router.use(requireAdminOrTeamHead());

router.get(
  '/',
  validate({ query: listUsersQuerySchema }),
  usersController.list as any
);

router.get(
  '/:id',
  validate({ params: userIdParamSchema }),
  usersController.getById
);

router.post(
  '/',
  validate({ body: createUserSchema }),
  usersController.create
);

router.patch(
  '/:id',
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  usersController.update
);

router.delete(
  '/:id',
  validate({ params: userIdParamSchema }),
  usersController.deactivate
);

export default router;
