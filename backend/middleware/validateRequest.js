const { validationResult } = require("express-validator");

// Put this AFTER a list of express-validator rules. It turns the collected
// problems into one consistent 400 response.
function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg
      }))
    });
  }

  next();
}

module.exports = validateRequest;
