const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use absolute path so uploads always live next to server.js (same as express.static)
const uploadsRoot = path.join(__dirname, '..', 'uploads');
const uploadDirs = [
  uploadsRoot,
  path.join(uploadsRoot, 'images'),
  path.join(uploadsRoot, 'books'),
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder =
      file.fieldname === 'bookFile'
        ? path.join(uploadsRoot, 'books')
        : path.join(uploadsRoot, 'images');
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf'];

  if (file.fieldname === 'bookFile') {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for books'), false);
    }
  } else {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize },
});

module.exports = upload;
