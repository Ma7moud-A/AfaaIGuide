const path = require("path");
const express = require("express");
const cors = require("cors");

const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const expertRoutes = require("./routes/expertRoutes");
const speciesRoutes = require("./routes/speciesRoutes");
const contentRoutes = require("./routes/contentRoutes");

const app = express();

const uploadsDirectory = path.resolve(
  __dirname,
  "../uploads"
);

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(uploadsDirectory, {
    fallthrough: false,
    maxAge: "1d",
    immutable: false,
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Afaai Guide API is running",
  });
});

app.use("/api/species", speciesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/expert", expertRoutes);
app.use("/api/content", contentRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use(errorHandler);

module.exports = app;