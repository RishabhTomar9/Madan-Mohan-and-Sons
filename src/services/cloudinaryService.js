const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload an image to Cloudinary using unsigned upload.
 * @param {File} file - The image file to upload
 * @param {string} folder - Cloudinary folder (e.g., 'products', 'shop')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadImage(file, folder = 'mms') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('Image upload failed. Please try again.');
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Get an optimized Cloudinary URL with transformations.
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transform options
 */
export function getOptimizedUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary')) return url;

  const { width = 400, height, quality = 'auto', format = 'auto' } = options;
  const transforms = [`w_${width}`, `q_${quality}`, `f_${format}`];
  if (height) transforms.push(`h_${height}`);
  transforms.push('c_fill');

  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}
