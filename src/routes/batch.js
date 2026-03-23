const express  = require('express');
const QRCode   = require('qrcode');
const router   = express.Router();

/**
 * POST /batch
 * Body: { items: [ { data, format?, size?, darkColor?, lightColor? }, ... ] }
 * Max 20 items per request.
 */
router.post('/', async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ success: false, error: '`items` must be a non-empty array.' });
  if (items.length > 20)
    return res.status(400).json({ success: false, error: 'Max 20 items per batch request.' });

  const results = await Promise.all(items.map(async (item, idx) => {
    const {
      data,
      format     = 'base64',
      size       = 300,
      darkColor  = '#000000',
      lightColor = '#ffffff',
      errorLevel = 'M',
    } = item;

    if (!data || typeof data !== 'string')
      return { index: idx, success: false, error: '`data` is required.' };
    if (data.length > 2953)
      return { index: idx, success: false, error: '`data` exceeds max QR capacity.' };

    try {
      const opts = {
        errorCorrectionLevel: (errorLevel || 'M').toUpperCase(),
        margin: 2,
        color: { dark: darkColor, light: lightColor },
        width: Math.min(Math.max(Number(size) || 300, 100), 1000),
      };

      if (format === 'svg') {
        const svg = await QRCode.toString(data, { ...opts, type: 'svg' });
        return { index: idx, success: true, format: 'svg', data: svg };
      }

      const buffer = await QRCode.toBuffer(data, { ...opts, type: 'png' });
      return { index: idx, success: true, format: 'base64', mimeType: 'image/png',
        data: `data:image/png;base64,${buffer.toString('base64')}` };
    } catch (err) {
      return { index: idx, success: false, error: err.message };
    }
  }));

  const succeeded = results.filter(r => r.success).length;
  return res.json({ success: true, total: items.length, succeeded, failed: items.length - succeeded, results });
});

module.exports = router;
