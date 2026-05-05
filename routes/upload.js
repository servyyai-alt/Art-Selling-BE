const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const parseUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

const uploadImages = async (req, res) => {
  try {
    const files = [
      ...(req.files?.image || []),
      ...(req.files?.images || []),
    ];

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const uploadedImages = [];

    for (const file of files) {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'artt',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      });

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        alt: file.originalname,
      });
    }

    res.json({
      success: true,
      image: uploadedImages[0],
      images: uploadedImages,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upload image(s)
router.post('/', protect, adminOnly, parseUpload, uploadImages);
router.post('/image', protect, adminOnly, parseUpload, uploadImages);

// Delete image
router.delete('/image/:publicId', protect, adminOnly, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
