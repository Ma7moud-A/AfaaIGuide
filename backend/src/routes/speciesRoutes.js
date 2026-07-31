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

const router = express.Router();

router.get("/", getAllSpecies);

router.get("/:id", validateId, getSpeciesById);

router.post("/", validateSpecies, createSpecies);

router.put("/:id", validateId, validateSpecies, updateSpecies);

router.delete("/:id", validateId, deleteSpecies);

module.exports = router;