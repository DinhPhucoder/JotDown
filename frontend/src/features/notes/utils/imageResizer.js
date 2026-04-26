const MAX_SIDE = 1600;
const WEBP_QUALITY = 0.82;

/**
 * Resizes an image file to fit within MAX_SIDE x MAX_SIDE while preserving aspect ratio.
 * Returns a base64 WebP data URL.
 *
 * @param {File} file
 * @returns {Promise<string>} base64 WebP data URL
 */
export function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const ratio = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Không thể xử lý ảnh'));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      const resizedDataUrl = canvas.toDataURL('image/webp', WEBP_QUALITY);
      URL.revokeObjectURL(imageUrl);
      resolve(resizedDataUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Không thể đọc ảnh'));
    };

    image.src = imageUrl;
  });
}
