const { param, query } = require("express-validator");

// Strict 24-hex MongoDB ObjectId in a URL parameter, e.g. /courses/:id
const objectIdParam = (name = "id") =>
  param(name).isMongoId().withMessage("Invalid identifier");

// Optional ?page= and ?limit= (limit is capped so nobody can ask for
// the whole collection in one request).
const MAX_LIMIT = 100;

const paginationQuery = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("page must be a whole number of 1 or more")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${MAX_LIMIT}`)
    .toInt()
];

module.exports = { objectIdParam, paginationQuery, MAX_LIMIT };
