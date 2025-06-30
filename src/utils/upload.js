const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Pastikan direktori upload ada
const uploadDir = path.resolve(config.UPLOAD_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Filter file yang diizinkan
const fileFilter = (req, file, cb) => {
  // Daftar tipe file yang diizinkan
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/jpg', 
    'application/pdf', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, PDF, atau DOC.'), false);
  }
};

// Konfigurasi upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE // Default 5MB
  }
});

// Fungsi untuk menghapus file
const deleteFile = (filePath) => {
  const fullPath = path.join(uploadDir, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

module.exports = {
  upload,
  deleteFile,
  uploadDir
};