/**
 * Sanitizes text input by removing special characters
 * Allows only letters, numbers, spaces, and basic punctuation
 * Removes user-typed bullets and special formatting characters
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove special characters: *, $, %, @, #, ^, &, +, =, etc.
  // Keep: letters, numbers, spaces, basic punctuation (. , ; : ! ? - ' " ( ) [ ])
  // Also remove common bullet points and special formatting
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
};

/**
 * Sanitizes an array of text items (like description arrays)
 */
export const sanitizeTextArray = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => {
      if (typeof item === 'string') {
        return sanitizeText(item);
      }
      return sanitizeText(String(item));
    })
    .filter(item => item.trim().length > 0); // Remove empty items
};

/**
 * Sanitizes multiline text, splitting by newlines and cleaning each line
 */
export const sanitizeMultilineText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Split by newlines, sanitize each line, filter empty lines, join back
  return text
    .split(/\r?\n/)
    .map(line => sanitizeText(line))
    .filter(line => line.trim().length > 0)
    .join('\n');
};

