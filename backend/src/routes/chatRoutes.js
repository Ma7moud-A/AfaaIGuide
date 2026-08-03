const express = require("express");

const {
  chatMessageLimiter,
  imageAnalysisLimiter,
} = require("../middleware/rateLimiters");

const uploadImage = require(
  "../middleware/uploadImage"
);

const {
  createConversation,
  sendMessage,
  getConversationMessages,
  sendImageMessage,
} = require("../controllers/chatController");

const optionalAuthenticate = require(
  "../middleware/optionalAuthenticate"
);

const validateId = require("../middleware/validateId");

const router = express.Router();

router.post(
  "/conversations",
  optionalAuthenticate,
  createConversation
);

router.post(
  "/conversations/:id/messages",
  chatMessageLimiter,
  optionalAuthenticate,
  validateId,
  sendMessage
);

router.get(
  "/conversations/:id/messages",
  optionalAuthenticate,
  validateId,
  getConversationMessages
);

router.post(
  "/conversations/:id/images",
  imageAnalysisLimiter,
  optionalAuthenticate,
  validateId,
  uploadImage.single("image"),
  sendImageMessage
);

module.exports = router;