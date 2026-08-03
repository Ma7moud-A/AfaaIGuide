function validateRegister(req, res, next) {
  const {
    username,
    email,
    password,
    full_name,
    preferred_language = "ar",
  } = req.body;

  const missingFields = [];

  if (!username || username.trim() === "") {
    missingFields.push("username");
  }

  if (!email || email.trim() === "") {
    missingFields.push("email");
  }

  if (!password || password === "") {
    missingFields.push("password");
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Required fields are missing",
      missingFields,
    });
  }

  const normalizedUsername = username.trim();

  if (
    normalizedUsername.length < 3 ||
    normalizedUsername.length > 50
  ) {
    return res.status(400).json({
      success: false,
      message: "Username must be between 3 and 50 characters",
    });
  }

  const usernamePattern = /^[a-zA-Z0-9_]+$/;

  if (!usernamePattern.test(normalizedUsername)) {
    return res.status(400).json({
      success: false,
      message:
        "Username may contain only letters, numbers, and underscores",
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must contain at least 8 characters",
    });
  }

  if (full_name && full_name.trim().length > 150) {
    return res.status(400).json({
      success: false,
      message: "Full name cannot exceed 150 characters",
    });
  }

  if (!["ar", "en"].includes(preferred_language)) {
    return res.status(400).json({
      success: false,
      message: "preferred_language must be ar or en",
    });
  }

  next();
}

module.exports = validateRegister;