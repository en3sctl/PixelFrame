import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

/**
 * Ensure Cloudinary is configured (lazy loading)
 */
function ensureConfigured() {
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    isConfigured = true;
    console.log('Cloudinary configured with cloud:', process.env.CLOUDINARY_CLOUD_NAME);
  }
}

/**
 * Upload an image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (fileBuffer, folder = 'pixelframe') => {
  ensureConfigured();
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image
 * @returns {Promise<void>}
 */
export const deleteImage = async (publicId) => {
  ensureConfigured();
  
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of public IDs
 * @returns {Promise<void>}
 */
export const deleteImages = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) return;
  
  ensureConfigured();
  
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error);
    throw error;
  }
};

export default cloudinary;
