import { Router } from 'express';
import { emailTemplatesController } from './emailTemplates.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
  listEmailTemplatesQuerySchema,
  emailTemplateIdParamSchema,
  listEmailLogsQuerySchema,
} from './emailTemplates.schema';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin());

router.get(
  '/',
  validate({ query: listEmailTemplatesQuerySchema }),
  emailTemplatesController.list as any
);

router.get(
  '/:id',
  validate({ params: emailTemplateIdParamSchema }),
  emailTemplatesController.getById
);

router.post(
  '/',
  validate({ body: createEmailTemplateSchema }),
  emailTemplatesController.create
);

router.patch(
  '/:id',
  validate({ params: emailTemplateIdParamSchema, body: updateEmailTemplateSchema }),
  emailTemplatesController.update
);

router.delete(
  '/:id',
  validate({ params: emailTemplateIdParamSchema }),
  emailTemplatesController.delete
);

// Email logs routes
router.get(
  '/logs/list',
  validate({ query: listEmailLogsQuerySchema }),
  emailTemplatesController.listLogs as any
);

router.get(
  '/logs/stats',
  emailTemplatesController.getStats
);

export default router;
