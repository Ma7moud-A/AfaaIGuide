const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const uploadExpertImages = require("../middleware/uploadExpertImages");

const {
  createSpeciesSubmission,
} = require("../controllers/expertSubmissionController");

const router = express.Router();

router.post(
  "/species-submissions",
  authenticate,
  authorizeRoles("EXPERT", "ADMIN"),
  uploadExpertImages.array("images", 5),
  createSpeciesSubmission
);

module.exports = router;