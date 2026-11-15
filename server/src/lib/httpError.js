// Errors carry a machine-readable `code`. The client maps codes to translated
// messages, so the English `publicMessage` is only a fallback for API consumers.
export function httpError(statusCode, code) {
  const error = new Error(code);
  error.statusCode = statusCode;
  error.code = code;
  error.publicMessage = code;
  return error;
}
