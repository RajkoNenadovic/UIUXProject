export function notFoundHandler(request, response) {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
}

export function errorHandler(error, request, response, next) {
  console.error(error);
  if (response.headersSent) {
    return next(error);
  }

  response.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.publicMessage || 'Something went wrong.'
    }
  });
}
