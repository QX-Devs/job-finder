const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const fetch = require('node-fetch');
const { sequelize, testConnection } = require('../config/database');
const authRoutes = require('../routes/auth');
const meRoutes = require('../routes/me');
const jobRoutes = require('../routes/jobRoutes');
const scraperRoutes = require('../routes/scraperRoutes');
const candidateRoutes = require('../routes/candidateRoutes');
const courseRoutes = require('../routes/courseRoutes');
const graduationProjectRoutes = require('../routes/graduationProjectRoutes');
// Job fetching is now handled by separate scripts (fetchAndImportJobs.js, scrapeLinkedInJobs.js)
// const { startScheduler } = require('../services/scraperScheduler');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow localhost and LAN IPs
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// Add common LAN IP patterns if FRONTEND_URL is not set
if (!process.env.FRONTEND_URL) {
  // Allow requests from any origin in development (for LAN testing)
  // In production, set FRONTEND_URL environment variable
  allowedOrigins.push(/^http:\/\/192\.168\.\d+\.\d+:3000$/);
  allowedOrigins.push(/^http:\/\/10\.\d+\.\d+\.\d+:3000$/);
  allowedOrigins.push(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, allow all origins for LAN testing
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Test endpoint
app.post('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Serve generated files for download
app.use('/api/files', express.static(path.join(__dirname, '..', 'generated')));

// ✅ FIXED Hugging Face Route - Better model and response cleaning
app.post('/api/ai/career-objective', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid request format. Messages array is required.' 
      });
    }

    console.log('🤖 Processing AI request...');

    // Extract user prompt
    let userPrompt = '';
    for (const message of messages) {
      if (message.role === 'user') {
        userPrompt = message.content;
        break;
      }
    }

    // Enhanced prompt to prevent thinking
    const enhancedPrompt = `You are a professional resume writer. Write ONLY the professional summary, nothing else. No thinking, no explanation, no preamble.

${userPrompt}

Professional Summary:`;

    // Use Llama 3.2 which follows instructions better
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user", 
              content: enhancedPrompt
            }
          ],
          model: "meta-llama/Llama-3.2-3B-Instruct",
          max_tokens: 300,
          temperature: 0.7,
          stop: ["<think>", "</think>"]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API Error:', response.status, errorText);
      
      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a few moments.'
        });
      }
      
      return res.status(response.status).json({
        success: false,
        error: 'AI service temporarily unavailable.',
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      });
    }

    const data = await response.json();
    
    // Extract and clean the response
    let content = data.choices[0].message.content;
    
    // Remove <think> sections completely
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove common reasoning patterns
    content = content.replace(/^(Okay|Alright|Sure|Let me|First|Wait)[,\s].*?\n/gim, '');
    content = content.replace(/I (need to|should|will|must|have to).*?\./gi, '');
    
    // Extract just the professional summary if there's a clear break
    const summaryMatch = content.match(/Professional Summary:\s*([\s\S]+)/i);
    if (summaryMatch) {
      content = summaryMatch[1];
    }
    
    // Clean up whitespace
    content = content.trim();
    
    console.log('✅ AI Response received successfully');

    res.json({
      success: true,
      choices: [{ message: { content } }],
      usage: data.usage
    });

  } catch (error) {
    console.error('❌ Hugging Face Route Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'AI service is currently unavailable. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ AI Route for Project Description Improvement
app.post('/api/ai/improve-project-description', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Project description is required' 
      });
    }

    console.log('🤖 Processing AI project description improvement...');

    // Detect if text is Arabic (contains Arabic characters)
    const isArabic = /[\u0600-\u06FF]/.test(description);
    
    let enhancedPrompt;
    if (isArabic) {
      // Translate Arabic to English and improve
      enhancedPrompt = `You are a professional resume writer. Translate the following Arabic project description to English, fix grammar, improve clarity, and organize it professionally. Write ONLY the improved English description, nothing else. No thinking, no explanation, no preamble.

${description}

Improved English Description:`;
    } else {
      // Fix English grammar and improve
      enhancedPrompt = `You are a professional resume writer. Fix grammar, improve clarity, and organize the following project description professionally. Write ONLY the improved description, nothing else. No thinking, no explanation, no preamble.

${description}

Improved Description:`;
    }

    // Use Llama 3.2 which follows instructions better
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user", 
              content: enhancedPrompt
            }
          ],
          model: "meta-llama/Llama-3.2-3B-Instruct",
          max_tokens: 800, // More tokens for longer descriptions
          temperature: 0.5, // Lower temperature for more consistent grammar fixes
          stop: ["<think>", "</think>", "<think>", "</think>"]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API Error:', response.status, errorText);
      
      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a few moments.'
        });
      }
      
      return res.status(response.status).json({
        success: false,
        error: 'AI service temporarily unavailable.',
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      });
    }

    const data = await response.json();
    
    // Extract and clean the response
    let content = data.choices[0].message.content;
    
    // Remove <think> sections completely
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove common reasoning patterns
    content = content.replace(/^(Okay|Alright|Sure|Let me|First|Wait|Here|I'll)[,\s].*?\n/gim, '');
    content = content.replace(/I (need to|should|will|must|have to|can|will).*?\./gi, '');
    
    // Extract just the description if there's a clear break
    const descMatch = content.match(/(?:Improved (?:English )?Description:?\s*)([\s\S]+)/i);
    if (descMatch) {
      content = descMatch[1];
    }
    
    // Clean up whitespace but preserve paragraph structure
    content = content.trim();
    
    console.log('✅ AI Project Description improvement completed');

    res.json({
      success: true,
      data: {
        improvedDescription: content
      }
    });
  } catch (error) {
    console.error('❌ AI project description improvement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to improve project description'
    });
  }
});

// ✅ FIXED Resume-specific AI suggestions
app.post('/api/ai/resume-suggestions', async (req, res) => {
  try {
    const { section, content, context } = req.body;
    
    if (!section || !content) {
      return res.status(400).json({
        success: false,
        error: 'Section and content are required.'
      });
    }

    let prompt = '';
    
    switch (section) {
      case 'professional_summary':
        prompt = `Write ONLY a professional resume summary in 3-4 sentences.
Requirements:
- Direct, concise, no preface or headings
- Tailored to: ${context || 'Software engineering role'}
- Use strong action verbs and quantifiable impact where possible
- No markdown, no bullet points, no reasoning, no labels

User input (may be partial, at least 50 chars expected): ${content}`;
        break;
      case 'skills':
        prompt = `Suggest relevant technical and soft skills for someone with this background: ${content}. Context: ${context || 'Software engineering'}. Return a comma-separated list of 8-12 relevant skills. Focus on in-demand technologies and transferable skills.`;
        break;
      case 'experience':
        prompt = `Improve this work experience description for a resume: "${content}". Make it more impactful using action verbs and quantifiable achievements. Context: ${context || 'Professional experience'}.`;
        break;
      case 'career_objective':
        prompt = `Write a strong career objective for someone with this background: ${content}. Context: ${context || 'Seeking new opportunities'}. Make it targeted, professional, and 2-3 sentences long.`;
        break;
      default:
        prompt = `Improve this resume content: "${content}". Make it more professional and impactful. Context: ${context || 'General resume improvement'}.`;
    }

    // Enhanced prompt to prevent thinking
    const enhancedPrompt = `You are a professional resume writer. Provide ONLY the final answer, no thinking or explanation, no headings.

${prompt}

Answer:`;

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          messages: [{ 
            role: "user", 
            content: enhancedPrompt
          }],
          model: "meta-llama/Llama-3.2-3B-Instruct",
          max_tokens: 220,
          temperature: 0.5,
          stop: ["<think>", "</think>"]
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    let suggestion = data.choices[0].message.content;
    
    // Clean the response
    suggestion = suggestion.replace(/<think>[\s\S]*?<\/think>/gi, '');
    suggestion = suggestion.replace(/^(Okay|Alright|Sure|Let me|First|Wait)[,\s].*?\n/gim, '');
    suggestion = suggestion.trim();

    res.json({
      success: true,
      data: {
        suggestion: suggestion,
        section,
        original: content
      }
    });
  } catch (error) {
    console.error('❌ Resume Suggestions Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ FIXED Test Hugging Face Connection
app.get('/api/test-hf', async (req, res) => {
  try {
    console.log('🔑 Testing HF API Key...');
    
    if (!process.env.HF_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'HF_API_KEY not found in environment variables' 
      });
    }

    // Enhanced prompt for test
    const testPrompt = `Answer in one word only. What is the capital of France?

Answer:`;

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: testPrompt
            },
          ],
          model: "meta-llama/Llama-3.2-3B-Instruct",
          max_tokens: 10,
          stop: ["\n", ".", "<think>"]
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    let answer = data.choices[0].message.content;
    
    // Clean the response
    answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    console.log('✅ HF API Key valid - Response:', answer);
    
    res.json({ 
      success: true, 
      message: 'Hugging Face API key is working!',
      test_response: answer,
      model: 'Llama-3.2-3B-Instruct'
    });
    
  } catch (error) {
    console.error('❌ HF Test Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect to Hugging Face',
      details: error.message 
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api', scraperRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/graduation-project', graduationProjectRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GradJob API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Database status route
app.get('/api/database-status', async (req, res) => {
  try {
    await testConnection();
    res.json({
      success: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    name: 'GradJob API',
    version: '1.0.0',
    description: 'Career platform for graduates and job seekers',
    endpoints: {
      auth: '/api/auth',
      user: '/api/me',
      resumes: '/api/me/resumes',
      ai: '/api/ai',
      health: '/api/health',
      test_hf: '/api/test-hf'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ 
      success: false,
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    await testConnection();
    
    console.log('🔄 Synchronizing database models...');
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false
    });
    console.log('✅ Database synchronized');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🤖 AI Test: http://localhost:${PORT}/api/test-hf`);
      console.log(`📊 Database status: http://localhost:${PORT}/api/database-status`);
      console.log(`✅ Hugging Face AI: ENABLED with Llama-3.2-3B-Instruct`);
    });

    // Job fetching is now handled by separate scripts
    // Uncomment the line below if you want automatic job fetching on server start
    // startScheduler();
    console.log('ℹ️  Job fetching disabled. Run "npm run fetch-jobs" or "npm run scrape-linkedin" separately to fetch jobs.');

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📦 Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log('✅ HTTP server closed.');
        sequelize.close()
          .then(() => {
            console.log('✅ Database connection closed.');
            process.exit(0);
          })
          .catch(err => {
            console.error('❌ Error closing database connection:', err);
            process.exit(1);
          });
      });
      setTimeout(() => {
        console.log('⚠️ Forcing shutdown after timeout...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}



module.exports = app;