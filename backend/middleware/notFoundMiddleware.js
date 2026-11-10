// Runs after every API route: anything that reached here matched nothing.
function notFoundMiddleware(req, res) {
  res.status(404).json({
    message: "API endpoint not found"
  });
}

module.exports = notFoundMiddleware;
