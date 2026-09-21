require("dotenv").config();
require("./config/passport");
const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const winston = require("winston");
const cors = require("cors");

// Ensure upload & log directories exist (local development only)
if (!process.env.VERCEL) {
  try {
    const categoryUploadDir = path.join(__dirname, "uploads/category");
    const productUploadDir = path.join(__dirname, "uploads/products");
    const logsDir = path.join(__dirname, "logs");

    [categoryUploadDir, productUploadDir, logsDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  } catch (err) {
    console.warn("⚠️ Notice: Could not create local directory:", err.message);
  }
}

const productRoutes = require("./routes/product");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const setupSwagger = require("./config/swagger");
const connectDB = require("./config/db");

const app = express();

// Mount Swagger Documentation
setupSwagger(app);

// Winston logger setup (safe for serverless read-only filesystem)
const loggerTransports = [
  new winston.transports.Console({ level: "debug" }),
];

if (!process.env.VERCEL) {
  try {
    loggerTransports.push(
      new winston.transports.File({ filename: "logs/mylogs.log", level: "error" })
    );
  } catch (err) {
    console.warn("⚠️ File logging disabled:", err.message);
  }
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: loggerTransports,
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

// Serverless DB Connection Middleware (connects on-demand for API endpoints)
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api") && req.path !== "/api/health") {
    try {
      await connectDB();
    } catch (err) {
      logger.error("Database connection failure on request", {
        path: req.originalUrl,
        error: err.message,
      });
    }
  }
  next();
});

// Static uploads (uses /tmp on Vercel)
const categoryStaticPath = process.env.VERCEL
  ? path.join("/tmp", "uploads/category")
  : "uploads/category";
const productStaticPath = process.env.VERCEL
  ? path.join("/tmp", "uploads/products")
  : "uploads/products";

app.use("/uploads/category", express.static(categoryStaticPath));
app.use("/uploads/products", express.static(productStaticPath));

// Root Welcome Route (friendly status endpoint for base URL)
app.get("/", (req, res) => {
  res.status(200).json({
    name: "CartWish E-Commerce API",
    status: "online",
    documentation: "/api-docs",
    health: "/api/health",
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: "OK",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
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

// Server Listener (Runs only in standalone / local development, NOT on Vercel)
const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL && require.main === module) {
  connectDB()
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
}

module.exports = app;
