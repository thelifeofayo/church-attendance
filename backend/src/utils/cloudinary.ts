import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'broadcasts'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `church-attendance/${folder}`,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }, // Auto-optimize
            { width: 800, crop: 'limit' }, // Max width 800px for emails
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          } else {
            reject(new Error('Upload failed: no result'));
          }
        }
      )
      .end(fileBuffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
