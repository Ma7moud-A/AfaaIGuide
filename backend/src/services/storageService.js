const crypto = require("crypto");
const sharp = require("sharp");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const allowedCategories = new Set([
  "chat",
  "expert-submissions",
  "species",
]);

let r2Client = null;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `${name} environment variable is not configured`
    );
  }

  return value.trim();
}

function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  const accountId = getRequiredEnv(
    "R2_ACCOUNT_ID"
  );

  const accessKeyId = getRequiredEnv(
    "R2_ACCESS_KEY_ID"
  );

  const secretAccessKey = getRequiredEnv(
    "R2_SECRET_ACCESS_KEY"
  );

  r2Client = new S3Client({
    region: "auto",

    endpoint:
      `https://${accountId}.r2.cloudflarestorage.com`,

    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

function getBucketName() {
  return getRequiredEnv(
    "R2_BUCKET_NAME"
  );
}

function normalizeCategory(category) {
  return allowedCategories.has(category)
    ? category
    : "chat";
}

function createStorageKey(category) {
  const now = new Date();

  const year = String(
    now.getUTCFullYear()
  );

  const month = String(
    now.getUTCMonth() + 1
  ).padStart(2, "0");

  const safeCategory =
    normalizeCategory(category);

  const filename =
    `${crypto.randomUUID()}.webp`;

  return [
    safeCategory,
    year,
    month,
    filename,
  ].join("/");
}

/*
 * الاسم بقي saveImageLocally حتى لا نضطر
 * لتعديل جميع الـcontrollers الآن.
 *
 * لكنه لم يعد يحفظ محليًا إطلاقًا.
 * الصورة تذهب إلى Cloudflare R2.
 */
async function saveImageLocally(
  fileBuffer,
  category = "chat"
) {
  if (
    !Buffer.isBuffer(fileBuffer) ||
    fileBuffer.length === 0
  ) {
    throw new Error(
      "A valid image buffer is required"
    );
  }

  const {
    data: processedBuffer,
    info: imageInfo,
  } = await sharp(fileBuffer)
    .rotate()
    .resize({
      width: 1280,
      height: 1280,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 82,
    })
    .toBuffer({
      resolveWithObject: true,
    });

  const storageKey =
    createStorageKey(category);

  const client =
    getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: storageKey,
      Body: processedBuffer,
      ContentType: "image/webp",

      CacheControl:
        "public, max-age=31536000, immutable",
    })
  );

  return {
    storageKey,

    /*
     * نرجع الـbuffer لأن Chat/Gemini يحتاج
     * الصورة بعد معالجتها.
     */
    processedBuffer,

    mimeType: "image/webp",

    sizeBytes:
      imageInfo.size ??
      processedBuffer.length,

    width: imageInfo.width,

    height: imageInfo.height,
  };
}

/*
 * نفس الاسم القديم حفاظًا على توافق
 * الـcontrollers الحالية.
 *
 * الحذف الآن يتم من R2.
 */
async function deleteLocalImage(
  storageKey
) {
  if (
    !storageKey ||
    typeof storageKey !== "string"
  ) {
    throw new Error(
      "A valid storage key is required"
    );
  }

  const normalizedKey =
    storageKey
      .replaceAll("\\", "/")
      .replace(/^\/+/, "");

  if (
    normalizedKey.includes("../") ||
    normalizedKey.includes("..\\")
  ) {
    throw new Error(
      "Invalid storage key"
    );
  }

  const client =
    getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: normalizedKey,
    })
  );
}

module.exports = {
  saveImageLocally,
  deleteLocalImage,
};