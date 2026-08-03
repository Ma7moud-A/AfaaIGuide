function validateLogin(req, res, next) {
  const { identifier, password } = req.body;

  const missingFields = [];

  if (!identifier || identifier.trim() === "") {
    missingFields.push("identifier");
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

  next();
}

module.exports = validateLogin;