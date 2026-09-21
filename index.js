require("dotenv").config();
require("./config/passport");
const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const winston = require("winston");
const cors = require("cors");

// Ensure upload & log directories exist
const categoryUploadDir = path.join(__dirname, "uploads/category");
const productUploadDir = path.join(__dirname, "uploads/products");
const logsDir = path.join(__dirname, "logs");

[categoryUploadDir, productUploadDir, logsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const productRoutes = require("./routes/product");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const setupSwagger = require("./config/swagger");

const app = express();

// Mount Swagger Documentation
setupSwagger(app);


const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ level: "debug" }),
    new winston.transports.File({ filename: "logs/mylogs.log", level: "error" }),
  ],
});

// Global Process Exception Handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  logger.error("Uncaught Exception", { message: err.message, stack: err.stack });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  logger.error("Unhandled Rejection", {
    message: err ? err.message : "Unknown Rejection",
    stack: err ? err.stack : "",
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use("/uploads/category", express.static("uploads/category"));
app.use("/uploads/products", express.static("uploads/products"));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error-Handling Middleware
app.use((error, req, res, next) => {
  logger.error(error.message || "Internal Server Error", {
    method: req.method,
    path: req.originalUrl,
    stack: error.stack,
  });
  res.status(error.status || 500).json({ message: error.message || "Internal Server Error!" });
});

// Database Connection & Server Listener
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cartwish";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection error", { message: err.message, stack: err.stack });
    console.error("⚠️ Failed to connect to MongoDB. Starting HTTP server in degraded mode...");
    app.listen(PORT, () => {
      console.log(`⚠️ Server running on http://localhost:${PORT} (MongoDB Disconnected)`);
    });
  });

module.exports = app;
