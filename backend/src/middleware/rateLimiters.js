const { rateLimit } = require("express-rate-limit");

function createRateLimitHandler(message, code) {
  return (req, res) => {
    return res.status(429).json({
      success: false,
      message,
      code,
      retry_after_seconds: Math.ceil(
        (req.rateLimit.resetTime.getTime() - Date.now()) / 1000
      ),
    });
  };
}

/*
 * Protect account registration and login against repeated attempts
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  handler: createRateLimitHandler(
    "Too many authentication attempts. Please try again later.",
    "AUTH_RATE_LIMIT_EXCEEDED"
  ),
});

/*
 * Text-based conversations are cheaper than image analysis,
 * so we assign them a higher limit.
 */
const chatMessageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  handler: createRateLimitHandler(
    "Too many chat messages. Please wait before sending another message.",
    "CHAT_RATE_LIMIT_EXCEEDED"
  ),
});

/*
 * Image analysis consumes more AI resources and requests,
 * so we set a lower limit for it
 */
const imageAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  handler: createRateLimitHandler(
    "Image analysis limit reached. Please try again later.",
    "IMAGE_RATE_LIMIT_EXCEEDED"
  ),
});

module.exports = {
  authLimiter,
  chatMessageLimiter,
  imageAnalysisLimiter,
};