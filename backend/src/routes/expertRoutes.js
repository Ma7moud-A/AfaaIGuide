const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const uploadExpertImages = require(
  "../middleware/uploadExpertImages"
);

const {
  createSpeciesSubmission,
  getMySpeciesSubmissions,
  getMySpeciesSubmissionById,
} = require(
  "../controllers/expertSubmissionController"
);

const router = express.Router();

router.get(
  "/species-submissions",
  authenticate,
  authorizeRoles("EXPERT", "ADMIN"),
  getMySpeciesSubmissions
);

router.get(
  "/species-submissions/:id",
  authenticate,
  authorizeRoles("EXPERT", "ADMIN"),
  getMySpeciesSubmissionById
);

router.post(
  "/species-submissions",
  authenticate,
  authorizeRoles("EXPERT", "ADMIN"),
  uploadExpertImages.array("images", 5),
  createSpeciesSubmission
);

module.exports = router;