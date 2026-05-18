```js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');
const mockAI = require('./mock-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'Too many requests. Please wait a moment and try again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend running successfully 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Upload route
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      size: req.file.size,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Upload failed',
    });
  }
});

// Analyze route
app.post('/api/analyze', aiLimiter, async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        error: 'Resume text is required',
      });
    }

    res.json({
      overallScore: 85,
      atsScore: 80,
      strengths: [
        'Strong technical profile',
        'Good project experience',
        'Relevant skills'
      ],
      weaknesses: [
        'Add more quantified achievements'
      ]
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Analysis failed',
    });
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Bit-HireMatrix API running on port ${PORT}`);
});

module.exports = app;
```
