const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage, uploadFile } = require('../controllers/uploadController');

// Configure Multer for Memory Storage (so we can pass buffer to Firebase)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Apply middleware
router.post('/image', upload.single('file'), uploadImage);
router.post('/video', upload.single('file'), uploadFile || uploadImage);
router.post('/audio', upload.single('file'), uploadFile || uploadImage);
router.post('/file', upload.single('file'), uploadFile || uploadImage);

module.exports = router;
