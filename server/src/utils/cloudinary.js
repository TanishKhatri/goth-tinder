import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

const looksPlaceholder = (v) =>
  !v || v.includes('<') || v.toLowerCase().includes('your_') || v.toLowerCase().includes('xxx');

const hasIndividualCreds = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  ![process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET].some(looksPlaceholder);

// Prefer explicit vars (a placeholder CLOUDINARY_URL must not shadow them);
// otherwise fall back to CLOUDINARY_URL, which the SDK reads automatically.
if (hasIndividualCreds()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else if (process.env.CLOUDINARY_URL && !looksPlaceholder(process.env.CLOUDINARY_URL)) {
  cloudinary.config({ secure: true });
}

export const isCloudinaryEnabled = () => {
  if (hasIndividualCreds()) return true;
  return Boolean(process.env.CLOUDINARY_URL && !looksPlaceholder(process.env.CLOUDINARY_URL));
};

// Uploads an image data URL (or remote URL) and returns the CDN secure_url.
export const uploadPhoto = async (image, userId) => {
  const result = await cloudinary.uploader.upload(image, {
    folder: `nocturne/${userId}`,
    resource_type: 'image',
    transformation: [{ width: 1080, height: 1350, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
  });
  return result.secure_url;
};

export const deletePhoto = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};
