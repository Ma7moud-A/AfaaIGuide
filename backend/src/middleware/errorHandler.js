function errorHandler(error, req, res, next) {
  console.error("Unhandled application error:", error);

  return res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
}

module.exports = errorHandler;