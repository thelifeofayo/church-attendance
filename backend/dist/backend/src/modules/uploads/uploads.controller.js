"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadsController = exports.UploadsController = void 0;
const cloudinary_1 = require("../../utils/cloudinary");
const errors_1 = require("../../utils/errors");
class UploadsController {
    async uploadImage(req, res, next) {
        try {
            if (!req.file) {
                throw new errors_1.BadRequestError('No image file provided');
            }
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                throw new errors_1.BadRequestError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
            }
            // Max 5MB
            if (req.file.size > 5 * 1024 * 1024) {
                throw new errors_1.BadRequestError('File too large. Maximum size is 5MB');
            }
            const result = await (0, cloudinary_1.uploadImage)(req.file.buffer, 'broadcasts');
            res.json({
                success: true,
                data: {
                    url: result.url,
                    width: result.width,
                    height: result.height,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UploadsController = UploadsController;
exports.uploadsController = new UploadsController();
//# sourceMappingURL=uploads.controller.js.map