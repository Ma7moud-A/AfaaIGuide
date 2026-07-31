function validateId(req, res, next) {
  const { id } = req.params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid id. The id must be a positive integer.",
    });
  }

  req.params.id = numericId;

  next();
}

module.exports = validateId;