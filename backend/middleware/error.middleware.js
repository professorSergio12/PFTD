/** 404 handler for unmatched routes. */
function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

/** Central error handler. Keeps controllers free of try/catch boilerplate. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    return res.status(409).json({ message: "Email already in use" });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server error" });
}

module.exports = { notFound, errorHandler };