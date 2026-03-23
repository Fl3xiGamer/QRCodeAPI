const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const generateRouter = require('./routes/generate');
const readRouter = require('./routes/read');
const batchRouter = require('./routes/batch');
const validateRouter = require('./routes/validate');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});
app.use(limiter);

app.get('/', (req, res) => {
  res.json({
    name: 'QR Code Generator & Reader API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      'POST /generate': 'Generate a QR code from text or URL',
      'POST /read':     'Read/decode a QR code image',
      'POST /batch':    'Generate multiple QR codes at once',
      'GET  /validate': 'Validate a QR code image',
    },
  });
});

app.use('/generate', generateRouter);
app.use('/read',     readRouter);
app.use('/batch',    batchRouter);
app.use('/validate', validateRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint ${req.method} ${req.path} not found.` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`QR API running on port ${PORT}`));
module.exports = app;
