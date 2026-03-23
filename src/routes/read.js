const express = require('express');
const multer  = require('multer');
const Jimp    = require('jimp');
const jsQR    = require('jsqr');
const router  = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted.'));
  },
});

/**
 * POST /read
 * Multipart: image file  OR  JSON: { base64: "data:image/png;base64,..." }
 * Returns the decoded content of the QR code.
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    let imageBuffer;

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body && req.body.base64) {
      const b64 = req.body.base64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(b64, 'base64');
    } else {
      return res.status(400).json({ success: false, error: 'Provide an image file (field: "image") or a base64 string (field: "base64").' });
    }

    const image = await Jimp.read(imageBuffer);
    const { data, width, height } = image.bitmap;
    const code = jsQR(data, width, height, { inversionAttempts: 'dontInvert' });

    if (!code) {
      return res.status(422).json({ success: false, error: 'No QR code found in the image. Make sure the image is clear and the QR code is fully visible.' });
    }

    return res.json({
      success: true,
      data: code.data,
      meta: {
        imageWidth:  width,
        imageHeight: height,
        location: code.location,
      },
    });
  } catch (err) {
    console.error('read error:', err.message);
    return res.status(500).json({ success: false, error: `Failed to read QR code: ${err.message}` });
  }
});

module.exports = router;
