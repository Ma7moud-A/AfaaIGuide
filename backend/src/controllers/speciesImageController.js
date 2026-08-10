const pool = require("../config/db");

const {
  saveImageLocally,
  deleteLocalImage,
} = require("../services/storageService");

async function addSpeciesImage(req, res) {
  const client = await pool.connect();

  let savedImage = null;

  try {
    const speciesId = Number(req.params.id);
    const uploadedBy = req.user.id;
    const file = req.file;

    if (
      !Number.isInteger(speciesId) ||
      speciesId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid species id",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const speciesResult = await client.query(
      `
      SELECT id
      FROM species
      WHERE id = $1;
      `,
      [speciesId]
    );

    if (speciesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Species not found",
      });
    }

    savedImage = await saveImageLocally(
      file.buffer,
      "species"
    );

    await client.query("BEGIN");

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
        $5, $6, 'PUBLIC', $7
      )
      RETURNING *;
      `,
      [
        savedImage.storageKey,
        file.originalname,
        savedImage.mimeType,
        savedImage.sizeBytes,
        savedImage.width,
        savedImage.height,
        uploadedBy,
      ]
    );

    const mediaAsset =
      mediaResult.rows[0];

    const currentImagesResult =
      await client.query(
        `
        SELECT
          COUNT(*)::integer AS count,
          COALESCE(MAX(sort_order), -1) AS max_sort_order
        FROM species_images
        WHERE species_id = $1;
        `,
        [speciesId]
      );

    const currentCount =
      currentImagesResult.rows[0].count;

    const nextSortOrder =
      Number(
        currentImagesResult.rows[0]
          .max_sort_order
      ) + 1;

    const isPrimary =
      currentCount === 0;

    const imageResult =
      await client.query(
        `
        INSERT INTO species_images (
          species_id,
          media_asset_id,
          is_primary,
          sort_order
        )
        VALUES (
          $1, $2, $3, $4
        )
        RETURNING *;
        `,
        [
          speciesId,
          mediaAsset.id,
          isPrimary,
          nextSortOrder,
        ]
      );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Species image added successfully",

      data: {
        image: {
          ...imageResult.rows[0],

          storage_key:
            mediaAsset.storage_key,

          original_filename:
            mediaAsset.original_filename,

          mime_type:
            mediaAsset.mime_type,

          size_bytes:
            mediaAsset.size_bytes,

          width:
            mediaAsset.width,

          height:
            mediaAsset.height,
        },
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // لا يوجد Transaction مفتوح.
    }

    if (savedImage) {
      try {
        await deleteLocalImage(
          savedImage.storageKey
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean up species image:",
          cleanupError
        );
      }
    }

    console.error(
      "Error adding species image:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add species image",
    });
  } finally {
    client.release();
  }
}

async function deleteSpeciesImage(
  req,
  res
) {
  const client = await pool.connect();

  try {
    const speciesId =
      Number(req.params.id);

    const imageId =
      Number(req.params.imageId);

    if (
      !Number.isInteger(speciesId) ||
      speciesId <= 0 ||
      !Number.isInteger(imageId) ||
      imageId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid species or image id",
      });
    }

    await client.query("BEGIN");

    const imageResult =
      await client.query(
        `
        SELECT
          si.id,
          si.species_id,
          si.media_asset_id,
          si.is_primary,
          ma.storage_key

        FROM species_images si

        JOIN media_assets ma
          ON ma.id = si.media_asset_id

        WHERE si.id = $1
          AND si.species_id = $2

        FOR UPDATE;
        `,
        [imageId, speciesId]
      );

    if (imageResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Species image not found",
      });
    }

    const image =
      imageResult.rows[0];

    await client.query(
      `
      DELETE FROM species_images
      WHERE id = $1;
      `,
      [imageId]
    );

    /*
      لا نحذف media_assets أو الملف المحلي هنا،
      لأن نفس media_asset قد يكون مستخدمًا
      في اقتراح خبير أو مكان آخر.

      هذا أكثر أمانًا للنسخة الأولى.
    */

    if (image.is_primary) {
      const nextImageResult =
        await client.query(
          `
          SELECT id
          FROM species_images
          WHERE species_id = $1
          ORDER BY sort_order ASC, id ASC
          LIMIT 1;
          `,
          [speciesId]
        );

      if (
        nextImageResult.rows.length > 0
      ) {
        await client.query(
          `
          UPDATE species_images
          SET is_primary = true
          WHERE id = $1;
          `,
          [
            nextImageResult.rows[0].id,
          ]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        "Species image deleted successfully",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }

    console.error(
      "Error deleting species image:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete species image",
    });
  } finally {
    client.release();
  }
}

async function setPrimarySpeciesImage(
  req,
  res
) {
  const client = await pool.connect();

  try {
    const speciesId =
      Number(req.params.id);

    const imageId =
      Number(req.params.imageId);

    if (
      !Number.isInteger(speciesId) ||
      speciesId <= 0 ||
      !Number.isInteger(imageId) ||
      imageId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid species or image id",
      });
    }

    await client.query("BEGIN");

    const imageResult =
      await client.query(
        `
        SELECT id
        FROM species_images
        WHERE id = $1
          AND species_id = $2
        FOR UPDATE;
        `,
        [
          imageId,
          speciesId,
        ]
      );

    if (imageResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Species image not found",
      });
    }

    await client.query(
      `
      UPDATE species_images
      SET is_primary = false
      WHERE species_id = $1;
      `,
      [speciesId]
    );

    await client.query(
      `
      UPDATE species_images
      SET is_primary = true
      WHERE id = $1
        AND species_id = $2;
      `,
      [
        imageId,
        speciesId,
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        "Primary species image updated successfully",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }

    console.error(
      "Error setting primary species image:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update primary species image",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  addSpeciesImage,
  deleteSpeciesImage,
  setPrimarySpeciesImage,
};