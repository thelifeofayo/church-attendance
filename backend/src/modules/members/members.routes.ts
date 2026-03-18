import { Router } from 'express';
import { membersController } from './members.controller';
import { authenticate } from '../../middleware/auth';
import { requireHOD } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createMemberSchema,
  updateMemberSchema,
  listMembersQuerySchema,
  memberIdParamSchema,
} from './members.schema';

const router = Router();

// All routes require authentication and HOD role
router.use(authenticate);
router.use(requireHOD());

router.get(
  '/',
  validate({ query: listMembersQuerySchema }),
  membersController.list
);

router.get(
  '/:id',
  validate({ params: memberIdParamSchema }),
  membersController.getById
);

router.post(
  '/',
  validate({ body: createMemberSchema }),
  membersController.create
);

router.patch(
  '/:id',
  validate({ params: memberIdParamSchema, body: updateMemberSchema }),
  membersController.update
);

router.delete(
  '/:id',
  validate({ params: memberIdParamSchema }),
  membersController.deactivate
);

router.post(
  '/:id/reactivate',
  validate({ params: memberIdParamSchema }),
  membersController.reactivate
);

export default router;
