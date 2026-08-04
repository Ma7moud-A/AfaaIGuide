const fs = require("fs/promises");

const pool = require("../config/db");

const {
  saveImageLocally,
  deleteLocalImage,
} = require("../services/storageService");

async function createSpeciesSubmission(req, res) {
  const client = await pool.connect();
  const savedImages = [];

  try {
    const {
      arabic_name,
      venom_status = null,
      minimum_size_cm = null,
      maximum_size_cm = null,
      habitat_notes = null,
      behavior_notes = null,
      expert_notes = null,
    } = req.body;

    const submittedBy = req.user.id;
    const files = req.files || [];

    if (!arabic_name || !arabic_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Arabic snake name is required",
        code: "ARABIC_NAME_REQUIRED",
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one snake image is required",
        code: "IMAGE_REQUIRED",
      });
    }

    const allowedVenomStatuses = [
      "VENOMOUS",
      "NON_VENOMOUS",
      "MILDLY_VENOMOUS",
      "UNKNOWN",
    ];

    const normalizedVenomStatus =
      venom_status && venom_status.trim()
        ? venom_status.trim().toUpperCase()
        : null;

    if (
      normalizedVenomStatus &&
      !allowedVenomStatuses.includes(normalizedVenomStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid venom status",
        code: "INVALID_VENOM_STATUS",
      });
    }

    const minimumSize =
      minimum_size_cm === null ||
      minimum_size_cm === ""
        ? null
        : Number(minimum_size_cm);

    const maximumSize =
      maximum_size_cm === null ||
      maximum_size_cm === ""
        ? null
        : Number(maximum_size_cm);

    if (
      minimumSize !== null &&
      (!Number.isFinite(minimumSize) || minimumSize <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum size must be a positive number",
        code: "INVALID_MINIMUM_SIZE",
      });
    }

    if (
      maximumSize !== null &&
      (!Number.isFinite(maximumSize) || maximumSize <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum size must be a positive number",
        code: "INVALID_MAXIMUM_SIZE",
      });
    }

    if (
      minimumSize !== null &&
      maximumSize !== null &&
      maximumSize < minimumSize
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum size must be greater than or equal to minimum size",
        code: "INVALID_SIZE_RANGE",
      });
    }

    /*
     * نعالج الصور قبل فتح Transaction طويلة.
     */
    for (const file of files) {
      const savedImage = await saveImageLocally(
        file.buffer,
        "expert-submissions"
      );

      savedImages.push({
        ...savedImage,
        originalFilename: file.originalname,
      });
    }

    await client.query("BEGIN");

    const submissionResult = await client.query(
      `
      INSERT INTO expert_species_submissions (
        submitted_by,
        arabic_name,
        venom_status,
        minimum_size_cm,
        maximum_size_cm,
        habitat_notes,
        behavior_notes,
        expert_notes
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8
      )
      RETURNING *;
      `,
      [
        submittedBy,
        arabic_name.trim(),
        normalizedVenomStatus,
        minimumSize,
        maximumSize,
        habitat_notes?.trim() || null,
        behavior_notes?.trim() || null,
        expert_notes?.trim() || null,
      ]
    );

    const submission = submissionResult.rows[0];
    const createdImages = [];

    for (let index = 0; index < savedImages.length; index += 1) {
      const image = savedImages[index];

      const mediaResult = await client.query(
        `
        INSERT INTO media_assets (
          storage_key,
          original_filename,
          mime_type,
          size_bytes,
          width,
          height,
          visibility,
          uploaded_by
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, 'PRIVATE', $7
        )
        RETURNING *;
        `,
        [
          image.storageKey,
          image.originalFilename,
          image.mimeType,
          image.sizeBytes,
          image.width,
          image.height,
          submittedBy,
        ]
      );

      const mediaAsset = mediaResult.rows[0];

      const submissionImageResult = await client.query(
        `
        INSERT INTO expert_submission_images (
          submission_id,
          media_asset_id,
          is_primary,
          sort_order
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `,
        [
          submission.id,
          mediaAsset.id,
          index === 0,
          index,
        ]
      );

      createdImages.push({
        ...submissionImageResult.rows[0],
        media_asset: mediaAsset,
      });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Species submission created successfully",
      data: {
        submission,
        images: createdImages,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // لا يوجد Transaction مفتوح.
    }

    for (const image of savedImages) {
      try {
        await deleteLocalImage(image.storageKey);
      } catch (cleanupError) {
        console.error(
          "Failed to delete expert submission image:",
          cleanupError.message
        );
      }
    }

    console.error(
      "Error creating expert species submission:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create species submission",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  createSpeciesSubmission,
};