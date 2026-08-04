const multer = require("multer");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const uploadExpertImages = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 5,
  },

  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error(
        "Only JPEG, PNG, and WebP images are allowed"
      );

      error.statusCode = 400;
      error.code = "INVALID_IMAGE_TYPE";

      return callback(error);
    }

    callback(null, true);
  },
});

module.exports = uploadExpertImages;