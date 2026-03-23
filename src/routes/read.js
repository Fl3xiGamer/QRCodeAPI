const express = require('express');
const multer  = require('multer');
const jsQR    = require('jsqr');
const sharp   = require('sharp');
const router  = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);

    if (!code) {
      return res.status(422).json({ success: false, error: 'No QR code found in the image.' });
    }

    return res.json({ success: true, data: code.data, meta: { imageWidth: info.width, imageHeight: info.height } });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Failed to read QR code: ${err.message}` });
  }
});

module.exports = router;
