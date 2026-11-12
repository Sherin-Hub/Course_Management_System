// Small helper: errors with an HTTP status that middleware/errorHandler.js understands.
function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = httpError;
