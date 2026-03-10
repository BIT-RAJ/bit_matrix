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

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting — 30 AI requests per minute per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.'));
  },
});

// --------------- Gemini Setup ---------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ordered list of models to try — if the primary is overloaded/unavailable, fall through
const MODEL_CASCADE = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

function getModel(modelName) {
  return genAI.getGenerativeModel({ model: modelName });
}

// --------------- Retry Helper ---------------
async function callGeminiWithRetry(prompt, maxRetries = 2) {
  let lastError;

  for (const modelName of MODEL_CASCADE) {
    const model = getModel(modelName);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000)
          ),
        ]);
        console.log(`✅ Success with model: ${modelName} (attempt ${attempt})`);
        return result;
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        const shouldFallback = msg.includes('503') || msg.includes('overloaded') ||
          msg.includes('Service Unavailable') || msg.includes('404') ||
          msg.includes('Not Found') || msg.includes('not supported') ||
          msg.includes('429') || msg.includes('Too Many Requests') ||
          msg.includes('quota');
        console.warn(`⚠️ ${modelName} attempt ${attempt}/${maxRetries} failed:`, msg.substring(0, 200));

        // If model is unavailable (503/404), skip remaining retries and try next model
        if (shouldFallback) {
          console.warn(`🔄 Model ${modelName} is unavailable, falling back to next model...`);
          break;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
  }

  throw lastError;
}

function parseGeminiJSON(responseText) {
  const cleaned = responseText
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();
  return JSON.parse(cleaned);
}

// --------------- Helpers ---------------
async function extractText(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  if (ext === 'doc' || ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (ext === 'txt') {
    return file.buffer.toString('utf-8');
  }

  throw new Error('Unsupported file type');
}

// --------------- Routes ---------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload and extract text
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const text = await extractText(req.file);
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please try a different file.' });
    }

    // Word/char stats
    const cleanText = text.trim();
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const charCount = cleanText.length;

    res.json({
      text: cleanText,
      filename: req.file.originalname,
      stats: { wordCount, charCount },
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process file' });
  }
});

// Analyze resume
app.post('/api/analyze', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobRole } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });
    if (resumeText.length > 50000) return res.status(400).json({ error: 'Resume text is too long (max 50,000 characters)' });

    const jobRoleContext = jobRole
      ? `The candidate is targeting the role of: "${jobRole}". Tailor all suggestions specifically for this role.`
      : 'No specific job role provided. Give general improvement suggestions.';

    const prompt = `You are an expert career coach and resume reviewer. Analyze the following resume and provide structured feedback in JSON format.

${jobRoleContext}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences) with this exact structure:
{
  "overallScore": <number 1-100>,
  "scoreSummary": "<one-line summary of overall quality>",
  "atsScore": <number 1-100 representing ATS compatibility>,
  "atsFeedback": "<one-line ATS compatibility summary>",
  "atsKeywords": {
    "found": ["<keyword found in resume>"],
    "missing": ["<important keyword missing from resume>"]
  },
  "improvedBullets": [
    {
      "original": "<original bullet point or weak sentence>",
      "improved": "<improved version with strong action verbs and quantified results>"
    }
  ],
  "missingSkills": [
    {
      "skill": "<skill name>",
      "reason": "<why this skill is important for their target role>",
      "priority": "<high|medium|low>"
    }
  ],
  "projectRecommendations": [
    {
      "title": "<project title>",
      "description": "<brief description of a project they could add to strengthen their resume>",
      "difficulty": "<beginner|intermediate|advanced>"
    }
  ],
  "sectionFeedback": {
    "education": { "score": <1-10>, "feedback": "<specific feedback>", "suggestions": ["<suggestion>"] },
    "experience": { "score": <1-10>, "feedback": "<specific feedback>", "suggestions": ["<suggestion>"] },
    "skills": { "score": <1-10>, "feedback": "<specific feedback>", "suggestions": ["<suggestion>"] },
    "projects": { "score": <1-10>, "feedback": "<specific feedback>", "suggestions": ["<suggestion>"] },
    "overall_format": { "score": <1-10>, "feedback": "<specific feedback>", "suggestions": ["<suggestion>"] }
  },
  "grammarIssues": [
    {
      "original": "<text with issue>",
      "corrected": "<corrected version>",
      "explanation": "<what was wrong>"
    }
  ],
  "linkedinSummary": "<A compelling 3-4 sentence LinkedIn 'About' summary based on the resume content>",
  "strengths": ["<key strength of the resume>"],
  "weaknesses": ["<key weakness of the resume>"]
}

Ensure at least 4 improved bullets, 4 missing skills, 3 project recommendations, 3 grammar checks, 3 strengths, 3 weaknesses, 5 found keywords, and 5 missing keywords. Be specific and actionable.`;

    let analysis;
    try {
      const result = await callGeminiWithRetry(prompt);
      analysis = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /analyze, using mock AI:', aiErr.message?.substring(0, 200));
      analysis = mockAI.getMockAnalysis(resumeText, jobRole);
    }

    res.json(analysis);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// Generate interview questions
app.post('/api/interview', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobRole } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

    const jobRoleContext = jobRole
      ? `The candidate is applying for: "${jobRole}".`
      : '';

    const prompt = `You are an expert interviewer and hiring manager. Based on the following resume, generate personalized interview questions to help the candidate prepare.

${jobRoleContext}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences) with this structure:
{
  "questions": [
    {
      "id": <number>,
      "category": "<Technical | Behavioral | Situational>",
      "difficulty": "<Easy | Medium | Hard>",
      "question": "<the interview question>",
      "suggestedAnswer": "<a strong sample answer based on the resume content>",
      "tip": "<a brief tip for answering this type of question>",
      "followUp": "<a potential follow-up question the interviewer might ask>"
    }
  ]
}

Generate exactly 10 questions: 4 Technical, 3 Behavioral, 3 Situational. Assign difficulty levels. Make them specific to the candidate's experience, projects, and skills listed in the resume.`;

    let interview;
    try {
      const result = await callGeminiWithRetry(prompt);
      interview = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /interview, using mock AI:', aiErr.message?.substring(0, 200));
      interview = mockAI.getMockInterview(resumeText, jobRole);
    }

    res.json(interview);
  } catch (err) {
    console.error('Interview error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate interview questions' });
  }
});

// Generate cover letter
app.post('/api/cover-letter', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobRole, companyName } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

    const prompt = `You are an expert career coach. Write a compelling, professional cover letter based on the following resume.

${jobRole ? `Target role: "${jobRole}"` : ''}
${companyName ? `Target company: "${companyName}"` : ''}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences) with this structure:
{
  "coverLetter": "<the complete cover letter text, with proper paragraph breaks using \\n\\n>",
  "keyPoints": ["<key selling point highlighted in the letter>"],
  "customizationTips": ["<tip for customizing this letter for specific applications>"]
}

Write a strong, personalized cover letter (3-4 paragraphs) that highlights the candidate's relevant experience and skills. Do not use generic filler text.`;

    let coverLetter;
    try {
      const result = await callGeminiWithRetry(prompt);
      coverLetter = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /cover-letter, using mock AI:', aiErr.message?.substring(0, 200));
      coverLetter = mockAI.getMockCoverLetter(resumeText, jobRole, companyName);
    }

    res.json(coverLetter);
  } catch (err) {
    console.error('Cover letter error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate cover letter' });
  }
});

// JD Comparison — score resume against a job description
app.post('/api/jd-compare', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) return res.status(400).json({ error: 'Resume text and job description are required' });

    const prompt = `You are an expert recruiter. Compare this resume against the job description and provide a match analysis.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""

Return ONLY valid JSON (no markdown code fences):
{
  "matchScore": <number 1-100>,
  "matchSummary": "<one-line summary>",
  "matchedSkills": ["<skill from resume that matches JD>"],
  "missingSkills": ["<skill required by JD but missing from resume>"],
  "matchedExperience": ["<experience that aligns with JD>"],
  "gaps": ["<experience gap relative to JD>"],
  "tailoringTips": ["<specific tip to tailor resume for this job>"],
  "keywordMatches": { "found": ["<keyword>"], "missing": ["<keyword>"] }
}
Provide at least 3 items per array.`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /jd-compare, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockJDCompare(resumeText, jobDescription);
    }
    res.json(data);
  } catch (err) {
    console.error('JD compare error:', err);
    res.status(500).json({ error: err.message || 'Comparison failed' });
  }
});

// Resume Rewriter
app.post('/api/rewrite', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobRole, style } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

    const prompt = `You are a professional resume writer. Rewrite the following resume to be more impactful, concise, and ATS-friendly.
${jobRole ? `Target role: "${jobRole}".` : ''}
${style ? `Writing style: "${style}".` : 'Use a professional and impactful style.'}

ORIGINAL RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences):
{
  "rewrittenResume": "<the complete rewritten resume text with proper formatting using \\n for line breaks>",
  "changesSummary": ["<summary of key change made>"],
  "improvementScore": <number showing % improvement estimated>
}
Rewrite the entire resume preserving all factual information but improving language, structure, and impact.`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /rewrite, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockRewrite(resumeText, jobRole, style);
    }
    res.json(data);
  } catch (err) {
    console.error('Rewrite error:', err);
    res.status(500).json({ error: err.message || 'Rewrite failed' });
  }
});

// Salary Estimation
app.post('/api/salary', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobRole, location } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

    const prompt = `Based on this resume, estimate salary ranges. Consider skills, experience level, and market data.
${jobRole ? `Target role: "${jobRole}".` : ''}
${location ? `Location: "${location}".` : 'Consider US market averages.'}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences):
{
  "estimatedLevel": "<Junior|Mid-Level|Senior|Lead|Principal>",
  "yearsExperience": "<estimated years>",
  "salaryRange": { "low": <number>, "mid": <number>, "high": <number>, "currency": "USD" },
  "factors": ["<factor that influences the salary estimate>"],
  "negotiationTips": ["<tip for salary negotiation>"],
  "marketInsights": "<brief paragraph about current market for this role>"
}`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /salary, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockSalary(resumeText, jobRole, location);
    }
    res.json(data);
  } catch (err) {
    console.error('Salary error:', err);
    res.status(500).json({ error: err.message || 'Salary estimation failed' });
  }
});

// Career Path Suggestions
app.post('/api/career-paths', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobRole } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

    const prompt = `Based on this resume, suggest career progression paths.
${jobRole ? `Current target: "${jobRole}".` : ''}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences):
{
  "currentLevel": "<current estimated career level>",
  "paths": [
    {
      "title": "<career path title>",
      "timeline": "<estimated timeline e.g. 2-3 years>",
      "steps": ["<step to take>"],
      "requiredSkills": ["<skill to develop>"],
      "potentialRoles": ["<job title they could progress to>"],
      "salaryGrowth": "<estimated salary growth %>"
    }
  ],
  "certifications": [{ "name": "<cert name>", "value": "<why it helps>" }],
  "generalAdvice": "<paragraph of career advice>"
}
Provide 3 distinct career paths.`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /career-paths, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockCareerPaths(resumeText, jobRole);
    }
    res.json(data);
  } catch (err) {
    console.error('Career paths error:', err);
    res.status(500).json({ error: err.message || 'Career path generation failed' });
  }
});

// AI Answer Grading
app.post('/api/grade-answer', aiLimiter, async (req, res) => {
  try {
    const { question, userAnswer, resumeText } = req.body;
    if (!question || !userAnswer) return res.status(400).json({ error: 'Question and answer are required' });

    const prompt = `Grade this interview answer. The candidate's resume context is provided.

QUESTION: "${question}"
CANDIDATE'S ANSWER: "${userAnswer}"
${resumeText ? `RESUME CONTEXT:\n"""${resumeText.substring(0, 2000)}"""` : ''}

Return ONLY valid JSON (no markdown code fences):
{
  "score": <number 1-10>,
  "grade": "<A+|A|B+|B|C+|C|D|F>",
  "strengths": ["<what was good about the answer>"],
  "improvements": ["<how to improve the answer>"],
  "revisedAnswer": "<a better version of the answer>",
  "tip": "<one key tip for this type of question>"
}`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /grade-answer, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockGradeAnswer(question, userAnswer);
    }
    res.json(data);
  } catch (err) {
    console.error('Answer grading error:', err);
    res.status(500).json({ error: err.message || 'Grading failed' });
  }
});

// Company-Specific Questions
app.post('/api/company-questions', aiLimiter, async (req, res) => {
  try {
    const { resumeText, companyName, jobRole } = req.body;
    if (!resumeText || !companyName) return res.status(400).json({ error: 'Resume and company name are required' });

    const prompt = `Generate interview questions specific to ${companyName} culture and interview style.
${jobRole ? `Role: "${jobRole}".` : ''}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences):
{
  "company": "${companyName}",
  "interviewStyle": "<brief description of company interview style>",
  "questions": [
    {
      "id": <number>,
      "type": "<Technical|Behavioral|Culture Fit|System Design|Case Study>",
      "question": "<the question>",
      "why": "<why this company asks this type of question>",
      "suggestedApproach": "<how to approach answering>",
      "sampleAnswer": "<sample strong answer>"
    }
  ],
  "tips": ["<company-specific interview tip>"]
}
Generate 8 questions. For companies like Google/Amazon/Meta, use their known question styles (STAR, LP, etc).`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /company-questions, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockCompanyQuestions(resumeText, companyName, jobRole);
    }
    res.json(data);
  } catch (err) {
    console.error('Company questions error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate questions' });
  }
});

// LinkedIn Profile Optimizer
app.post('/api/linkedin-optimize', aiLimiter, async (req, res) => {
  try {
    const { resumeText, jobRole } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

    const prompt = `Optimize a full LinkedIn profile based on this resume.
${jobRole ? `Target role: "${jobRole}".` : ''}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences):
{
  "headline": "<compelling LinkedIn headline, max 220 chars>",
  "about": "<3-4 paragraph LinkedIn About section>",
  "skills": ["<top skill to list>"],
  "featuredSection": ["<suggestion for Featured section content>"],
  "experienceTips": ["<tip for optimizing Experience section on LinkedIn>"],
  "keywords": ["<SEO keyword to include in profile>"],
  "connectivityTips": ["<networking tip>"]
}
Make the headline catchy and keyword-rich. The About section should tell a story.`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /linkedin-optimize, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockLinkedIn(resumeText, jobRole);
    }
    res.json(data);
  } catch (err) {
    console.error('LinkedIn optimize error:', err);
    res.status(500).json({ error: err.message || 'LinkedIn optimization failed' });
  }
});

// Email Template Generator
app.post('/api/email-template', aiLimiter, async (req, res) => {
  try {
    const { resumeText, emailType, recipientRole, companyName } = req.body;
    if (!resumeText || !emailType) return res.status(400).json({ error: 'Resume and email type are required' });

    const prompt = `Generate a professional ${emailType} email based on this resume.
${companyName ? `Company: "${companyName}".` : ''}
${recipientRole ? `Recipient: "${recipientRole}".` : ''}

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown code fences):
{
  "subject": "<email subject line>",
  "body": "<complete email body with \\n\\n for paragraph breaks>",
  "tips": ["<tip for this type of email>"],
  "alternatives": [{ "subject": "<alt subject>", "opening": "<alt opening line>" }]
}
Email type: ${emailType}. Write a professional, personalized email. Provide 2 alternatives.`;

    let data;
    try {
      const result = await callGeminiWithRetry(prompt);
      data = parseGeminiJSON(result.response.text());
    } catch (aiErr) {
      console.warn('⚠️ Gemini failed for /email-template, using mock AI:', aiErr.message?.substring(0, 200));
      data = mockAI.getMockEmail(resumeText, emailType, recipientRole, companyName);
    }
    res.json(data);
  } catch (err) {
    console.error('Email template error:', err);
    res.status(500).json({ error: err.message || 'Email generation failed' });
  }
});

// --------------- Error handler ---------------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Resume Analyzer API running on http://localhost:${PORT}`);
});
