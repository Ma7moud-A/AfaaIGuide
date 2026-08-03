const express = require("express");

const {
  authLimiter,
} = require("../middleware/rateLimiters");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const validateRegister = require("../middleware/validateRegister");
const validateLogin = require("../middleware/validateLogin");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validateRegister,
  register
);

router.post(
  "/login",
  authLimiter,
  validateLogin,
  login
);

router.get("/me", authenticate, getMe);

module.exports = router;