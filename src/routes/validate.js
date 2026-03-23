const express = require('express');
const multer  = require('multer');
const jsQR    = require('jsqr');
const sharp   = require('sharp');
const router  = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/', async (req, res) => {
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

    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);

    return res.json({
      success: true,
      valid: !!code,
      meta: {
        imageWidth: info.width,
        imageHeight: info.height,
        hasQRCode: !!code,
        contentType: code ? detectContentType(code.data) : null,
        dataLength: code ? code.data.length : null,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Validation failed: ${err.message}` });
  }
});

function detectContentType(str) {
  if (/^https?:\/\//i.test(str)) return 'url';
  if (/^mailto:/i.test(str))     return 'email';
  if (/^tel:/i.test(str))        return 'phone';
  if (/^BEGIN:VCARD/i.test(str)) return 'vcard';
  if (/^WIFI:/i.test(str))       return 'wifi';
  if (/^geo:/i.test(str))        return 'geo';
  return 'text';
}

module.exports = router;
