const express = require('express');
const multer  = require('multer');
const Jimp    = require('jimp');
const jsQR    = require('jsqr');
const router  = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted.'));
  },
});

/**
 * POST /validate
 * Same input as /read – returns validity info without the decoded content.
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
      return res.status(400).json({ success: false, error: 'Provide an image file or base64 string.' });
    }

    const image = await Jimp.read(imageBuffer);
    const { data, width, height } = image.bitmap;
    const code = jsQR(data, width, height, { inversionAttempts: 'dontInvert' });

    return res.json({
      success: true,
      valid: !!code,
      meta: {
        imageWidth:  width,
        imageHeight: height,
        hasQRCode:   !!code,
        contentType: code ? detectContentType(code.data) : null,
        dataLength:  code ? code.data.length : null,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Validation failed: ${err.message}` });
  }
});

function detectContentType(str) {
  if (/^https?:\/\//i.test(str))       return 'url';
  if (/^mailto:/i.test(str))           return 'email';
  if (/^tel:/i.test(str))              return 'phone';
  if (/^BEGIN:VCARD/i.test(str))       return 'vcard';
  if (/^WIFI:/i.test(str))             return 'wifi';
  if (/^geo:/i.test(str))              return 'geo';
  return 'text';
}

module.exports = router;
