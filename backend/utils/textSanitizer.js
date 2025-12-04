/**
 * Backend text sanitization utility
 * Removes special characters from user input
 * Allows only letters, numbers, spaces, and basic punctuation
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Remove special characters: *, $, %, @, #, ^, &, +, =, etc.
  // Keep: letters, numbers, spaces, basic punctuation (. , ; : ! ? - ' " ( ))
  let sanitized = text
    // Remove bullet points and special formatting characters
    .replace(/[•\u2022\u2023\u25E6\u2043\u2219]/g, '') // Various bullet characters
    .replace(/[*$%@#^&+=<>_~`|\\]/g, '') // Special characters
    .replace(/[{}[\]]/g, '') // Curly and square brackets (except parentheses)
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
    // Remove multiple consecutive spaces and replace with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
  
  return sanitized;
}

/**
 * Enhanced text cleaning: trim and remove double/multiple spaces
 * Converts "  word    word" to "word word"
 * Also removes excessive line breaks and trailing bullets
 */
function cleanTextSpaces(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
    .replace(/[•\u2022\u2023\u25E6\u2043\u2219]\s*$/, '') // Remove trailing bullet characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*,\s*/g, ', ') // Normalize comma spacing
    .replace(/\s*\.\s*/g, '. ') // Normalize period spacing
    .trim(); // Trim leading/trailing spaces
}

/**
 * Detect if text contains RTL languages (Arabic, Hebrew)
 */
function containsRTL(text) {
  if (!text || typeof text !== 'string') return false;
  // Arabic range: \u0600-\u06FF
  // Hebrew range: \u0590-\u05FF
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  return rtlRegex.test(text);
}

/**
 * Split text into phrases and detect RTL/LTR for each phrase
 * Returns array of {text, isRTL} objects
 */
function splitMixedLanguage(text) {
  if (!text || typeof text !== 'string') return [{ text, isRTL: false }];
  
  // Split by spaces and punctuation to get phrases
  const phrases = text.split(/(\s+|[.,;:!?])/).filter(p => p.trim().length > 0);
  const result = [];
  
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    if (phrase.trim().length > 0) {
      result.push({
        text: phrase,
        isRTL: containsRTL(phrase)
      });
    }
  }
  
  return result.length > 0 ? result : [{ text, isRTL: false }];
}

/**
 * Estimate character count for content length estimation
 */
function estimateContentLength(data) {
  let length = 0;
  if (data.summary) length += data.summary.length;
  if (data.title) length += data.title.length;
  
  if (Array.isArray(data.experience)) {
    data.experience.forEach(exp => {
      if (exp.position) length += exp.position.length;
      if (exp.company) length += exp.company.length;
      if (Array.isArray(exp.description)) {
        exp.description.forEach(desc => length += desc.length);
      } else if (exp.description) {
        length += exp.description.length;
      }
    });
  }
  
  if (Array.isArray(data.education)) {
    data.education.forEach(edu => {
      if (edu.degree) length += edu.degree.length;
      if (edu.institution) length += edu.institution.length;
    });
  }
  
  if (Array.isArray(data.skills)) {
    length += data.skills.join(', ').length;
  }
  
  if (Array.isArray(data.languages)) {
    length += data.languages.map(l => typeof l === 'string' ? l : l.language).join(', ').length;
  }
  
  return length;
}

/**
 * Insert soft breaks in long paragraphs (> 380 chars)
 * Breaks at natural boundaries (sentences, commas)
 */
function insertSoftBreaks(text, maxLength = 380) {
  if (!text || typeof text !== 'string' || text.length <= maxLength) return text;
  
  // Try to break at sentence boundaries first
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 1) {
    let result = '';
    let currentLength = 0;
    
    sentences.forEach(sentence => {
      if (currentLength + sentence.length > maxLength && currentLength > 0) {
        result += '\n';
        currentLength = 0;
      }
      result += sentence;
      currentLength += sentence.length;
    });
    
    return result;
  }
  
  // Try breaking at commas
  const parts = text.split(/(,\s+)/);
  if (parts.length > 1) {
    let result = '';
    let currentLength = 0;
    
    parts.forEach((part, idx) => {
      if (idx > 0 && currentLength + part.length > maxLength && currentLength > 100) {
        result += '\n';
        currentLength = 0;
      }
      result += part;
      currentLength += part.length;
    });
    
    return result;
  }
  
  // Last resort: break at word boundaries
  const words = text.split(/(\s+)/);
  let result = '';
  let currentLength = 0;
  
  words.forEach(word => {
    if (currentLength + word.length > maxLength && currentLength > 100) {
      result += '\n';
      currentLength = 0;
    }
    result += word;
    currentLength += word.length;
  });
  
  return result;
}

function sanitizeTextArray(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => {
      if (typeof item === 'string') {
        return sanitizeText(item);
      }
      return sanitizeText(String(item));
    })
    .filter(item => item.trim().length > 0);
}

/**
 * Sanitizes resume data object
 */
function sanitizeResumeData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Sanitize title and summary
  if (sanitized.title) sanitized.title = sanitizeText(sanitized.title);
  if (sanitized.summary) sanitized.summary = sanitizeText(sanitized.summary);
  
  // Sanitize experience array
  if (Array.isArray(sanitized.experience)) {
    sanitized.experience = sanitized.experience.map(exp => ({
      ...exp,
      position: exp.position ? sanitizeText(exp.position) : '',
      company: exp.company ? sanitizeText(exp.company) : '',
      description: Array.isArray(exp.description) 
        ? sanitizeTextArray(exp.description)
        : (exp.description ? sanitizeTextArray([exp.description]) : [])
    }));
  }
  
  // Sanitize education array
  if (Array.isArray(sanitized.education)) {
    sanitized.education = sanitized.education.map(edu => ({
      ...edu,
      degree: edu.degree ? sanitizeText(edu.degree) : '',
      institution: edu.institution ? sanitizeText(edu.institution) : '',
      fieldOfStudy: edu.fieldOfStudy ? sanitizeText(edu.fieldOfStudy) : ''
    }));
  }
  
  // Sanitize skills array
  if (Array.isArray(sanitized.skills)) {
    sanitized.skills = sanitized.skills.map(skill => 
      sanitizeText(typeof skill === 'string' ? skill : String(skill))
    ).filter(skill => skill.trim().length > 0);
  }
  
  // Sanitize languages array
  if (Array.isArray(sanitized.languages)) {
    sanitized.languages = sanitized.languages.map(lang => {
      const languageName = typeof lang === 'string' ? lang : (lang.language || '');
      return typeof lang === 'string' 
        ? sanitizeText(languageName)
        : {
            ...lang,
            language: sanitizeText(languageName)
          };
    }).filter(lang => {
      const langName = typeof lang === 'string' ? lang : lang.language;
      return langName && langName.trim().length > 0;
    });
  }
  
  return sanitized;
}

module.exports = {
  sanitizeText,
  sanitizeTextArray,
  sanitizeResumeData,
  cleanTextSpaces,
  containsRTL,
  splitMixedLanguage,
  estimateContentLength,
  insertSoftBreaks
};

