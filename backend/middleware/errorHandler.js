// Must be registered LAST in server.js (after every route and notFound).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON request body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }

  // MongoDB duplicate key (unique index), e.g. same email twice
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value already exists"
    });
  }

  // Mongoose schema validation failed
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors).map((item) => item.message)
    });
  }

  // Bad ObjectId or wrong type in a query
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid identifier"
    });
  }

  // Our own errors use err.statusCode (services); libraries use err.status.
  const candidate = err.status ?? err.statusCode;
  const status =
    Number.isInteger(candidate) && candidate >= 400 && candidate < 600
      ? candidate
      : 500;

  if (status === 500) console.error(err);

  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message
  });
}

module.exports = errorHandler;
