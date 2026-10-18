const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");
export const MAX_REVIEW_TEXT_LENGTH = 1500;
const MAX_REVIEW_HTML_LENGTH = 10000;

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a valid image file (PNG, JPEG, or WebP).";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "The image must be smaller than 2 MB.";
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address.";
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (password.length > 128) {
    return "Password cannot be longer than 128 characters.";
  }
  return null;
};

export const validateDisplayName = (displayName: string): string | null => {
  if (displayName.length < 1) {
    return "Display name must be at least 1 character long.";
  }
  if (displayName.length > 40) {
    return "Display name cannot be longer than 40 characters.";
  }
  return null;
};

export const validateReview = (
  html: string,
  plainText: string,
): string | null => {
  if (plainText.trim().length === 0) return "A review must contain some text";
  if (plainText.length > MAX_REVIEW_TEXT_LENGTH) {
    return `The review must be ${MAX_REVIEW_TEXT_LENGTH} characters or fewer`;
  }
  if (html.length > MAX_REVIEW_HTML_LENGTH) {
    return "The review has too much formatting. Simplify the formatting and try again";
  }
  return null;
};
