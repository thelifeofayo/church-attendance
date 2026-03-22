import { Router } from 'express';
import { departmentsController } from './departments.controller';
import { authenticate } from '../../middleware/auth';
import { requireAuthenticated, requireAdminOrTeamHead } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  assignHODSchema,
  assignAssistantHODSchema,
  listDepartmentsQuerySchema,
  departmentIdParamSchema,
} from './departments.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and get - All authenticated users (filtered by role)
router.get(
  '/',
  requireAuthenticated(),
  validate({ query: listDepartmentsQuerySchema }),
  departmentsController.list as any
);

router.get(
  '/:id',
  requireAuthenticated(),
  validate({ params: departmentIdParamSchema }),
  departmentsController.getById
);

// Create, update, delete - Admin and Team Heads only
router.post(
  '/',
  requireAdminOrTeamHead(),
  validate({ body: createDepartmentSchema }),
  departmentsController.create
);

router.patch(
  '/:id',
  requireAdminOrTeamHead(),
  validate({ params: departmentIdParamSchema, body: updateDepartmentSchema }),
  departmentsController.update
);

router.patch(
  '/:id/assign-hod',
  requireAdminOrTeamHead(),
  validate({ params: departmentIdParamSchema, body: assignHODSchema }),
  departmentsController.assignHOD
);

router.patch(
  '/:id/assign-assistant-hod',
  requireAdminOrTeamHead(),
  validate({ params: departmentIdParamSchema, body: assignAssistantHODSchema }),
  departmentsController.assignAssistantHOD
);

router.delete(
  '/:id',
  requireAdminOrTeamHead(),
  validate({ params: departmentIdParamSchema }),
  departmentsController.deactivate
);

export default router;
