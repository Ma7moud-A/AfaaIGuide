const express = require("express");

const {
  getAllSpecies,
  getSpeciesById,
  createSpecies,
  updateSpecies,
  deleteSpecies,
} = require("../controllers/speciesController");

const validateId = require("../middleware/validateId");
const validateSpecies = require("../middleware/validateSpecies");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/", getAllSpecies);
router.get("/:id", validateId, getSpeciesById);

router.post(
  "/",
  authenticate,
  authorizeRoles("CONTENT_ADMIN", "ADMIN"),
  validateSpecies,
  createSpecies
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("CONTENT_ADMIN", "ADMIN"),
  validateId,
  validateSpecies,
  updateSpecies
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("CONTENT_ADMIN", "ADMIN"),
  validateId,
  deleteSpecies
);

module.exports = router;