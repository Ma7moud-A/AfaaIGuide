const allowedVenomStatuses = [
  "VENOMOUS",
  "NON_VENOMOUS",
  "MILDLY_VENOMOUS",
  "UNKNOWN",
];

const allowedDangerLevels = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
  "UNKNOWN",
];

function validateSpecies(req, res, next) {
  const {
    animal_group_id,
    arabic_name,
    english_name,
    scientific_name,
    description,
    venom_status,
    danger_level,
    minimum_size_cm,
    maximum_size_cm,
    behavior,
    what_to_do,
    what_not_to_do,
  } = req.body;

  const requiredFields = {
    animal_group_id,
    arabic_name,
    english_name,
    scientific_name,
    description,
    venom_status,
    danger_level,
    behavior,
    what_to_do,
    what_not_to_do,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => {
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    })
    .map(([field]) => field);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Required fields are missing",
      missingFields,
    });
  }

  if (
    !Number.isInteger(Number(animal_group_id)) ||
    Number(animal_group_id) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "animal_group_id must be a positive integer",
    });
  }

  if (!allowedVenomStatuses.includes(venom_status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid venom_status",
      allowedValues: allowedVenomStatuses,
    });
  }

  if (!allowedDangerLevels.includes(danger_level)) {
    return res.status(400).json({
      success: false,
      message: "Invalid danger_level",
      allowedValues: allowedDangerLevels,
    });
  }

  const hasMinimumSize =
    minimum_size_cm !== undefined && minimum_size_cm !== null;

  const hasMaximumSize =
    maximum_size_cm !== undefined && maximum_size_cm !== null;

  if (hasMinimumSize && Number(minimum_size_cm) < 0) {
    return res.status(400).json({
      success: false,
      message: "minimum_size_cm cannot be negative",
    });
  }

  if (hasMaximumSize && Number(maximum_size_cm) < 0) {
    return res.status(400).json({
      success: false,
      message: "maximum_size_cm cannot be negative",
    });
  }

  if (
    hasMinimumSize &&
    hasMaximumSize &&
    Number(maximum_size_cm) <= Number(minimum_size_cm)
  ) {
    return res.status(400).json({
      success: false,
      message: "maximum_size_cm must be greater than minimum_size_cm",
    });
  }

  next();
}
module.exports = validateSpecies;