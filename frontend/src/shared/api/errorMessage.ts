import { ApiError } from "./apiError";

const defaultErrorMessages: Record<string, string> = {
  auth_required: "You need to be signed in",
  invalid_session: "Please sign in again to proceed",
};

export const messageForApiError = (
  error: unknown,
  byCode: Record<string, string>,
  fallback: string,
): string => {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "NETWORK_ERROR") return error.message;
  return byCode[error.code] ?? defaultErrorMessages[error.code] ?? fallback;
};
