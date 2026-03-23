const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();

/**
 * POST /generate
 * Body: { data, format, size, margin, darkColor, lightColor, errorLevel }
 */
router.post('/', async (req, res) => {
  const {
    data,
    format     = 'png',
    size       = 300,
    margin     = 2,
    darkColor  = '#000000',
    lightColor = '#ffffff',
    errorLevel = 'M',
  } = req.body;

  if (!data || typeof data !== 'string')
    return res.status(400).json({ success: false, error: '`data` is required and must be a string.' });
  if (data.length > 2953)
    return res.status(400).json({ success: false, error: '`data` exceeds max QR capacity (2953 bytes).' });
  if (!['png', 'svg', 'base64'].includes(format))
    return res.status(400).json({ success: false, error: '`format` must be "png", "svg", or "base64".' });
  if (!['L', 'M', 'Q', 'H'].includes(errorLevel.toUpperCase()))
    return res.status(400).json({ success: false, error: '`errorLevel` must be L, M, Q, or H.' });

  const pixelSize = Math.min(Math.max(Number(size) || 300, 100), 2000);
  const quietZone = Math.min(Math.max(Number(margin) || 2, 0), 10);

  const opts = {
    errorCorrectionLevel: errorLevel.toUpperCase(),
    margin: quietZone,
    color: { dark: darkColor, light: lightColor },
    width: pixelSize,
  };

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(data, { ...opts, type: 'svg' });
      return res.json({ success: true, format: 'svg', data: svg,
        meta: { size: pixelSize, margin: quietZone, errorLevel: errorLevel.toUpperCase(), chars: data.length } });
    }

    const buffer = await QRCode.toBuffer(data, { ...opts, type: 'png' });

    if (format === 'base64') {
      return res.json({ success: true, format: 'base64', mimeType: 'image/png',
        data: `data:image/png;base64,${buffer.toString('base64')}`,
        meta: { size: pixelSize, margin: quietZone, errorLevel: errorLevel.toUpperCase(), chars: data.length } });
    }

    res.set('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ success: false, error: `QR generation failed: ${err.message}` });
  }
});

module.exports = router;
