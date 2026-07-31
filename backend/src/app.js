const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const speciesRoutes = require("./routes/speciesRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Afaai Guide API is running",
  });
});

app.use("/api/species", speciesRoutes);
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use(errorHandler);

module.exports = app;