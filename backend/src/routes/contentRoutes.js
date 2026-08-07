const express = require("express");

const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const {
  getAllSpeciesSubmissions,
  getSpeciesSubmissionById,
  updateSpeciesSubmissionStatus,
  publishSpeciesSubmission,
} = require(
  "../controllers/contentSubmissionController"
);

const router = express.Router();

router.get(
  "/submissions",
  authenticate,
  authorizeRoles("CONTENT_ADMIN", "ADMIN"),
  getAllSpeciesSubmissions
);

router.get(
  "/submissions/:id",
  authenticate,
  authorizeRoles("CONTENT_ADMIN", "ADMIN"),
  getSpeciesSubmissionById
);

router.patch(
  "/submissions/:id/status",
  authenticate,
  authorizeRoles("CONTENT_ADMIN", "ADMIN"),
  updateSpeciesSubmissionStatus
);

router.post(
  "/submissions/:id/publish",
  authenticate,
  authorizeRoles("CONTENT_ADMIN", "ADMIN"),
  publishSpeciesSubmission
);

module.exports = router;