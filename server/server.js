
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

app.use(express.json({
  limit: '10mb'
}));

// Rate limiter
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
  }
});

// Health route
app.get('/api/health', function (_req, res) {

  res.json({
    status: 'ok',
    message: 'Backend running successfully',
    timestamp: new Date().toISOString()
  });

});

// Upload route
app.post('/api/upload', upload.single('resume'), async function (req, res) {

  try {

    if (!req.file) {

      return res.status(400).json({
        error: 'No file uploaded'
      });

    }

    let extractedText = '';

    // PDF
    if (req.file.mimetype === 'application/pdf') {

      const data = await pdfParse(req.file.buffer);
      extractedText = data.text;

    }

    // DOCX
    else if (
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {

      const result = await mammoth.extractRawText({
        buffer: req.file.buffer
      });

      extractedText = result.value;

    }

    // TXT
    else if (req.file.mimetype === 'text/plain') {

      extractedText = req.file.buffer.toString('utf8');

    }

    else {

      return res.status(400).json({
        error: 'Unsupported file type'
      });

    }

    res.json({
      success: true,
      text: extractedText
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message || 'Failed to extract resume text'
    });

  }

});

// Analyze route
app.post('/api/analyze', aiLimiter, async function (req, res) {

  try {

    const resumeText = req.body.resumeText;

    if (!resumeText) {

      return res.status(400).json({
        error: 'Resume text is required'
      });

    }

    // Demo AI response
    res.json({
      overallScore: 85,
      atsScore: 80,

      strengths: [
        'Strong technical profile',
        'Good project experience',
        'Relevant skills'
      ],

      weaknesses: [
        'Add more measurable achievements',
        'Improve resume formatting'
      ],

      suggestions: [
        'Add quantified achievements',
        'Improve ATS keywords',
        'Use stronger action verbs'
      ]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message || 'Analysis failed'
    });

  }

});

// Error handler
app.use(function (err, _req, res, _next) {

  console.error(err);

  res.status(500).json({
    error: err.message || 'Internal server error'
  });

});

// Start server
app.listen(PORT, function () {

  console.log("Bit-HireMatrix API running on port " + PORT);

});

module.exports = app;

