const path = require("path");
const express = require("express");
const cors = require("cors");

const errorHandler = require(
  "./middleware/errorHandler"
);

const authRoutes = require(
  "./routes/authRoutes"
);

const chatRoutes = require(
  "./routes/chatRoutes"
);

const expertRoutes = require(
  "./routes/expertRoutes"
);

const speciesRoutes = require(
  "./routes/speciesRoutes"
);

const contentRoutes = require(
  "./routes/contentRoutes"
);

const app = express();

const uploadsDirectory =
  path.resolve(
    __dirname,
    "../uploads"
  );

app.use(cors());

app.use(express.json());

/*
 * أولًا نحاول خدمة الصور القديمة
 * الموجودة محليًا.
 *
 * fallthrough = true مهم جدًا:
 * لو الملف غير موجود محليًا ننتقل
 * إلى R2 بدل إرجاع 404 مباشرة.
 */
app.use(
  "/uploads",
  express.static(
    uploadsDirectory,
    {
      fallthrough: true,
      maxAge: "1d",
      immutable: false,
    }
  )
);

/*
 * الصور الجديدة موجودة على R2.
 *
 * الـFrontend الحالي يستطيع الاستمرار
 * باستعمال:
 *
 * /uploads/storage-key
 *
 * بدون أي تعديل عليه.
 */
app.use(
  "/uploads",
  (req, res) => {
    const publicBaseUrl =
      process.env.R2_PUBLIC_URL
        ?.trim()
        .replace(/\/+$/, "");

    if (!publicBaseUrl) {
      return res.status(404).json({
        success: false,
        message:
          "Image not found",
      });
    }

    const storageKey =
      req.path
        .replace(/^\/+/, "");

    if (!storageKey) {
      return res.status(404).json({
        success: false,
        message:
          "Image not found",
      });
    }

    const objectUrl =
      `${publicBaseUrl}/${storageKey}`;

    return res.redirect(
      302,
      objectUrl
    );
  }
);

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Afaai Guide API is running",
    });
  }
);

app.use(
  "/api/species",
  speciesRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);

app.use(
  "/api/expert",
  expertRoutes
);

app.use(
  "/api/content",
  contentRoutes
);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message:
      "API route not found",
  });
});

app.use(errorHandler);

module.exports = app;