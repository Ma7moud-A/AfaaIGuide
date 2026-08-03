const multer = require("multer");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const uploadImage = multer({
  storage: multer.memoryStorage(),

  // maximum size for one pic is 8MB 
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
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

module.exports = uploadImage;