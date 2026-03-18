import { Request, Response, NextFunction } from 'express';
import { uploadImage } from '../../utils/cloudinary';
import { BadRequestError } from '../../utils/errors';

export class UploadsController {
  async uploadImage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file provided');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new BadRequestError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
      }

      // Max 5MB
      if (req.file.size > 5 * 1024 * 1024) {
        throw new BadRequestError('File too large. Maximum size is 5MB');
      }

      const result = await uploadImage(req.file.buffer, 'broadcasts');

      res.json({
        success: true,
        data: {
          url: result.url,
          width: result.width,
          height: result.height,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadsController = new UploadsController();
