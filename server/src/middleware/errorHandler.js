export function notFoundHandler(request, response) {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
}

export function errorHandler(error, request, response, next) {
  const status = error.statusCode || error.status || 500;
  if (status >= 500) {
    // Failures we raised on purpose (provider down, timeout) are one line; unexpected ones keep the stack.
    if (error.publicMessage) console.warn(`[api] ${request.method} ${request.path} -> ${error.code}`);
    else console.error(error);
  }
  if (response.headersSent) {
    return next(error);
  }

  // Only errors we raised on purpose (they have publicMessage) may choose their own code.
  // Anything else (SQLite internals, body-parser) is mapped to a safe, generic code.
  const known = Boolean(error.publicMessage);
  let code = 'INTERNAL_ERROR';
  if (known) code = error.code;
  else if (status === 400) code = 'BAD_REQUEST';
  else if (status === 413) code = 'PAYLOAD_TOO_LARGE';

  response.status(status).json({
    error: {
      code,
      message: error.publicMessage || 'Something went wrong.'
    }
  });
}
