import { api } from './api';

export const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (ev) => resolve(ev.target.result);
  reader.onerror = () => reject(new Error('Could not read file'));
  reader.readAsDataURL(file);
});

export const isUploadableImage = (file, maxBytes = 5 * 1024 * 1024) => {
  if (!file.type.startsWith('image/')) return { ok: false, reason: 'Not an image file' };
  if (file.size > maxBytes) return { ok: false, reason: 'File too large (max 5MB)' };
  return { ok: true };
};

// Uploads to Cloudinary via the backend. Resolves with the CDN secure_url.
// Throws if uploads are unconfigured or fail — callers should fall back to
// the local data URL so photo selection never hard-blocks the user.
export const uploadPhotoFile = async (file) => {
  const dataUrl = await readFileAsDataURL(file);
  const { url } = await api.users.uploadPhoto(dataUrl);
  return { preview: dataUrl, url };
};

export const newPhotoId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
