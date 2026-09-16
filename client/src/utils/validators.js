/* validates email format */
export const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/* validates minimum password length */
export const isValidPassword = (password, minLength = 8) => {
  return password && password.length >= minLength;
};

/* validates that the passwords match */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/* validates name with a minimum of 2 chars */
export const isValidName = (name) => {
  return name && name.trim().length >= 2;
};

/* validates hexadecimal color code */
export const isValidHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

/* validates ISO date format */
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/* validates that the date is in the future */
export const isFutureDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

/* validates text length */
export const isValidLength = (text, minLength, maxLength) => {
  const length = text ? text.trim().length : 0;
  return length >= minLength && length <= maxLength;
};

/* validates positive number */
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

/* sanitizes text input */
export const sanitizeText = (text) => {
  if (!text) return '';
  return text.trim().replace(/<[^>]*>/g, '');
};

/* validates URL */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  isValidEmail,
  isValidPassword,
  passwordsMatch,
  isValidName,
  isValidHexColor,
  isValidDate,
  isFutureDate,
  isValidLength,
  isPositiveNumber,
  sanitizeText,
  isValidUrl
};