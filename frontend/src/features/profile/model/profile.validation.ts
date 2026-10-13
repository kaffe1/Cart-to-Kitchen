// TODO: implement regex validation for profile fields (3 points)

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
