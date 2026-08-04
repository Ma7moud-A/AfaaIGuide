const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const uploadsRoot = path.resolve(
    __dirname,
    "../../uploads"
);

async function saveImageLocally(
    fileBuffer,
    category = "chat"
) {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        throw new Error("A valid image buffer is required");
    }

    const now = new Date();

    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");

    const allowedCategories = new Set([
        "chat",
        "expert-submissions",
        "species",
    ]);

    const safeCategory = allowedCategories.has(category)
        ? category
        : "chat";

    const relativeDirectory = path.join(
        safeCategory,
        year,
        month
    );

    const absoluteDirectory = path.join(
        uploadsRoot,
        relativeDirectory
    );

    await fs.mkdir(absoluteDirectory, {
        recursive: true,
    });

    const filename = `${crypto.randomUUID()}.webp`;

    const absolutePath = path.join(
        absoluteDirectory,
        filename
    );

    const imageInfo = await sharp(fileBuffer)
        .rotate()
        .resize({
            width: 1280,
            height: 1280,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({
            quality: 76,
        })
        .webp({
            quality: 82,
        })
        .toFile(absolutePath);

    const storageKey = path
        .join(relativeDirectory, filename)
        .replaceAll("\\", "/");

    return {
        storageKey,
        absolutePath,
        mimeType: "image/webp",
        sizeBytes: imageInfo.size,
        width: imageInfo.width,
        height: imageInfo.height,
    };
}

async function deleteLocalImage(storageKey) {
    const absolutePath = path.resolve(
        uploadsRoot,
        storageKey
    );

    // Prevent any attempt to exit the 'uploads' folder
    if (!absolutePath.startsWith(uploadsRoot + path.sep)) {
        throw new Error("Invalid storage key");
    }

    try {
        await fs.unlink(absolutePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
}

module.exports = {
    saveImageLocally,
    deleteLocalImage,
};