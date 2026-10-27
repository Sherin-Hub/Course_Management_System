// eslint-disable-next-line no-unused-vars
function errorMiddleware(error, req, res, next) {
  // Malformed JSON bodies
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) console.error(error);

  res.status(statusCode).json({
    message: statusCode >= 500 ? "Internal server error" : error.message,
  });
}

module.exports = errorMiddleware;
