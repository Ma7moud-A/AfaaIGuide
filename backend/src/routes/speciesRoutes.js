const express = require("express");

const {
  getAllSpecies,
  getSpeciesById,
  createSpecies,
  updateSpecies,
  deleteSpecies,
} = require("../controllers/speciesController");

const {
  addSpeciesImage,
  deleteSpeciesImage,
  setPrimarySpeciesImage,
} = require("../controllers/speciesImageController");

const validateId = require("../middleware/validateId");
const validateSpecies = require("../middleware/validateSpecies");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const uploadExpertImages = require(
  "../middleware/uploadExpertImages"
);

const router = express.Router();

/* =========================
   Public routes
   ========================= */

router.get(
  "/",
  getAllSpecies
);

router.get(
  "/:id",
  validateId,
  getSpeciesById
);

/* =========================
   Species management
   ========================= */

router.post(
  "/",
  authenticate,
  authorizeRoles(
    "CONTENT_ADMIN",
    "ADMIN"
  ),
  validateSpecies,
  createSpecies
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles(
    "CONTENT_ADMIN",
    "ADMIN"
  ),
  validateId,
  validateSpecies,
  updateSpecies
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(
    "CONTENT_ADMIN",
    "ADMIN"
  ),
  validateId,
  deleteSpecies
);

/* =========================
   Species images management
   ========================= */

router.post(
  "/:id/images",
  authenticate,
  authorizeRoles(
    "CONTENT_ADMIN",
    "ADMIN"
  ),
  validateId,
  uploadExpertImages.single("image"),
  addSpeciesImage
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorizeRoles(
    "CONTENT_ADMIN",
    "ADMIN"
  ),
  validateId,
  deleteSpeciesImage
);

router.patch(
  "/:id/images/:imageId/primary",
  authenticate,
  authorizeRoles(
    "CONTENT_ADMIN",
    "ADMIN"
  ),
  validateId,
  setPrimarySpeciesImage
);

module.exports = router;