import { v2 as cloudinary } from 'cloudinary';
export interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
}
export declare function uploadImage(fileBuffer: Buffer, folder?: string): Promise<UploadResult>;
export declare function deleteImage(publicId: string): Promise<void>;
export { cloudinary };
//# sourceMappingURL=cloudinary.d.ts.map