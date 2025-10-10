// ✅ Enhanced Validation Utilities

/**
 * Validate Email Address
 * - Must start with a letter
 * - Allows dots, numbers, underscores, and hyphens before @
 * - Must have valid domain and TLD (2–6 chars)
 */
export const ValidEmail = (email) => {
  const regex =
    /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(String(email).trim().toLowerCase());
};

/**
 * Validate Full Name
 * - Allows alphabets, spaces, apostrophes, and hyphens
 * - No double spaces or trailing spaces
 */
export const ValidFullName = (fullName) => {
  const regex =
    /^(?!.*\s{2,})[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
  return regex.test(String(fullName).trim());
};

/**
 * Validate Password
 * - Minimum 8 characters
 * - Must contain at least one uppercase, one lowercase, one number, and one special character
 */
export const ValidPassword = (password) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(String(password));
};

/**
 * Validate Confirm Password
 * - Must match the password
 * - Password must also be valid
 */
export const ValidCPassword = (password, confirmPassword) => {
  const pass = String(password);
  const cpass = String(confirmPassword);
  return ValidPassword(pass) && pass === cpass;
};
