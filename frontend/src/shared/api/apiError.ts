export class ApiError extends Error {
  override name = 'ApiError';

  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}
