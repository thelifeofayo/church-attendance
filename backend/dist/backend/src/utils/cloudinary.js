"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const config_1 = require("../config");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloudinary.cloudName,
    api_key: config_1.config.cloudinary.apiKey,
    api_secret: config_1.config.cloudinary.apiSecret,
});
async function uploadImage(fileBuffer, folder = 'broadcasts') {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader
            .upload_stream({
            folder: `church-attendance/${folder}`,
            resource_type: 'image',
            transformation: [
                { quality: 'auto', fetch_format: 'auto' }, // Auto-optimize
                { width: 800, crop: 'limit' }, // Max width 800px for emails
            ],
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                });
            }
            else {
                reject(new Error('Upload failed: no result'));
            }
        })
            .end(fileBuffer);
    });
}
async function deleteImage(publicId) {
    await cloudinary_1.v2.uploader.destroy(publicId);
}
//# sourceMappingURL=cloudinary.js.map