const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, ExternalHyperlink, convertInchesToTwip, TabStopType, HeadingLevel, ShadingType } = require('docx');
const { Resume } = require('../models');
const { sanitizeResumeData, cleanTextSpaces, containsRTL, splitMixedLanguage, estimateContentLength, insertSoftBreaks } = require('../utils/textSanitizer');

const GENERATED_DIR = path.join(__dirname, '..', 'generated');
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}
const UPLOADS_DIR = path.join(GENERATED_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function formatTimestamp() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

// ========== ENHANCED TEXT SANITIZATION ==========

/**
 * Enhanced sanitization: strips HTML, emojis, and unwanted special characters
 * Keeps only: . , - + ( ) / %
 * Collapses excessive spaces
 */
function sanitizeTextEnhanced(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Strip HTML entities
    .replace(/&[#\w]+;/g, ' ')
    // Strip emojis and special Unicode symbols
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emoticons
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    // Remove special characters except allowed ones: . , - + ( ) / %
    .replace(/[^\w\s.,\-+()/%]/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize capitalization for technology names
 * Examples: NODEJS -> Node.js, REACT -> React, JAVASCRIPT -> JavaScript
 */
function normalizeCapitalization(text) {
  if (!text || typeof text !== 'string') return '';
  
  const techMap = {
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'react': 'React',
    'vue': 'Vue',
    'angular': 'Angular',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'c++': 'C++',
    'c#': 'C#',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'nosql': 'NoSQL',
    'mongodb': 'MongoDB',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'redis': 'Redis',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'aws': 'AWS',
    'azure': 'Azure',
    'gcp': 'GCP',
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'jenkins': 'Jenkins',
    'ci/cd': 'CI/CD',
    'rest': 'REST',
    'graphql': 'GraphQL',
    'api': 'API',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'linux': 'Linux',
    'unix': 'Unix',
    'windows': 'Windows',
    'macos': 'macOS',
    'ios': 'iOS',
    'android': 'Android',
  };
  
  const lower = text.toLowerCase().trim();
  if (techMap[lower]) {
    return techMap[lower];
  }
  
  // If not in map, apply title case for multi-word
  if (text.includes(' ') || text.includes('-') || text.includes('_')) {
    return text.split(/[\s\-_]+/).map(word => {
      const wordLower = word.toLowerCase();
      return techMap[wordLower] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }
  
  // Single word: capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ========== SKILLS CATEGORIZATION ==========

/**
 * Categorize skills into predefined categories based on keyword matching
 */
function categorizeSkills(skillsArray) {
  if (!Array.isArray(skillsArray) || skillsArray.length === 0) return {};
  
  const categories = {
    'Programming Languages': [],
    'Frameworks': [],
    'Databases': [],
    'Cloud & DevOps': [],
    'Architecture & System Design': [],
    'Other Technologies': []
  };
  
  // Define keyword patterns for each category
  const patterns = {
    'Programming Languages': [
      /^(javascript|typescript|python|java|c\+\+|c#|ruby|php|go|rust|swift|kotlin|scala|r|matlab|perl|bash|shell|powershell)$/i,
      /^(html|css|sass|less|scss)$/i
    ],
    'Frameworks': [
      /^(react|vue|angular|svelte|ember|backbone|next\.js|nuxt|gatsby|remix)$/i,
      /^(express|koa|fastify|nest|django|flask|fastapi|rails|spring|laravel|symfony|asp\.net)$/i,
      /^(react native|flutter|xamarin|ionic|cordova)$/i
    ],
    'Databases': [
      /^(mysql|postgresql|mongodb|redis|cassandra|elasticsearch|dynamodb|oracle|sqlite|mariadb|neo4j|influxdb|couchdb|firebase|firestore)$/i,
      /^(sql|nosql|graphql)$/i
    ],
    'Cloud & DevOps': [
      /^(aws|azure|gcp|google cloud|docker|kubernetes|jenkins|gitlab ci|github actions|terraform|ansible|chef|puppet|vagrant)$/i,
      /^(ec2|s3|lambda|ecs|eks|rds|cloudformation|cloudwatch|azure devops|azure functions)$/i,
      /^(ci\/cd|devops|cicd|continuous integration|continuous deployment)$/i
    ],
    'Architecture & System Design': [
      /^(microservices|rest|soap|graphql|grpc|message queue|rabbitmq|kafka|event driven|domain driven design|ddd)$/i,
      /^(system design|distributed systems|load balancing|scalability|performance optimization)$/i,
      /^(design patterns|solid principles|clean architecture|hexagonal architecture)$/i
    ]
  };
  
  skillsArray.forEach(skill => {
    const skillStr = typeof skill === 'string' ? skill : (skill.skillName || String(skill));
    const normalized = normalizeCapitalization(sanitizeTextEnhanced(skillStr));
    
    if (!normalized) return;
    
    let categorized = false;
    
    // Check each category
    for (const [category, categoryPatterns] of Object.entries(patterns)) {
      for (const pattern of categoryPatterns) {
        if (pattern.test(skillStr)) {
          categories[category].push(normalized);
          categorized = true;
          break;
        }
      }
      if (categorized) break;
    }
    
    // If not categorized, add to Other Technologies
    if (!categorized) {
      categories['Other Technologies'].push(normalized);
    }
  });
  
  // Deduplicate and remove empty categories
  Object.keys(categories).forEach(key => {
    // Remove duplicates
    categories[key] = Array.from(new Set(categories[key]));
    // Remove empty categories
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });
  return categories;
}

/**
 * Format skills into balanced lines for a category
 */
function formatSkillsIntoBlocks(skillsArray, maxLineLength = 70) {
  if (!Array.isArray(skillsArray) || skillsArray.length === 0) return [];
  
  const totalChars = skillsArray.join(', ').length;
  const targetLines = Math.min(Math.max(2, Math.ceil(skillsArray.length / 6)), 4);
  const targetCharsPerLine = Math.ceil(totalChars / targetLines);
  const optimalLineLength = Math.max(50, Math.min(80, targetCharsPerLine + 10));
  
  const lines = [];
  let currentLine = '';
  let currentLength = 0;
  
  skillsArray.forEach((skill, index) => {
    const skillWithComma = index < skillsArray.length - 1 ? skill + ', ' : skill;
    const skillLength = skillWithComma.length;
    
    if (currentLength + skillLength > optimalLineLength && currentLine.length > 0 && lines.length < targetLines) {
      lines.push(currentLine.trim());
      currentLine = skillWithComma;
      currentLength = skillLength;
    } else {
      currentLine = currentLine ? currentLine + skillWithComma : skillWithComma;
      currentLength += skillLength;
    }
  });
  
  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }
  
  return lines.length > 0 ? lines : [skillsArray.join(', ')];
}

// ========== EXPERIENCE BULLET NORMALIZATION ==========

/**
 * Normalize bullet points with action verbs and measurable impact
 */
function normalizeBullet(bulletText, allExperience = []) {
  if (!bulletText || typeof bulletText !== 'string') return bulletText;
  
  let normalized = sanitizeTextEnhanced(bulletText).trim();
  if (!normalized) return bulletText;
  
  // Action verb replacements (pattern -> replacement)
  const verbReplacements = [
    { pattern: /^worked on/i, replacement: 'Implemented' },
    { pattern: /^helped with/i, replacement: 'Supported' },
    { pattern: /^responsible for/i, replacement: 'Led' },
    { pattern: /^developed/i, replacement: 'Built' },
    { pattern: /^participated in/i, replacement: 'Contributed to' },
    { pattern: /^assisted with/i, replacement: 'Supported' },
    { pattern: /^involved in/i, replacement: 'Contributed to' },
    { pattern: /^helped/i, replacement: 'Supported' },
    { pattern: /^did/i, replacement: 'Executed' },
    { pattern: /^made/i, replacement: 'Created' },
    { pattern: /^used/i, replacement: 'Utilized' },
    { pattern: /^did work on/i, replacement: 'Implemented' },
    { pattern: /^was responsible/i, replacement: 'Led' },
    { pattern: /^was involved/i, replacement: 'Contributed to' }
  ];
  
  // Apply verb replacements
  for (const { pattern, replacement } of verbReplacements) {
    if (pattern.test(normalized)) {
      normalized = normalized.replace(pattern, replacement);
      break;
    }
  }
  
  // Capitalize first letter if needed
  if (normalized.length > 0) {
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  
  // Check if bullet has measurable impact (numbers, percentages, etc.)
  const hasMeasurableImpact = /(\d+%|\d+\s*(users|clients|customers|requests|queries|transactions|revenue|cost|time|seconds|minutes|hours|days|months|years|times|x\s*\d+))/i.test(normalized);
  
  // If no measurable impact, try to infer from context
  if (!hasMeasurableImpact) {
    // Look for optimization keywords
    if (/optimized|improved|enhanced|increased|reduced|decreased|accelerated|streamlined/i.test(normalized)) {
      // Try to add generic improvement context if not present
      if (!/(by|to|from|from\s+\d+|to\s+\d+)/i.test(normalized)) {
        // Don't add fake metrics, but ensure the bullet is well-formed
        normalized = normalized.replace(/\s*\.\s*$/, '') + '.';
      }
    }
  }
  
  // Ensure proper punctuation
  if (!normalized.match(/[.!?]$/)) {
    normalized += '.';
  }
  
  return normalized;
}

// ========== EXPERIENCE DURATION CALCULATION ==========

/**
 * Calculate total years of experience from earliest startDate to current date
 */
function computeTotalExperience(experienceArray) {
  if (!Array.isArray(experienceArray) || experienceArray.length === 0) return 0;
  
  const dates = [];
  experienceArray.forEach(exp => {
    if (exp.startDate) {
      const [year, month] = exp.startDate.split('-').map(Number);
      if (year) {
        dates.push(new Date(year, (month || 1) - 1, 1));
      }
    }
  });
  
  if (dates.length === 0) return 0;
  
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const currentDate = new Date();
  
  const years = currentDate.getFullYear() - earliestDate.getFullYear();
  const months = currentDate.getMonth() - earliestDate.getMonth();
  
  const totalMonths = years * 12 + months;
  const totalYears = Math.floor(totalMonths / 12);
  
  return totalYears;
}

// ========== LANGUAGES TABLE FORMATTING ==========

/**
 * Format languages as two-column table data
 * Returns array of {language, proficiency} objects
 */
function formatLanguagesTable(languagesArray) {
  if (!Array.isArray(languagesArray) || languagesArray.length === 0) return [];
  
  return languagesArray.map(lang => {
    if (typeof lang === 'string') {
      return {
        language: sanitizeTextEnhanced(normalizeCapitalization(lang)),
        proficiency: ''
      };
    }
    
    const languageName = lang.language || '';
    const proficiency = lang.proficiency || '';
    
    return {
      language: sanitizeTextEnhanced(normalizeCapitalization(languageName)),
      proficiency: sanitizeTextEnhanced(proficiency)
    };
  }).filter(lang => lang.language && lang.language.trim().length > 0);
}

function buildDocxFromResume(data, userProfile) {
  // Enhanced safe function with full sanitization and normalization
  const safe = (v, d = '') => {
    const value = (v === undefined || v === null || v === '' ? d : String(v));
    const sanitized = sanitizeTextEnhanced(value);
    const normalized = normalizeCapitalization(sanitized);
    return cleanTextSpaces(normalized);
  };
  
  const name = safe(userProfile?.fullName, '');
  const email = safe(userProfile?.email, '');
  const phone = safe(userProfile?.phone, '');
  
  // Handle GitHub and LinkedIn URLs - extract display text BEFORE normalization
  // URLs should not be normalized/capitalized, only sanitized
  const githubUrlRaw = data.github || '';
  const githubUrl = githubUrlRaw ? sanitizeTextEnhanced(githubUrlRaw).trim() : '';
  // Extract display text from original URL before normalization
  const githubDisplay = githubUrlRaw ? (() => {
    const url = githubUrlRaw.toLowerCase();
    if (url.includes('github.com/')) {
      const username = githubUrlRaw.split(/github\.com\//i)[1]?.replace(/\/$/, '') || '';
      return username ? cleanTextSpaces(username) : '';
    }
    return '';
  })() : '';
  
  const linkedinUrlRaw = data.linkedin || '';
  const linkedinUrl = linkedinUrlRaw ? sanitizeTextEnhanced(linkedinUrlRaw).trim() : '';
  // Extract display text from original URL before normalization
  const linkedinDisplay = linkedinUrlRaw ? (() => {
    const url = linkedinUrlRaw.toLowerCase();
    if (url.includes('linkedin.com/in/')) {
      const username = linkedinUrlRaw.split(/linkedin\.com\/in\//i)[1]?.replace(/\/$/, '') || '';
      return username ? cleanTextSpaces(username) : '';
    }
    return '';
  })() : '';

  const skills = Array.isArray(data.skills) ? data.skills : [];
  const languages = Array.isArray(data.languages) ? data.languages : [];
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const courses = Array.isArray(data.courses) ? data.courses : [];
  const graduationProject = data.graduationProject || null;
  const projectSkills = Array.isArray(data.projectSkills) ? data.projectSkills : [];
  const isGraduate = userProfile?.isGraduate === true;
  
  // Calculate total experience years
  const totalExperienceYears = computeTotalExperience(experience);
  
  // Count work experiences - used to determine spacing mode
  const experienceCount = experience.length;
  // Use compact mode when fewer than 3 experiences (keep everything on one page)
  const useCompactLayout = experienceCount < 3;

  // ========== SPACING OPTIMIZATION HELPERS ==========
  
  // Estimate content length for line-height adjustment
  const contentLength = estimateContentLength(data);
  // Rough estimate: ~2000 chars per page, adjust line spacing if likely > 2 pages
  const estimatedPages = Math.ceil(contentLength / 2000);
  const lineHeightReduction = estimatedPages > 2 ? Math.min((estimatedPages - 2) * 0.05, 0.25) : 0; // Max 25% reduction
  const baseLineHeight = 240; // Base line height in twips
  const adjustedLineHeight = Math.round(baseLineHeight * (1 - lineHeightReduction));

  // Calculate micro-kerning for header name (longer names need tighter spacing)
  const nameLength = name.length;
  const nameCharacterSpacing = nameLength > 20 ? -20 : (nameLength > 15 ? -10 : 0); // Negative = tighter spacing

  // Helper to get optimized spacing for sections (dynamic vertical padding)
  const getSectionSpacing = (baseBefore = 100, baseAfter = 100) => {
    // Use compact spacing when fewer than 3 experiences to fit on one page
    if (useCompactLayout) {
      return {
        before: Math.round(baseBefore * 0.6), // 40% reduction for compact layout
        after: Math.round(baseAfter * 0.6)
      };
    }
    // Adjust spacing based on estimated pages
    const spacingMultiplier = estimatedPages > 2 ? 0.9 : 1.0; // Reduce spacing if content is long
    return {
      before: Math.round(baseBefore * spacingMultiplier),
      after: Math.round(baseAfter * spacingMultiplier)
    };
  };

  // Format date from YYYY-MM to readable format
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    if (!year) return dateStr;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return month ? `${monthNames[parseInt(month) - 1]} ${year}` : year;
  };

  // ========== PREDICTIVE PAGE DISTRIBUTION HELPERS ==========
  
  // Estimate height of EDUCATION block in twips
  // Returns estimated height needed for entire EDUCATION section
  const estimateEducationBlockHeight = (educationArray) => {
    if (!Array.isArray(educationArray) || educationArray.length === 0) return 0;
    
    // Section header: ~100 twips (spacing before) + ~240 twips (line height) + ~60 twips (spacing after) + border
    const headerHeight = 100 + adjustedLineHeight + 60 + 20; // ~420 twips
    
    // Per education entry: degree line + institution/date line + spacing
    // Degree: ~6 twips spacing after + ~240 twips line height = ~246 twips
    // Institution/Date: ~50 twips spacing after + ~240 twips line height = ~290 twips
    // Total per entry: ~536 twips
    const perEntryHeight = 6 + adjustedLineHeight + 50 + adjustedLineHeight; // ~536 twips per entry
    
    // Total height = header + (entries * perEntryHeight) + divider spacing
    const dividerSpacing = 80; // Divider before EDUCATION
    const totalHeight = dividerSpacing + headerHeight + (educationArray.length * perEntryHeight);
    
    return totalHeight;
  };
  
  // Estimate height of EXPERIENCE section in twips
  const estimateExperienceSectionHeight = (experienceArray) => {
    if (!Array.isArray(experienceArray) || experienceArray.length === 0) return 0;
    
    // Section header: ~100 twips (spacing before) + ~240 twips (line height) + ~60 twips (spacing after)
    const headerHeight = 100 + adjustedLineHeight + 60 + 20; // ~420 twips
    
    let totalHeight = headerHeight;
    
    experienceArray.forEach(job => {
      // Job title: ~40 twips spacing after + ~240 twips line height = ~280 twips
      totalHeight += 40 + adjustedLineHeight;
      
      // Company/Date: ~50 twips spacing after + ~240 twips line height = ~290 twips
      totalHeight += 50 + adjustedLineHeight;
      
      // Bullets: estimate based on responsibilities
      const responsibilities = Array.isArray(job.description) 
        ? job.description 
        : (job.description ? [job.description] : []);
      
      const bulletCount = responsibilities.length;
      const useCompactMode = bulletCount > 12;
      const bulletLineHeight = useCompactMode ? Math.round(adjustedLineHeight * 0.85) : adjustedLineHeight;
      const bulletSpacing = useCompactMode ? 30 : 40;
      
      // Each bullet: spacing + line height
      responsibilities.forEach((resp, idx) => {
        const isLastBullet = idx === bulletCount - 1;
        const spacing = isLastBullet ? 80 : bulletSpacing;
        // Estimate 1-2 lines per bullet (average 1.5 lines)
        const estimatedLines = Math.max(1, Math.ceil((resp?.length || 0) / 70));
        totalHeight += spacing + (bulletLineHeight * estimatedLines);
      });
    });
    
    return totalHeight;
  };
  
  // Estimate available space remaining on page 1 after EXPERIENCE
  // Page height: 11 inches = 15840 twips
  // Margins: top 500 + bottom 500 = 1000 twips
  // Usable height: 15840 - 1000 = 14840 twips
  // Header section (name, title, contact, summary): estimate ~3000 twips
  const estimateRemainingPageSpace = (experienceArray) => {
    const pageHeight = 15840; // 11 inches in twips
    const margins = 1000; // top + bottom margins
    const headerSectionHeight = 3000; // Name, title, contact, summary estimate
    const usableHeight = pageHeight - margins;
    
    const experienceHeight = estimateExperienceSectionHeight(experienceArray);
    const dividerHeight = 80; // Divider before EDUCATION
    
    const remainingSpace = usableHeight - headerSectionHeight - experienceHeight - dividerHeight;
    
    return Math.max(0, remainingSpace);
  };
  
  // Decide if EDUCATION section should force page break
  // Returns true if EDUCATION block should start on new page
  // ONLY considers page breaks when there are 3+ work experiences
  const shouldForceEducationPageBreak = (educationArray, experienceArray) => {
    if (!Array.isArray(educationArray) || educationArray.length === 0) return false;
    
    // NEVER force page break if fewer than 3 experiences - keep everything on one page
    if (useCompactLayout) return false;
    
    const educationHeight = estimateEducationBlockHeight(educationArray);
    const remainingSpace = estimateRemainingPageSpace(experienceArray);
    
    // Only force page break if education section truly won't fit in remaining space
    // Allow Word to handle natural page breaks - don't be aggressive
    // Only break if remaining space is less than the minimum header height (420 twips)
    const minimumHeaderSpace = 420; // Just enough for section header
    
    // Force page break ONLY if:
    // 1. Education block won't fit AND remaining space is very small (orphaned header risk)
    if (educationHeight > remainingSpace && remainingSpace < minimumHeaderSpace) {
      return true;
    }
    
    return false;
  };

  // Format skills with balanced multi-line wrapping (target 3-4 lines)
  // Distributes skills evenly across lines for visual balance
  const formatSkillsWithWrapping = (skillsArray) => {
    if (!Array.isArray(skillsArray) || skillsArray.length === 0) return [];
    
    const skillStrings = skillsArray.map(skill => typeof skill === 'string' ? skill : (skill.skillName || '')).filter(Boolean);
    if (skillStrings.length === 0) return [];
    
    // Calculate total character count
    const totalChars = skillStrings.join(', ').length;
    
    // Target 3-4 lines for visual balance
    const targetLines = Math.min(Math.max(3, Math.ceil(skillStrings.length / 8)), 4);
    const targetCharsPerLine = Math.ceil(totalChars / targetLines);
    const maxLineLength = Math.max(60, Math.min(80, targetCharsPerLine + 10)); // Allow some flexibility
    
    const lines = [];
    let currentLine = '';
    let currentLineLength = 0;
    
    skillStrings.forEach((skill, index) => {
      const skillWithComma = index < skillStrings.length - 1 ? skill + ', ' : skill;
      const skillLength = skillWithComma.length;
      
      // If adding this skill would exceed target length and we have content, start new line
      // But ensure we don't create too many lines (max 5)
      if (currentLineLength + skillLength > maxLineLength && currentLine.length > 0 && lines.length < targetLines) {
        lines.push(currentLine.trim());
        currentLine = skillWithComma;
        currentLineLength = skillLength;
      } else {
        currentLine = currentLine ? currentLine + skillWithComma : skillWithComma;
        currentLineLength += skillLength;
      }
    });
    
    // Add the last line if it has content
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }
    
    // If we ended up with too many lines, try to redistribute
    if (lines.length > targetLines + 1) {
      // Rejoin and redistribute more evenly
      const allText = skillStrings.join(', ');
      const avgCharsPerLine = Math.ceil(allText.length / targetLines);
      const redistributed = [];
      let start = 0;
      
      for (let i = 0; i < targetLines; i++) {
        const end = i === targetLines - 1 ? allText.length : Math.min(start + avgCharsPerLine, allText.length);
        // Find last comma before end to avoid splitting skills
        let actualEnd = end;
        if (i < targetLines - 1 && end < allText.length) {
          const lastComma = allText.lastIndexOf(', ', end);
          if (lastComma > start) actualEnd = lastComma + 1;
        }
        redistributed.push(allText.substring(start, actualEnd).trim());
        start = actualEnd;
      }
      return redistributed.filter(l => l.length > 0);
    }
    
    return lines.length > 0 ? lines : [skillStrings.join(', ')];
  };

  // Format experience period
  const formatPeriod = (startDate, endDate, current) => {
    const start = formatDate(startDate);
    if (current) return start ? `${start} - Present` : 'Present';
    const end = formatDate(endDate);
    return start && end ? `${start} - ${end}` : (start || end || '');
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22, // 11pt body text
          },
          paragraph: {
            spacing: { 
              after: 60, // Reduced from 90
              line: 240, // Reduced from 270 (1.2x instead of 1.35x)
              lineRule: 'auto' 
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Arial',
            size: 22, // 11pt body text
          },
          paragraph: {
            spacing: { after: 60, line: 240, lineRule: 'auto' }, // Reduced spacing
          },
        },
        {
          id: 'SectionHeading',
          name: 'SectionHeading',
          run: {
            font: 'Arial',
            size: 32, // 16pt for section headings
            bold: true,
          },
          paragraph: {
            spacing: { 
              after: 60, // Reduced from 90
              before: 100 // Reduced from 160
            },
            keepNext: true,
            keepLines: true,
          },
        },
        {
          id: 'SubHeading',
          name: 'SubHeading',
          run: {
            font: 'Arial',
            size: 22,
            bold: true,
          },
          paragraph: {
            spacing: { 
              after: 40, // Reduced from 50
              before: 60 // Reduced from 90
            },
            keepNext: true,
            keepLines: true,
          },
        },
        {
          id: 'JobTitle',
          name: 'JobTitle',
          run: {
            font: 'Arial',
            size: 22,
            bold: true,
          },
          paragraph: {
            spacing: { after: 40 }, // Reduced from 60
            keepNext: true,
          },
        },
        {
          id: 'RightAlignedDate',
          name: 'RightAlignedDate',
          run: {
            font: 'Arial',
            size: 22,
            bold: true,
          },
          paragraph: {
            spacing: { after: 50 }, // Reduced from 80
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: convertInchesToTwip(7.0),
              },
            ],
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullet',
          levels: [
            {
              level: 0,
              format: 'bullet',
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 260 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: convertInchesToTwip(8.5),
            height: convertInchesToTwip(11),
          },
          margin: {
            top: 500, // Reduced from 650 (0.5" -> 0.42")
            right: 600, // Reduced from 720 (0.6" -> 0.5")
            bottom: 500, // Reduced from 650
            left: 600, // Reduced from 720
          },
        },
      },
      children: [
        // Name - Large left-aligned text with micro-kerning for long names
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: name.toUpperCase(),
              bold: true,
              size: 72, // 36pt name heading
              font: 'Arial',
              characterSpacing: nameCharacterSpacing, // Micro-kerning: tighter spacing for long names
            }),
          ],
          spacing: { after: 50, line: adjustedLineHeight }, // Dynamic line height based on content length
        }),

        // Professional Title - left-aligned
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: safe(data.title),
              bold: true,
              size: 32, // 16pt professional title
              font: 'Arial',
            }),
          ],
          spacing: { after: Math.round(100 * (estimatedPages > 2 ? 0.9 : 1.0)) }, // Dynamic spacing
        }),

        // CONTACT INFORMATION
        new Paragraph({
          style: 'SectionHeading',
          children: [
            new TextRun({
              text: 'CONTACT INFORMATION',
            }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
          keepWithNext: true, // Keep header with content (minimum 3 lines rule)
          keepLines: true, // Prevent splitting section header
          widowControl: true,
          orphanControl: true,
        }),

        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          columnWidths: [5000, 5000],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: (phone && phone.trim()) ? [
                        new TextRun({ text: '• ', size: 22 }),
                        new TextRun({ text: 'Mobile', bold: true, size: 22 }),
                        new TextRun({ text: ': ' + phone, size: 22 }),
                      ] : [],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: githubUrl ? [
                        new TextRun({ text: '• ', size: 22 }),
                        new TextRun({ text: 'GitHub', bold: true, size: 22 }),
                        new TextRun({ text: ': ', size: 22 }),
                        new ExternalHyperlink({
                          children: [
                            new TextRun({
                              text: githubDisplay || 'GitHub Profile',
                              style: 'Hyperlink',
                              size: 22,
                            }),
                          ],
                          link: githubUrl,
                        }),
                      ] : [],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                        children: (email && email.trim()) ? [
                          new TextRun({ text: '• ', size: 22 }),
                          new TextRun({ text: 'Email', bold: true, size: 22 }),
                          new TextRun({ text: ': ' + email, size: 22 }),
                        ] : [],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: linkedinUrl ? [
                        new TextRun({ text: '• ', size: 22 }),
                        new TextRun({ text: 'LinkedIn', bold: true, size: 22 }),
                        new TextRun({ text: ': ', size: 22 }),
                        new ExternalHyperlink({
                          children: [
                            new TextRun({
                              text: linkedinDisplay || 'LinkedIn Profile',
                              style: 'Hyperlink',
                              size: 22,
                            }),
                          ],
                          link: linkedinUrl,
                        }),
                      ] : [],
                      spacing: { line: 240, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                }),
              ],
            }),
          ],
        }),

        // PROFESSIONAL SUMMARY
        new Paragraph({
          style: 'SectionHeading',
          children: [
            new TextRun({
              text: 'PROFESSIONAL SUMMARY',
            }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
          spacing: getSectionSpacing(0, 0), // Dynamic spacing
          pageBreakBefore: false,
          keepWithNext: true, // Keep header with content (minimum 3 lines rule)
          keepLines: true, // Prevent splitting section header
          widowControl: true,
          orphanControl: true,
        }),

        // Summary content with soft breaks and bilingual support
        ...(() => {
          const summaryText = cleanTextSpaces(safe(data.summary));
          if (!summaryText) return [];
          
          // Insert soft breaks if paragraph > 380 characters (prevent walls of text)
          const processedText = insertSoftBreaks(summaryText, 380);
          const hasSoftBreaks = processedText.includes('\n');
          const isBilingual = containsRTL(summaryText) && /[a-zA-Z]/.test(summaryText);
          
          // Split into lines if soft breaks exist
          const lines = hasSoftBreaks ? processedText.split('\n').filter(l => l.trim()) : [processedText];
          
          return lines.map((line, idx) => {
            const isLastLine = idx === lines.length - 1;
            const lineIsBilingual = isBilingual && containsRTL(line) && /[a-zA-Z]/.test(line);
            
            if (lineIsBilingual) {
              // Bilingual mode: format per phrase with separate TextRuns
              const phrases = splitMixedLanguage(line);
              return new Paragraph({
                children: phrases.map(phrase => 
                  new TextRun({
                    text: phrase.text,
                    size: 22,
                    font: 'Arial',
                    rightToLeft: phrase.isRTL,
                  })
                ),
                alignment: containsRTL(line) ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                spacing: { 
                  after: isLastLine ? 150 : 40, 
                  line: adjustedLineHeight, 
                  lineRule: 'auto' 
                },
                keepWithNext: !isLastLine,
                pageBreakBefore: false,
                widowControl: true,
                orphanControl: true,
              });
            } else {
              // Regular paragraph
              return new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 22,
                    font: 'Arial',
                  }),
                ],
                alignment: containsRTL(line) ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                spacing: { 
                  after: isLastLine ? 150 : 40, 
                  line: adjustedLineHeight, 
                  lineRule: 'auto' 
                },
                keepWithNext: !isLastLine,
                pageBreakBefore: false,
                widowControl: true,
                orphanControl: true,
                contextualSpacing: isLastLine,
              });
            }
          });
        })(),

        // Experience Duration Line (below summary)
        ...(totalExperienceYears > 0 ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Experience: ${totalExperienceYears}+ years in professional software engineering roles`,
                size: 22,
                font: 'Arial',
                italics: true,
              }),
            ],
            spacing: { 
              after: Math.round(100 * (estimatedPages > 2 ? 0.9 : 1.0)), 
              before: 0 
            },
          }),
        ] : []),

        // Subtle divider line between sections
        new Paragraph({
          children: [
            new TextRun({
              text: '',
            }),
          ],
          spacing: { 
            after: Math.round(80 * (estimatedPages > 2 ? 0.9 : 1.0)), // Dynamic spacing for dividers
            before: 0, 
            line: adjustedLineHeight 
          },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, space: 1, color: 'E5E7EB' } },
          pageBreakBefore: false,
        }),

        // WORK EXPERIENCE
        ...(experience.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'WORK EXPERIENCE',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
            spacing: getSectionSpacing(120, 0), // Increased spacing between major sections
            pageBreakBefore: false,
            keepWithNext: true, // Keep header with first experience item (minimum 3 lines rule)
            keepLines: true, // Prevent splitting section header
            widowControl: true,
            orphanControl: true,
          }),
        ] : []),
        ...experience.flatMap((job, jobIndex) => {
          const position = safe(job.position || job.title);
          const company = safe(job.company);
          const period = formatPeriod(job.startDate, job.endDate, job.current);
          const responsibilities = Array.isArray(job.description) 
            ? job.description.map(r => cleanTextSpaces(r))
            : (job.description ? cleanTextSpaces(job.description).split('\n').filter(Boolean) : []);

          const isLastJob = jobIndex === experience.length - 1;
          const hasResponsibilities = responsibilities.length > 0;

          return [
            // Position + Date: Same line, position left, date right-aligned via tab stop
            new Paragraph({
              children: [
                new TextRun({
                  text: position,
                  bold: true,
                  size: 22,
                  font: 'Arial',
                }),
                  new TextRun({
                    text: '\t',
                    size: 22,
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: period,
                    size: 22,
                    font: 'Arial',
                    bold: true,
                  }),
              ],
              tabStops: [
                {
                  type: TabStopType.RIGHT,
                  position: convertInchesToTwip(7.0), // Right-aligned tab stop at 7 inches
                },
              ],
              spacing: { after: 6 }, // Small spacing after position/date line
              keepWithNext: true, // Keep position/date with company
              pageBreakBefore: false,
              widowControl: true,
              orphanControl: true,
              keepLines: true, // Prevent line breaks inside this paragraph
              alignment: AlignmentType.LEFT,
            }),
            // Company: Normal weight, appears below position
            new Paragraph({
              children: [
                new TextRun({
                  text: company,
                  size: 22,
                  font: 'Arial',
                  bold: false, // Company name not bold
                }),
              ],
              spacing: { 
                after: hasResponsibilities ? 0 : (isLastJob ? 100 : 60), // Spacing before bullets or next job
                line: adjustedLineHeight,
                lineRule: 'auto'
              },
              keepWithNext: hasResponsibilities, // Keep company with responsibilities if they exist
              pageBreakBefore: false,
              widowControl: true,
              orphanControl: true,
              alignment: AlignmentType.LEFT,
            }),
            // Description bullets: Chain all together as indivisible block per job (BULLET GROUP LOCKING)
            // Apply compression if > 12 bullets (controlled maximum bullet count)
            ...(hasResponsibilities ? (() => {
              const bulletCount = responsibilities.length;
              const useCompactMode = bulletCount > 12;
              const bulletLineHeight = useCompactMode ? Math.round(adjustedLineHeight * 0.85) : adjustedLineHeight; // 15% reduction in compact mode
              const bulletSpacing = useCompactMode ? 30 : 40; // Reduced spacing in compact mode
              
              return [
                // First bullet: Start of locked group
                new Paragraph({
                  children: (() => {
                    // Normalize bullet with action verbs and measurable impact
                    const normalizedBullet = normalizeBullet(responsibilities[0], experience);
                    const respText = cleanTextSpaces(normalizedBullet);
                    // Insert soft breaks if > 380 chars (prevent walls of text)
                    const processedText = insertSoftBreaks(respText, 380);
                    const isBilingual = containsRTL(respText) && /[a-zA-Z]/.test(respText);
                    
                    if (isBilingual) {
                      // Bilingual mode: format per phrase
                      const phrases = splitMixedLanguage(processedText);
                      return phrases.map(phrase => 
                        new TextRun({
                          text: phrase.text,
                          size: 22,
                          font: 'Arial',
                          rightToLeft: phrase.isRTL,
                        })
                      );
                    } else {
                      return [
                        new TextRun({
                          text: processedText,
                          size: 22,
                          font: 'Arial',
                        })
                      ];
                    }
                  })(),
                  numbering: { level: 0, reference: 'bullet' },
                  spacing: { 
                    after: bulletCount === 1 ? (isLastJob ? 100 : 60) : bulletSpacing, // Reduced spacing within section
                    line: bulletLineHeight,
                    lineRule: 'auto'
                  },
                  alignment: containsRTL(responsibilities[0]) ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                  keepWithNext: bulletCount > 1, // Chain with next bullet if more exist
                  pageBreakBefore: false,
                  widowControl: true,
                  orphanControl: true,
                  keepLines: true, // Prevent splitting within first bullet
                }),
                // Remaining bullets: All chained together as locked group
                ...responsibilities.slice(1).map((resp, idx) => {
                  const actualIdx = idx + 1;
                  const isLastBullet = actualIdx === bulletCount - 1;
                  // Normalize bullet with action verbs and measurable impact
                  const normalizedBullet = normalizeBullet(resp, experience);
                  const respText = cleanTextSpaces(normalizedBullet);
                  const processedText = insertSoftBreaks(respText, 380);
                  const isBilingual = containsRTL(respText) && /[a-zA-Z]/.test(respText);
                  
                  return new Paragraph({
                    children: isBilingual ? (() => {
                      // Bilingual mode: format per phrase
                      const phrases = splitMixedLanguage(processedText);
                      return phrases.map(phrase => 
                        new TextRun({
                          text: phrase.text,
                          size: 22,
                          font: 'Arial',
                          rightToLeft: phrase.isRTL,
                        })
                      );
                    })() : [
                      new TextRun({
                        text: processedText,
                        size: 22,
                        font: 'Arial',
                      })
                    ],
                    numbering: { level: 0, reference: 'bullet' },
                    spacing: { 
                      after: isLastBullet ? (isLastJob ? 100 : 60) : bulletSpacing, // Reduced spacing within section
                      line: bulletLineHeight,
                      lineRule: 'auto'
                    },
                    alignment: containsRTL(resp) ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
                    // Chain all bullets together within the same job - LOCKED GROUP
                    // Only break chain if this is the last bullet of the last job
                    keepWithNext: !(isLastBullet && isLastJob),
                    pageBreakBefore: false,
                    widowControl: true,
                    orphanControl: true,
                    keepLines: true, // Prevent splitting within each bullet
                  });
                }),
              ];
            })() : []),
          ];
        }),

        // GRADUATION PROJECT (for fresh graduates)
        ...(isGraduate && graduationProject && graduationProject.title ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'GRADUATION PROJECT',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
            spacing: getSectionSpacing(120, 0),
            pageBreakBefore: false,
            keepWithNext: true,
            keepLines: true,
            widowControl: true,
            orphanControl: true,
          }),
          // Project Title
          new Paragraph({
            children: [
              new TextRun({
                text: safe(graduationProject.title),
                bold: true,
                size: 22,
                font: 'Arial',
              }),
            ],
            spacing: { after: 6 },
            keepWithNext: true,
            pageBreakBefore: false,
            widowControl: true,
            orphanControl: true,
            keepLines: true,
            alignment: AlignmentType.LEFT,
          }),
          // Role and Duration
          new Paragraph({
            children: [
              new TextRun({
                text: safe(graduationProject.role) + (graduationProject.duration ? ` • ${safe(graduationProject.duration)}` : ''),
                size: 22,
                font: 'Arial',
                bold: false,
              }),
            ],
            spacing: { 
              after: graduationProject.description ? 0 : 60,
              line: adjustedLineHeight,
              lineRule: 'auto'
            },
            keepWithNext: !!graduationProject.description,
            pageBreakBefore: false,
            widowControl: true,
            orphanControl: true,
            alignment: AlignmentType.LEFT,
          }),
          // Project Description
          ...(graduationProject.description ? (() => {
            const descText = cleanTextSpaces(safe(graduationProject.description));
            const processedText = insertSoftBreaks(descText, 380);
            const isBilingual = containsRTL(descText) && /[a-zA-Z]/.test(descText);
            const lines = processedText.includes('\n') ? processedText.split('\n').filter(l => l.trim()) : [processedText];
            
            return lines.map((line, idx) => {
              const isLastLine = idx === lines.length - 1;
              const lineIsBilingual = isBilingual && containsRTL(line) && /[a-zA-Z]/.test(line);
              
              if (lineIsBilingual) {
                const phrases = splitMixedLanguage(line);
                return new Paragraph({
                  children: phrases.map(phrase => 
                    new TextRun({
                      text: phrase.text,
                      size: 22,
                      font: 'Arial',
                      rightToLeft: phrase.isRTL,
                    })
                  ),
                  spacing: { 
                    after: isLastLine ? 40 : 20,
                    line: adjustedLineHeight,
                    lineRule: 'auto'
                  },
                  alignment: AlignmentType.JUSTIFIED,
                  keepWithNext: !isLastLine,
                  pageBreakBefore: false,
                  widowControl: true,
                  orphanControl: true,
                });
              } else {
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      size: 22,
                      font: 'Arial',
                    })
                  ],
                  spacing: { 
                    after: isLastLine ? 40 : 20,
                    line: adjustedLineHeight,
                    lineRule: 'auto'
                  },
                  alignment: AlignmentType.JUSTIFIED,
                  keepWithNext: !isLastLine,
                  pageBreakBefore: false,
                  widowControl: true,
                  orphanControl: true,
                });
              }
            });
          })() : []),
          // Technologies Used
          ...(graduationProject.technologies && graduationProject.technologies.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Technologies: ' + graduationProject.technologies.map(t => safe(t)).join(', '),
                  size: 22,
                  font: 'Arial',
                  italic: true,
                }),
              ],
              spacing: { after: 40, line: adjustedLineHeight },
              pageBreakBefore: false,
              alignment: AlignmentType.LEFT,
            }),
          ] : []),
          // GitHub Link
          ...(graduationProject.githubUrl ? [
            new Paragraph({
              children: [
                new TextRun({ text: '• ', size: 22 }),
                new TextRun({ text: 'Repository', bold: true, size: 22 }),
                new TextRun({ text: ': ', size: 22 }),
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: graduationProject.githubUrl,
                      style: 'Hyperlink',
                      size: 22,
                    }),
                  ],
                  link: graduationProject.githubUrl,
                }),
              ],
              spacing: { after: 40, line: adjustedLineHeight },
              pageBreakBefore: false,
              alignment: AlignmentType.LEFT,
            }),
          ] : []),
          // Skills Acquired Section
          ...(projectSkills.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Skills Acquired During the Project',
                  bold: true,
                  size: 22,
                  font: 'Arial',
                }),
              ],
              spacing: { before: 20, after: 10, line: adjustedLineHeight },
              pageBreakBefore: false,
              alignment: AlignmentType.LEFT,
            }),
            ...projectSkills.map((skill, idx) => {
              const isLastSkill = idx === projectSkills.length - 1;
              return new Paragraph({
                children: [
                  new TextRun({
                    text: '• ' + safe(skill),
                    size: 22,
                    font: 'Arial',
                  }),
                ],
                numbering: { level: 0, reference: 'bullet' },
                spacing: { 
                  after: isLastSkill ? 100 : 20,
                  line: adjustedLineHeight,
                  lineRule: 'auto'
                },
                alignment: AlignmentType.LEFT,
                keepWithNext: !isLastSkill,
                pageBreakBefore: false,
                widowControl: true,
                orphanControl: true,
              });
            }),
          ] : []),
        ] : []),

        // Subtle divider line between Experience/Project and Education sections
        new Paragraph({
          children: [
            new TextRun({
              text: '',
            }),
          ],
          spacing: { 
            // Use compact spacing when fewer than 3 experiences
            after: useCompactLayout ? 40 : Math.round(100 * (estimatedPages > 2 ? 0.9 : 1.0)),
            before: 0, 
            line: adjustedLineHeight 
          },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, space: 1, color: 'E5E7EB' } },
          pageBreakBefore: false,
        }),

        // EDUCATION - All entries must stay together on same page
        // PREDICTIVE PAGE BREAK: Only force to next page if 3+ experiences AND block won't fit
        ...(education.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'EDUCATION',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
            // Use compact spacing when fewer than 3 experiences
            spacing: useCompactLayout ? { before: 60, after: 0 } : getSectionSpacing(120, 0),
            // PREDICTIVE DECISION: Force page break ONLY if education truly won't fit
            // Let Word handle natural page flow - avoid leaving large gaps
            pageBreakBefore: (() => {
              // Never force page break in compact layout (< 3 experiences)
              if (useCompactLayout) return false;
              
              // Only force page break if education section won't fit at all
              return shouldForceEducationPageBreak(education, experience);
            })(),
            keepWithNext: true, // Keep header with first education entry (minimum 3 lines rule)
            keepLines: true, // Prevent splitting section header
            widowControl: true,
            orphanControl: true,
          }),
        ] : []),
        ...education.flatMap((edu, eduIndex) => {
          const isLastEducation = eduIndex === education.length - 1;
          const isFirstEducation = eduIndex === 0;
          
          const educationParagraphs = [
            // Degree: Keep with institution/date, prevent page break
            // This forms a grouped block with institution/date
            new Paragraph({
              children: [
                new TextRun({
                  text: safe(edu.degree),
                  bold: true,
                  size: 22,
                  font: 'Arial',
                }),
              ],
              spacing: { after: 6 }, // Small spacing after degree
              keepWithNext: true, // Keep degree with institution/date (block grouping)
              pageBreakBefore: false,
              widowControl: true,
              orphanControl: true,
              keepLines: true, // Prevent splitting within degree line
            }),
            // Institution & Date: Right-aligned date, chained with next education entry
            // This completes the grouped block (degree + institution/date)
            new Paragraph({
              style: 'RightAlignedDate',
              children: [
                new TextRun({
                  text: safe(edu.institution),
                  bold: false, // Institution name not bold
                }),
                  new TextRun({
                    text: '\t',
                  }),
                  new TextRun({
                    text: formatDate(edu.graduationDate || edu.graduationYear),
                    bold: true,
                  }),
              ],
              spacing: { 
                // Use compact spacing when fewer than 3 experiences
                after: edu.gpa ? 6 : (isLastEducation 
                  ? (useCompactLayout ? 40 : Math.round(100 * (estimatedPages > 2 ? 0.9 : 1.0))) 
                  : (useCompactLayout ? 20 : Math.round(40 * (estimatedPages > 2 ? 0.9 : 1.0)))),
                line: adjustedLineHeight,
                lineRule: 'auto'
              },
              tabStops: [
                {
                  type: TabStopType.RIGHT,
                  position: convertInchesToTwip(7.0), // Consistent tab position for all dates
                },
              ],
              // Chain all education entries together - entire EDUCATION section stays on same page
              keepWithNext: edu.gpa ? true : !isLastEducation, // Keep with GPA if present, or with next education entry unless last
              pageBreakBefore: false,
              widowControl: true,
              orphanControl: true,
              keepLines: true, // Prevent splitting within institution/date line
              alignment: containsRTL(safe(edu.institution)) ? AlignmentType.RIGHT : AlignmentType.LEFT,
            }),
          ];
          
          // Add GPA if present
          if (edu.gpa && edu.gpa.trim()) {
              // Clean up GPA: remove spaces after decimal point (e.g., '3. 4' -> '3.4')
              let gpaValue = safe(edu.gpa);
              gpaValue = gpaValue.replace(/(\d)\.\s+(\d)/g, '$1.$2');
              educationParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `GPA: ${gpaValue}`,
                      bold: false,
                      size: 20,
                      font: 'Arial',
                      italics: true,
                    }),
                  ],
                  spacing: { 
                    // Use compact spacing when fewer than 3 experiences
                    after: isLastEducation 
                      ? (useCompactLayout ? 40 : Math.round(100 * (estimatedPages > 2 ? 0.9 : 1.0))) 
                      : (useCompactLayout ? 20 : Math.round(40 * (estimatedPages > 2 ? 0.9 : 1.0))),
                    line: adjustedLineHeight,
                    lineRule: 'auto'
                  },
                  keepWithNext: !isLastEducation, // Keep with next education entry unless last
                  pageBreakBefore: false,
                  widowControl: true,
                  orphanControl: true,
                  keepLines: true,
                  alignment: containsRTL(gpaValue) ? AlignmentType.RIGHT : AlignmentType.LEFT,
                })
              );
          }
          
          return educationParagraphs;
        }),

        // SKILLS - Categorized with intelligent multi-line wrapping per category
        ...(skills.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'SKILLS',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
            // Use compact spacing when fewer than 3 experiences
            spacing: useCompactLayout ? { before: 60, after: 0 } : getSectionSpacing(120, 0),
            pageBreakBefore: false,
            keepWithNext: true, // Keep header with skills content
            keepNext: languages.length > 0, // Keep Skills with Languages if Languages exist
            keepLines: true, // Prevent splitting section header
            widowControl: true,
            orphanControl: true,
          }),
          // Categorize and format skills
          ...(() => {
            const categorized = categorizeSkills(skills);
            const categoryNames = Object.keys(categorized);
            if (categoryNames.length === 0) return [];
            
            const result = [];
            
            categoryNames.forEach((categoryName, catIndex) => {
              const categorySkills = categorized[categoryName];
              const isLastCategory = catIndex === categoryNames.length - 1;
              
              // Category title (bold subheading)
              result.push(
                new Paragraph({
                  style: 'SubHeading',
                  children: [
                    new TextRun({
                      text: categoryName,
                      bold: true,
                      size: 22,
                      font: 'Arial',
                    }),
                  ],
                  spacing: { 
                    before: catIndex === 0 ? 0 : 30,
                    after: 10 
                  },
                  keepWithNext: true,
                  keepLines: true,
                  pageBreakBefore: false,
                })
              );

              // Format skills into balanced lines for this category
              const skillLines = formatSkillsIntoBlocks(categorySkills);

              skillLines.forEach((line, lineIndex) => {
                const isLastLine = lineIndex === skillLines.length - 1;
                const isLastLineOfLastCategory = isLastCategory && isLastLine;

                result.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cleanTextSpaces(line),
                        size: 22,
                        font: 'Arial',
                      }),
                    ],
                    spacing: { 
                      after: isLastLineOfLastCategory
                        ? (languages.length > 0 ? Math.round(50 * (estimatedPages > 2 ? 0.9 : 1.0)) : Math.round(120 * (estimatedPages > 2 ? 0.9 : 1.0)))
                        : (isLastLine ? 20 : 0),
                      line: adjustedLineHeight,
                      lineRule: 'auto'
                    },
                    alignment: AlignmentType.LEFT,
                    keepWithNext: !isLastLineOfLastCategory,
                    keepLines: true,
                    keepNext: !isLastLineOfLastCategory,
                    pageBreakBefore: false,
                    widowControl: true,
                    orphanControl: true,
                  })
                );
              });
            });
            
            return result;
          })(),
        ] : []),

        // LANGUAGES - Two-column table format
        ...(languages.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'LANGUAGES',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
            // Use compact spacing when fewer than 3 experiences
            spacing: { 
              before: skills.length > 0 ? 0 : (useCompactLayout ? 60 : getSectionSpacing(120, 0).before) 
            },
            pageBreakBefore: false,
            keepWithNext: true, // Keep header with languages content (minimum 3 lines rule)
            keepLines: true, // Prevent splitting section header
            widowControl: true,
            orphanControl: true,
          }),
          // Two-column table for languages
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            columnWidths: [6000, 4000], // Language name (60%), Proficiency (40%)
            rows: formatLanguagesTable(languages).map((lang, idx, arr) => {
              const isLastRow = idx === arr.length - 1;
              return new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: lang.language,
                            size: 22,
                            font: 'Arial',
                          }),
                        ],
                        spacing: { 
                          line: adjustedLineHeight, 
                          after: isLastRow ? 0 : 10 // Reduced spacing within section
                        },
                        keepLines: true,
                        keepNext: !isLastRow,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: lang.proficiency || '',
                            size: 22,
                            font: 'Arial',
                          }),
                        ],
                        spacing: { 
                          line: adjustedLineHeight, 
                          after: isLastRow ? 0 : 10 
                        },
                        alignment: AlignmentType.LEFT,
                        keepLines: true,
                        keepNext: !isLastRow,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                  }),
                ],
                keepLines: true,
                keepNext: !isLastRow,
              });
            }),
          }),
        ] : []),

        // COURSES & CERTIFICATIONS
        ...(courses.length > 0 ? [
          new Paragraph({
            style: 'SectionHeading',
            children: [
              new TextRun({
                text: 'COURSES & CERTIFICATIONS',
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' } },
            spacing: useCompactLayout ? { before: 60, after: 0 } : getSectionSpacing(120, 0),
            pageBreakBefore: false,
            keepWithNext: true,
            keepLines: true,
            widowControl: true,
            orphanControl: true,
          }),
          ...courses.flatMap((course, courseIndex) => {
            const isLastCourse = courseIndex === courses.length - 1;
            const courseName = safe(course.courseName || course.name || '');
            const provider = safe(course.provider || course.institution || '');
            const completionDate = course.completionDate ? formatDate(course.completionDate) : '';
            const category = safe(course.category || '');
            const certificateUrl = course.certificateUrl || '';
            
            const courseParagraphs = [
              // Course Name
              new Paragraph({
                children: [
                  new TextRun({
                    text: courseName,
                    bold: true,
                    size: 22,
                    font: 'Arial',
                  }),
                  ...(completionDate ? [
                    new TextRun({
                      text: '\t' + completionDate,
                      size: 22,
                      font: 'Arial',
                    }),
                  ] : []),
                ],
                tabStops: [
                  {
                    type: TabStopType.RIGHT,
                    position: convertInchesToTwip(7.0),
                  },
                ],
                spacing: { after: 6 },
                keepWithNext: true,
                pageBreakBefore: false,
                widowControl: true,
                orphanControl: true,
                keepLines: true,
                alignment: AlignmentType.LEFT,
              }),
              // Provider
              ...(provider ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: provider,
                      size: 22,
                      font: 'Arial',
                      bold: false,
                    }),
                  ],
                  spacing: { 
                    after: (category || certificateUrl) ? 6 : (isLastCourse ? 100 : 40),
                    line: adjustedLineHeight,
                    lineRule: 'auto'
                  },
                  keepWithNext: !!(category || certificateUrl) || !isLastCourse,
                  pageBreakBefore: false,
                  widowControl: true,
                  orphanControl: true,
                  alignment: AlignmentType.LEFT,
                }),
              ] : []),
              // Category (if present)
              ...(category ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Category: ' + category,
                      size: 20,
                      font: 'Arial',
                      italics: true,
                    }),
                  ],
                  spacing: { 
                    after: certificateUrl ? 6 : (isLastCourse ? 100 : 40),
                    line: adjustedLineHeight,
                    lineRule: 'auto'
                  },
                  keepWithNext: !!certificateUrl || !isLastCourse,
                  pageBreakBefore: false,
                  widowControl: true,
                  orphanControl: true,
                  alignment: AlignmentType.LEFT,
                }),
              ] : []),
              // Certificate URL (if present)
              ...(certificateUrl ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Certificate: ', size: 20, font: 'Arial' }),
                    new ExternalHyperlink({
                      children: [
                        new TextRun({
                          text: 'View Certificate',
                          style: 'Hyperlink',
                          size: 20,
                        }),
                      ],
                      link: certificateUrl,
                    }),
                  ],
                  spacing: { 
                    after: isLastCourse ? 100 : 40,
                    line: adjustedLineHeight,
                    lineRule: 'auto'
                  },
                  keepWithNext: !isLastCourse,
                  pageBreakBefore: false,
                  widowControl: true,
                  orphanControl: true,
                  alignment: AlignmentType.LEFT,
                }),
              ] : []),
            ];
            
            return courseParagraphs;
          }),
        ] : []),
      ],
    }],
  });

  return doc;
}

exports.createResume = async (req, res) => {
  try {
    let { title = 'My Resume', template = 'modern', content = {}, isPublic = false } = req.body;
    
    // Ensure experience is always an array (not null/undefined)
    // If user is a graduate, ensure experience is empty array
    if (req.user.isGraduate === true) {
      content.experience = [];
    } else {
      // For non-graduates, ensure experience is at least an empty array if not provided
      if (!Array.isArray(content.experience)) {
        content.experience = [];
      }
    }
    
    // Sanitize title and content
    title = sanitizeResumeData({ title }).title || 'My Resume';
    content = sanitizeResumeData(content);
    const record = await Resume.create({ userId: req.user.id, title, template, content, isPublic, lastModified: new Date() });
    return res.status(201).json({ success: true, data: { id: record.id } });
  } catch (err) {
    console.error('Create resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save resume' });
  }
};

exports.generateDocx = async (req, res) => {
  try {
    let resumeData = req.body; // expects { title, summary, skills[], experience[], education[], languages[], github, linkedin }
    
    // Ensure experience is always an array (not null/undefined)
    // If user is a graduate, ensure experience is empty array
    if (req.user.isGraduate === true) {
      resumeData.experience = [];
    } else {
      // For non-graduates, ensure experience is at least an empty array if not provided
      if (!Array.isArray(resumeData.experience)) {
        resumeData.experience = [];
      }
      
      // Validate experience date ranges
      if (Array.isArray(resumeData.experience)) {
        for (let i = 0; i < resumeData.experience.length; i++) {
          const exp = resumeData.experience[i];
          // Only validate if both dates exist and it's not a current job
          if (exp.startDate && exp.endDate && !exp.current && !exp.isCurrentJob) {
            const startDate = new Date(exp.startDate);
            const endDate = new Date(exp.endDate);
            if (endDate < startDate) {
              return res.status(400).json({ 
                success: false, 
                error: `Experience entry ${i + 1}: End date must be later than start date.` 
              });
            }
          }
        }
      }
    }
    
    // Sanitize all text fields to remove special characters
    resumeData = sanitizeResumeData(resumeData);
    const doc = buildDocxFromResume(resumeData, req.user);
    const buffer = await Packer.toBuffer(doc);
    const safeName = (req.user.fullName || 'resume').replace(/[^a-z0-9_\-]+/gi, '-');
    const timestamp = formatTimestamp();
    const filename = `${safeName}_${timestamp}.docx`;
    const filepath = path.join(GENERATED_DIR, filename);
    fs.writeFileSync(filepath, buffer);

    // Ensure experience is stored as empty array for graduates
    if (req.user.isGraduate === true) {
      resumeData.experience = [];
    }
    
    // Save or update resume content to DB
    const record = await Resume.create({
      userId: req.user.id,
      title: resumeData.title || 'My Resume',
      template: resumeData.template || 'modern',
      content: resumeData,
      isPublic: false,
      isComplete: true,
      lastModified: new Date(),
    });

    return res.json({ 
      success: true, 
      resumeId: record.id, 
      downloadUrl: `/api/files/${filename}`, 
      filename 
    });
  } catch (err) {
    console.error('Generate DOCX error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate resume' });
  }
};

exports.listResumes = async (req, res) => {
  try {
    const resumes = await Resume.findAll({ 
      where: { userId: req.user.id },
      order: [['lastModified', 'DESC']]
    });
    
    // Include all relevant fields for dashboard display
    const formattedResumes = resumes.map(resume => ({
      id: resume.id,
      title: resume.title,
      template: resume.template,
      content: resume.content,
      currentStep: resume.currentStep,
      isComplete: resume.isComplete,
      isPublic: resume.isPublic,
      lastModified: resume.lastModified,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    }));
    
    return res.json({ success: true, data: formattedResumes });
  } catch (err) {
    console.error('List resumes error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch resumes' });
  }
};

// Get in-progress/draft resumes (incomplete ones)
exports.getInProgressResumes = async (req, res) => {
  try {
    const resumes = await Resume.findAll({ 
      where: { 
        userId: req.user.id,
        isComplete: false
      },
      order: [['lastModified', 'DESC']]
    });
    
    const formattedResumes = resumes.map(resume => ({
      id: resume.id,
      title: resume.title,
      template: resume.template,
      content: resume.content,
      currentStep: resume.currentStep,
      isComplete: resume.isComplete,
      lastModified: resume.lastModified,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    }));
    
    return res.json({ success: true, data: formattedResumes });
  } catch (err) {
    console.error('Get in-progress resumes error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch in-progress resumes' });
  }
};

// Get the most recent in-progress resume (for auto-continue feature)
exports.getLatestDraft = async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      where: { 
        userId: req.user.id,
        isComplete: false
      },
      order: [['lastModified', 'DESC']]
    });
    
    if (!resume) {
      return res.json({ success: true, data: null });
    }
    
    return res.json({ 
      success: true, 
      data: {
        id: resume.id,
        title: resume.title,
        template: resume.template,
        content: resume.content,
        currentStep: resume.currentStep,
        isComplete: resume.isComplete,
        lastModified: resume.lastModified,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      }
    });
  } catch (err) {
    console.error('Get latest draft error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch draft resume' });
  }
};

exports.getResumeById = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }
    
    return res.json({ success: true, data: resume });
  } catch (err) {
    console.error('Get resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch resume' });
  }
};

exports.updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    let resumeData = req.body; // expects { title, summary, skills[], experience[], education[], languages[], github, linkedin }
    
    // Ensure experience is always an array (not null/undefined)
    // If user is a graduate, ensure experience is empty array
    if (req.user.isGraduate === true) {
      resumeData.experience = [];
    } else {
      // For non-graduates, ensure experience is at least an empty array if not provided
      if (!Array.isArray(resumeData.experience)) {
        resumeData.experience = [];
      }
      
      // Validate experience date ranges
      if (Array.isArray(resumeData.experience)) {
        for (let i = 0; i < resumeData.experience.length; i++) {
          const exp = resumeData.experience[i];
          // Only validate if both dates exist and it's not a current job
          if (exp.startDate && exp.endDate && !exp.current && !exp.isCurrentJob) {
            const startDate = new Date(exp.startDate);
            const endDate = new Date(exp.endDate);
            if (endDate < startDate) {
              return res.status(400).json({ 
                success: false, 
                error: `Experience entry ${i + 1}: End date must be later than start date.` 
              });
            }
          }
        }
      }
    }
    
    // Sanitize all text fields to remove special characters
    resumeData = sanitizeResumeData(resumeData);
    
    // Find the resume and verify ownership
    const resume = await Resume.findOne({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }
    
    // Generate new DOCX file
    const doc = buildDocxFromResume(resumeData, req.user);
    const buffer = await Packer.toBuffer(doc);
    const safeName = (req.user.fullName || 'resume').replace(/[^a-z0-9_\-]+/gi, '-');
    const timestamp = formatTimestamp();
    const filename = `${safeName}_${timestamp}.docx`;
    const filepath = path.join(GENERATED_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    // Update the resume record
    resume.title = resumeData.title || resume.title || 'My Resume';
    resume.content = resumeData;
    resume.isComplete = true;
    resume.lastModified = new Date();
    await resume.save();
    
    return res.json({ 
      success: true, 
      resumeId: resume.id, 
      downloadUrl: `/api/files/${filename}`, 
      filename 
    });
  } catch (err) {
    console.error('Update resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update resume' });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resume = await Resume.findOne({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }
    
    // Delete the resume
    await resume.destroy();
    
    return res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete resume' });
  }
};


// Upload an existing CV file and create a resume record referencing it
exports.uploadResumeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const storedFilename = req.file.filename;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const size = req.file.size;

    const publicPath = `/api/files/uploads/${storedFilename}`;

    const content = {
      uploadedFile: {
        originalName,
        storedFilename,
        mimeType,
        size,
        url: publicPath
      }
    };

    const record = await Resume.create({
      userId: req.user.id,
      title: originalName || 'Uploaded CV',
      template: 'uploaded',
      content,
      isPublic: false,
      lastModified: new Date()
    });

    return res.status(201).json({ success: true, data: { id: record.id, file: content.uploadedFile } });
  } catch (err) {
    console.error('Upload resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to upload resume' });
  }
};

// Securely download an uploaded resume file if owned by the user
exports.downloadUploadedResume = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' });
    }

    // Verify the user owns a resume pointing to this stored filename
    const record = await Resume.findOne({
      where: {
        userId: req.user.id,
        content: {
          uploadedFile: { storedFilename: filename }
        }
      }
    });

    // If above JSON query doesn't work with dialect, fallback to scan
    let ownerRecord = record;
    if (!ownerRecord) {
      const all = await Resume.findAll({ where: { userId: req.user.id } });
      ownerRecord = all.find(r => r.content?.uploadedFile?.storedFilename === filename);
      if (!ownerRecord) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }
    }

    // Ensure path is within uploads dir
    const safeBase = path.resolve(UPLOADS_DIR);
    const target = path.resolve(UPLOADS_DIR, filename);
    if (!target.startsWith(safeBase)) {
      return res.status(400).json({ success: false, error: 'Invalid file path' });
    }
    if (!fs.existsSync(target)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const downloadName = ownerRecord.content?.uploadedFile?.originalName || filename;
    return res.download(target, downloadName);
  } catch (err) {
    console.error('Download resume error:', err);
    return res.status(500).json({ success: false, error: 'Failed to download file' });
  }
};

// Save resume progress (auto-save during CV generation)
exports.saveProgress = async (req, res) => {
  try {
    const { resumeId, currentStep, content, title } = req.body;
    
    // Sanitize content if provided
    const sanitizedContent = content ? sanitizeResumeData(content) : null;
    
    if (resumeId) {
      // Update existing resume
      const resume = await Resume.findOne({
        where: { id: resumeId, userId: req.user.id }
      });
      
      if (!resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
      }
      
      // Update fields
      if (sanitizedContent) {
        resume.content = sanitizedContent;
      }
      if (currentStep) {
        resume.currentStep = currentStep;
      }
      if (title) {
        resume.title = sanitizeResumeData({ title }).title || resume.title;
      }
      resume.lastModified = new Date();
      
      await resume.save();
      
      return res.json({
        success: true,
        data: {
          id: resume.id,
          currentStep: resume.currentStep,
          isComplete: resume.isComplete
        }
      });
    } else {
      // Create new draft resume
      const newResume = await Resume.create({
        userId: req.user.id,
        title: sanitizeResumeData({ title: title || 'Draft Resume' }).title,
        template: 'modern',
        content: sanitizedContent || {},
        currentStep: currentStep || 1,
        isComplete: false,
        lastModified: new Date()
      });
      
      return res.status(201).json({
        success: true,
        data: {
          id: newResume.id,
          currentStep: newResume.currentStep,
          isComplete: newResume.isComplete
        }
      });
    }
  } catch (err) {
    console.error('Save progress error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save progress' });
  }
};
