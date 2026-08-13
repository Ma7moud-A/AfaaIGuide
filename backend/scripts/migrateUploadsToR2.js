require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");

const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const uploadsRoot = path.resolve(
  __dirname,
  "../uploads"
);

const requiredEnv = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    console.error(
      `❌ Missing environment variable: ${name}`
    );

    process.exit(1);
  }
}

const client = new S3Client({
  region: "auto",

  endpoint:
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

  credentials: {
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID,

    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucket =
  process.env.R2_BUCKET_NAME;

function getContentType(filePath) {
  const extension =
    path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".webp":
      return "image/webp";

    case ".jpg":
    case ".jpeg":
      return "image/jpeg";

    case ".png":
      return "image/png";

    case ".gif":
      return "image/gif";

    default:
      return "application/octet-stream";
  }
}

async function getAllFiles(directory) {
  const entries = await fs.readdir(
    directory,
    {
      withFileTypes: true,
    }
  );

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(
      directory,
      entry.name
    );

    if (entry.isDirectory()) {
      const nestedFiles =
        await getAllFiles(fullPath);

      files.push(...nestedFiles);
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function getStorageKey(filePath) {
  return path
    .relative(
      uploadsRoot,
      filePath
    )
    .replaceAll("\\", "/");
}

async function objectExists(key) {
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return true;
  } catch (error) {
    if (
      error?.$metadata?.httpStatusCode ===
        404 ||
      error?.name === "NotFound"
    ) {
      return false;
    }

    throw error;
  }
}

async function uploadFile(filePath) {
  const storageKey =
    getStorageKey(filePath);

  if (
    storageKey === ".gitkeep" ||
    storageKey.endsWith("/.gitkeep")
  ) {
    return {
      status: "ignored",
      key: storageKey,
    };
  }

  const exists =
    await objectExists(storageKey);

  if (exists) {
    return {
      status: "skipped",
      key: storageKey,
    };
  }

  const buffer =
    await fs.readFile(filePath);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: buffer,

      ContentType:
        getContentType(filePath),

      CacheControl:
        "public, max-age=31536000, immutable",
    })
  );

  return {
    status: "uploaded",
    key: storageKey,
  };
}

async function migrate() {
  console.log("");
  console.log(
    "🚀 Starting Afaai Guide image migration..."
  );
  console.log(
    `📁 Source: ${uploadsRoot}`
  );
  console.log(
    `☁️ Bucket: ${bucket}`
  );
  console.log("");

  let files;

  try {
    files =
      await getAllFiles(
        uploadsRoot
      );
  } catch (error) {
    console.error(
      "❌ Could not read uploads directory:",
      error.message
    );

    process.exit(1);
  }

  console.log(
    `🔎 Found ${files.length} local files.`
  );
  console.log("");

  let uploaded = 0;
  let skipped = 0;
  let ignored = 0;
  let failed = 0;

  for (let index = 0;
    index < files.length;
    index += 1
  ) {
    const filePath =
      files[index];

    const storageKey =
      getStorageKey(filePath);

    try {
      const result =
        await uploadFile(
          filePath
        );

      if (
        result.status ===
        "uploaded"
      ) {
        uploaded += 1;

        console.log(
          `✅ [${index + 1}/${files.length}] ${storageKey}`
        );
      }

      if (
        result.status ===
        "skipped"
      ) {
        skipped += 1;

        console.log(
          `⏭️ [${index + 1}/${files.length}] Already exists: ${storageKey}`
        );
      }

      if (
        result.status ===
        "ignored"
      ) {
        ignored += 1;
      }
    } catch (error) {
      failed += 1;

      console.error(
        `❌ Failed: ${storageKey}`
      );

      console.error(
        error.message
      );
    }
  }

  console.log("");
  console.log(
    "================================="
  );

  console.log(
    "Migration finished"
  );

  console.log(
    "================================="
  );

  console.log(
    `✅ Uploaded: ${uploaded}`
  );

  console.log(
    `⏭️ Already existed: ${skipped}`
  );

  console.log(
    `📄 Ignored: ${ignored}`
  );

  console.log(
    `❌ Failed: ${failed}`
  );

  console.log(
    "================================="
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

migrate().catch((error) => {
  console.error(
    "❌ Migration crashed:",
    error
  );

  process.exit(1);
});