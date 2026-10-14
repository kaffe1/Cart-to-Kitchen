const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "The image must be smaller than 5 MB.";
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
