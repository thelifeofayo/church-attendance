import { Router } from 'express';
import multer from 'multer';
import { uploadsController } from './uploads.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin, requireTeamHead } from '../../middleware/rbac';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// All routes require authentication
router.use(authenticate);

// Only admins and team heads can upload images (for broadcasts)
router.post(
  '/image',
  requireTeamHead(), // Team heads and admins can upload
  upload.single('image'),
  uploadsController.uploadImage
);

export default router;
