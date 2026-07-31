const pool = require("../config/db");

async function getAllSpecies(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.animal_group_id,
        ag.code AS animal_group_code,
        s.arabic_name,
        s.english_name,
        s.scientific_name,
        s.description,
        s.venom_status,
        s.danger_level,
        s.minimum_size_cm,
        s.maximum_size_cm,
        s.behavior,
        s.what_to_do,
        s.what_not_to_do
      FROM species s
      JOIN animal_groups ag
        ON ag.id = s.animal_group_id
      ORDER BY s.id;
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching species:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch species",
    });
  }
}

async function getSpeciesById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        s.id,
        s.animal_group_id,
        ag.code AS animal_group_code,
        s.arabic_name,
        s.english_name,
        s.scientific_name,
        s.description,
        s.venom_status,
        s.danger_level,
        s.minimum_size_cm,
        s.maximum_size_cm,
        s.behavior,
        s.what_to_do,
        s.what_not_to_do
      FROM species s
      JOIN animal_groups ag
        ON ag.id = s.animal_group_id
      WHERE s.id = $1;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Species not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching species by id:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch species",
    });
  }
}

async function createSpecies(req, res) {
  try {
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

    const result = await pool.query(
      `
      INSERT INTO species (
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
        what_not_to_do
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12
      )
      RETURNING *;
      `,
      [
        animal_group_id,
        arabic_name.trim(),
        english_name.trim(),
        scientific_name.trim(),
        description.trim(),
        venom_status,
        danger_level,
        minimum_size_cm ?? null,
        maximum_size_cm ?? null,
        behavior.trim(),
        what_to_do.trim(),
        what_not_to_do.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Species created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating species:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A species with this scientific name already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "The selected animal group does not exist",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "One or more values violate a database rule",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create species",
    });
  }
}

async function updateSpecies(req, res) {
  try {
    const { id } = req.params;

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

    const result = await pool.query(
      `
      UPDATE species
      SET
        animal_group_id = $1,
        arabic_name = $2,
        english_name = $3,
        scientific_name = $4,
        description = $5,
        venom_status = $6,
        danger_level = $7,
        minimum_size_cm = $8,
        maximum_size_cm = $9,
        behavior = $10,
        what_to_do = $11,
        what_not_to_do = $12
      WHERE id = $13
      RETURNING *;
      `,
      [
        animal_group_id,
        arabic_name.trim(),
        english_name.trim(),
        scientific_name.trim(),
        description.trim(),
        venom_status,
        danger_level,
        minimum_size_cm ?? null,
        maximum_size_cm ?? null,
        behavior.trim(),
        what_to_do.trim(),
        what_not_to_do.trim(),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Species not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Species updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating species:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A species with this scientific name already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "The selected animal group does not exist",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "One or more values violate a database rule",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update species",
    });
  }
}

async function deleteSpecies(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM species
      WHERE id = $1
      RETURNING
        id,
        arabic_name,
        english_name,
        scientific_name;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Species not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Species deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting species:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete species",
    });
  }
}

module.exports = {
  getAllSpecies,
  getSpeciesById,
  createSpecies,
  updateSpecies,
  deleteSpecies,
};