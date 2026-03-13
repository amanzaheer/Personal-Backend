const path = require('path');

/**
 * Convert multer's absolute file path to a relative web path for API responses.
 * Frontend builds full URL as: VITE_UPLOADS_BASE_URL + this path (e.g. http://localhost:5000/uploads/images/xxx.jpg)
 * @param {string} filePath - Path from multer (absolute or already relative)
 * @param {'image'|'book'} kind - 'image' for uploads/images, 'book' for uploads/books
 * @returns {string} Relative path like "uploads/images/filename.jpg" or "uploads/books/filename.pdf"
 */
function toWebPath(filePath, kind = 'image') {
  if (!filePath || typeof filePath !== 'string') return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('uploads/')) return normalized;
  const basename = path.basename(normalized);
  const dir = kind === 'book' ? 'uploads/books' : 'uploads/images';
  return `${dir}/${basename}`;
}

module.exports = { toWebPath };
