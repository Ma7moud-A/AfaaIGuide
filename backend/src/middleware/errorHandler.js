const multer = require("multer");

function errorHandler(error, req, res, next) {
  console.error("Unhandled application error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Image size must not exceed 8 MB",
        code: "IMAGE_TOO_LARGE",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one image can be uploaded at a time",
        code: "TOO_MANY_IMAGES",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          'Unexpected file field. The image field must be named "image"',
        code: "UNEXPECTED_FILE_FIELD",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid image upload request",
      code: error.code,
    });
  }

  if (error.code === "INVALID_IMAGE_TYPE") {
    return res.status(400).json({
      success: false,
      message:
        "Unsupported image type. Only JPEG, PNG, and WebP are allowed",
      code: "INVALID_IMAGE_TYPE",
    });
  }

  const statusCode =
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
      ? error.statusCode
      : 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : error.message,
  });
}

module.exports = errorHandler;