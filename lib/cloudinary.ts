import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('Cloudinary environment variables are not fully set. Uploads will fail until configured.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;

export type UploadBufferOptions = {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  tags?: string[];
  overwrite?: boolean;
  transformation?: UploadApiOptions['transformation'];
};

export function uploadFromBuffer(buffer: Buffer, options: UploadBufferOptions = {}): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      public_id: options.publicId,
      resource_type: options.resourceType || 'image',
      tags: options.tags,
      overwrite: options.overwrite ?? true,
      transformation: options.transformation,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error('No result returned from Cloudinary'));
      resolve(result);
    });

    uploadStream.end(buffer);
  });
}

export function getFolderForType(type: string): string {
  const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'shavistore';
  const safeType = ['products', 'categories', 'brands'].includes(type) ? type : 'misc';
  return `${prefix}/${safeType}`;
}

export function getPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Expected: /<cloud_name>/image/upload/v1234567/<folder>/<public_id>.<ext>
    const idx = u.pathname.indexOf('/upload/');
    if (idx === -1) return null;
    const afterUpload = u.pathname.substring(idx + '/upload/'.length);
    // Remove leading version segment if present (v123...)
    const parts = afterUpload.split('/');
    const rest = parts[0].startsWith('v') ? parts.slice(1) : parts;
    const last = rest[rest.length - 1];
    const withoutExt = last.includes('.') ? last.slice(0, last.lastIndexOf('.')) : last;
    const folder = rest.slice(0, -1).join('/');
    return folder ? `${folder}/${withoutExt}` : withoutExt;
  } catch {
    return null;
  }
}