const pool = require("../config/db");

const REVIEW_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

async function getAllSpeciesSubmissions(req, res) {
  try {
    const status = req.query.status?.trim().toUpperCase();

    if (status && !REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission status",
        code: "INVALID_SUBMISSION_STATUS",
      });
    }

    const values = [];
    let statusCondition = "";

    if (status) {
      values.push(status);
      statusCondition = `WHERE ess.status = $${values.length}`;
    }

    const result = await pool.query(
      `
      SELECT
        ess.*,

        json_build_object(
          'id', submitter.id,
          'username', submitter.username,
          'email', submitter.email,
          'full_name', submitter.full_name
        ) AS submitted_by_user,

        CASE
          WHEN reviewer.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', reviewer.id,
            'username', reviewer.username,
            'email', reviewer.email,
            'full_name', reviewer.full_name
          )
        END AS reviewed_by_user,

        COALESCE(
          json_agg(
            json_build_object(
              'id', esi.id,
              'submission_id', esi.submission_id,
              'media_asset_id', esi.media_asset_id,
              'is_primary', esi.is_primary,
              'sort_order', esi.sort_order,
              'media_asset', json_build_object(
                'id', ma.id,
                'storage_key', ma.storage_key,
                'original_filename', ma.original_filename,
                'mime_type', ma.mime_type,
                'size_bytes', ma.size_bytes,
                'width', ma.width,
                'height', ma.height,
                'visibility', ma.visibility
              )
            )
            ORDER BY esi.sort_order ASC
          ) FILTER (WHERE esi.id IS NOT NULL),
          '[]'::json
        ) AS images

      FROM expert_species_submissions ess

      JOIN users submitter
        ON submitter.id = ess.submitted_by

      LEFT JOIN users reviewer
        ON reviewer.id = ess.reviewed_by

      LEFT JOIN expert_submission_images esi
        ON esi.submission_id = ess.id

      LEFT JOIN media_assets ma
        ON ma.id = esi.media_asset_id

      ${statusCondition}

      GROUP BY
        ess.id,
        submitter.id,
        reviewer.id

      ORDER BY
        CASE ess.status
          WHEN 'SUBMITTED' THEN 1
          WHEN 'UNDER_REVIEW' THEN 2
          WHEN 'APPROVED' THEN 3
          WHEN 'REJECTED' THEN 4
          ELSE 5
        END,
        ess.created_at DESC;
      `,
      values
    );

    return res.status(200).json({
      success: true,
      message: "Species submissions retrieved successfully",
      data: {
        submissions: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error(
      "Error retrieving content submissions:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve species submissions",
    });
  }
}

async function getSpeciesSubmissionById(req, res) {
  try {
    const submissionId = Number(req.params.id);

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission id",
        code: "INVALID_SUBMISSION_ID",
      });
    }

    const result = await pool.query(
      `
      SELECT
        ess.*,

        json_build_object(
          'id', submitter.id,
          'username', submitter.username,
          'email', submitter.email,
          'full_name', submitter.full_name
        ) AS submitted_by_user,

        CASE
          WHEN reviewer.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', reviewer.id,
            'username', reviewer.username,
            'email', reviewer.email,
            'full_name', reviewer.full_name
          )
        END AS reviewed_by_user,

        COALESCE(
          json_agg(
            json_build_object(
              'id', esi.id,
              'submission_id', esi.submission_id,
              'media_asset_id', esi.media_asset_id,
              'is_primary', esi.is_primary,
              'sort_order', esi.sort_order,
              'media_asset', json_build_object(
                'id', ma.id,
                'storage_key', ma.storage_key,
                'original_filename', ma.original_filename,
                'mime_type', ma.mime_type,
                'size_bytes', ma.size_bytes,
                'width', ma.width,
                'height', ma.height,
                'visibility', ma.visibility
              )
            )
            ORDER BY esi.sort_order ASC
          ) FILTER (WHERE esi.id IS NOT NULL),
          '[]'::json
        ) AS images

      FROM expert_species_submissions ess

      JOIN users submitter
        ON submitter.id = ess.submitted_by

      LEFT JOIN users reviewer
        ON reviewer.id = ess.reviewed_by

      LEFT JOIN expert_submission_images esi
        ON esi.submission_id = ess.id

      LEFT JOIN media_assets ma
        ON ma.id = esi.media_asset_id

      WHERE ess.id = $1

      GROUP BY
        ess.id,
        submitter.id,
        reviewer.id;
      `,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Species submission not found",
        code: "SUBMISSION_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Species submission retrieved successfully",
      data: {
        submission: result.rows[0],
      },
    });
  } catch (error) {
    console.error(
      "Error retrieving content submission:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve species submission",
    });
  }
}

async function updateSpeciesSubmissionStatus(req, res) {
  const client = await pool.connect();

  try {
    const submissionId = Number(req.params.id);
    const reviewerId = req.user.id;

    const status = req.body.status
      ?.trim()
      .toUpperCase();

    const reviewNotes =
      req.body.review_notes?.trim() || null;

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission id",
        code: "INVALID_SUBMISSION_ID",
      });
    }

    const allowedTargetStatuses = [
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
    ];

    if (!allowedTargetStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review status",
        code: "INVALID_REVIEW_STATUS",
      });
    }

    if (status === "REJECTED" && !reviewNotes) {
      return res.status(400).json({
        success: false,
        message: "Review notes are required when rejecting",
        code: "REJECTION_NOTES_REQUIRED",
      });
    }

    await client.query("BEGIN");

    const currentResult = await client.query(
      `
      SELECT *
      FROM expert_species_submissions
      WHERE id = $1
      FOR UPDATE;
      `,
      [submissionId]
    );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Species submission not found",
        code: "SUBMISSION_NOT_FOUND",
      });
    }

    const currentSubmission = currentResult.rows[0];

    if (
      ["APPROVED", "REJECTED"].includes(
        currentSubmission.status
      )
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "This submission has already received a final review",
        code: "SUBMISSION_ALREADY_REVIEWED",
      });
    }

    const updateResult = await client.query(
      `
      UPDATE expert_species_submissions
      SET
        status = $1,
        reviewed_by = $2,
        review_notes = $3,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
      `,
      [
        status,
        reviewerId,
        reviewNotes,
        submissionId,
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Species submission status updated successfully",
      data: {
        submission: updateResult.rows[0],
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // لا يوجد Transaction مفتوح.
    }

    console.error(
      "Error updating submission status:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update species submission status",
    });
  } finally {
    client.release();
  }
}

async function publishSpeciesSubmission(req, res) {
  const client = await pool.connect();

  try {
    const submissionId = Number(req.params.id);
    const publisherId = req.user.id;

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission id",
        code: "INVALID_SUBMISSION_ID",
      });
    }

    const {
      english_name,
      scientific_name,
      description,
      venom_status,
      danger_level,
      behavior,
      what_to_do,
      what_not_to_do,
      minimum_size_cm = null,
      maximum_size_cm = null,
    } = req.body;

    const requiredTextFields = {
      english_name,
      scientific_name,
      description,
      behavior,
      what_to_do,
      what_not_to_do,
    };

    for (const [fieldName, fieldValue] of Object.entries(
      requiredTextFields
    )) {
      if (
        typeof fieldValue !== "string" ||
        !fieldValue.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required`,
          code: "REQUIRED_PUBLISH_FIELD_MISSING",
        });
      }
    }

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

    const normalizedVenomStatus = venom_status
      ?.trim()
      .toUpperCase();

    const normalizedDangerLevel = danger_level
      ?.trim()
      .toUpperCase();

    if (
      !allowedVenomStatuses.includes(
        normalizedVenomStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid venom status",
        code: "INVALID_VENOM_STATUS",
      });
    }

    if (
      !allowedDangerLevels.includes(
        normalizedDangerLevel
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid danger level",
        code: "INVALID_DANGER_LEVEL",
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
        message: "Minimum size must be positive",
        code: "INVALID_MINIMUM_SIZE",
      });
    }

    if (
      maximumSize !== null &&
      (!Number.isFinite(maximumSize) || maximumSize <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum size must be positive",
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

    await client.query("BEGIN");

    const submissionResult = await client.query(
      `
      SELECT *
      FROM expert_species_submissions
      WHERE id = $1
      FOR UPDATE;
      `,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Species submission not found",
        code: "SUBMISSION_NOT_FOUND",
      });
    }

    const submission = submissionResult.rows[0];

    if (submission.status !== "APPROVED") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "Only approved submissions can be published",
        code: "SUBMISSION_NOT_APPROVED",
      });
    }

    if (submission.created_species_id) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "This submission has already been published",
        code: "SUBMISSION_ALREADY_PUBLISHED",
      });
    }

    const animalGroupResult = await client.query(
      `
      SELECT id
      FROM animal_groups
      WHERE code = 'SNAKES'
      LIMIT 1;
      `
    );

    if (animalGroupResult.rows.length === 0) {
      throw new Error(
        "SNAKES animal group does not exist"
      );
    }

    const animalGroupId =
      animalGroupResult.rows[0].id;

    const speciesResult = await client.query(
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
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12
      )
      RETURNING *;
      `,
      [
        animalGroupId,
        submission.arabic_name.trim(),
        english_name.trim(),
        scientific_name.trim(),
        description.trim(),
        normalizedVenomStatus,
        normalizedDangerLevel,
        minimumSize,
        maximumSize,
        behavior.trim(),
        what_to_do.trim(),
        what_not_to_do.trim(),
      ]
    );

    const species = speciesResult.rows[0];

    const submissionImagesResult = await client.query(
      `
      SELECT
        esi.media_asset_id,
        esi.is_primary,
        esi.sort_order
      FROM expert_submission_images esi
      WHERE esi.submission_id = $1
      ORDER BY esi.sort_order ASC;
      `,
      [submissionId]
    );

    for (const image of submissionImagesResult.rows) {
      await client.query(
        `
        INSERT INTO species_images (
          species_id,
          media_asset_id,
          is_primary,
          sort_order
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (
          species_id,
          media_asset_id
        ) DO NOTHING;
        `,
        [
          species.id,
          image.media_asset_id,
          image.is_primary,
          image.sort_order,
        ]
      );

      await client.query(
        `
        UPDATE media_assets
        SET visibility = 'PUBLIC'
        WHERE id = $1;
        `,
        [image.media_asset_id]
      );
    }

    const updatedSubmissionResult = await client.query(
      `
      UPDATE expert_species_submissions
      SET
        status = 'PUBLISHED',
        created_species_id = $1,
        reviewed_by = COALESCE(reviewed_by, $2),
        reviewed_at = COALESCE(
          reviewed_at,
          CURRENT_TIMESTAMP
        )
      WHERE id = $3
      RETURNING *;
      `,
      [species.id, publisherId, submissionId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Species published successfully",
      data: {
        species,
        submission:
          updatedSubmissionResult.rows[0],
        images_count:
          submissionImagesResult.rows.length,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // لا يوجد Transaction مفتوح.
    }

    console.error(
      "Error publishing species submission:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "A species with this scientific name already exists",
        code: "SCIENTIFIC_NAME_ALREADY_EXISTS",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to publish species submission",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  getAllSpeciesSubmissions,
  getSpeciesSubmissionById,
  updateSpeciesSubmissionStatus,
  publishSpeciesSubmission,
};