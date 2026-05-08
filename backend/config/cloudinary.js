const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Connect to Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define where and how to store uploaded files
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'ecommerce/products', // folder name in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }], // auto-resize
  },
});

// Strict Multer setup
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10,                   // max 10 images per product
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.mimetype)) {
      // Reject the file
      return cb(new Error('Only jpg, jpeg, png, webp images are allowed'), false);
    }
    cb(null, true); // Accept the file
  },
});

module.exports = { upload, cloudinary };