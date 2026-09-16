require("dotenv").config();
require("./config/passport");
require("winston-mongodb");
const express = require("express");
const mongoose = require("mongoose");
const winston = require("winston");

const productRoutes = require("./routes/product");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const app = express();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ level: "debug" }),
    new winston.transports.File({ filename: "logs/mylogs.log", level: "error" }),
    new winston.transports.MongoDB({
      db: "mongodb://localhost:27017/cartwish",
      collection: "logs",
      level: "error",
      options: { useUnifiedTopology: true },
    }),
  ],
});

// Global process error handlers
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { message: err.message, stack: err.stack });

  setTimeout(() => process.exit(1), 2000);
});
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", { message: err.message, stack: err.stack });

  // Wait a short time before exit so MongoDB transport can write
  setTimeout(() => process.exit(1), 2000);
});




app.use(express.json());

// Static uploads
app.use("/uploads/category", express.static("uploads/category"));
app.use("/uploads/products", express.static("uploads/products"));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/cart", cartRoutes);

// Error-handling middleware
app.use((error, req, res, next) => {
  logger.error(error.message, {
    method: req.method,
    path: req.originalUrl,
    stack: error.stack,
  });
  res.status(500).json({ message: "Internal Server Error!" });
});

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/cartwish")
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => {
    logger.error("MongoDB connection error", { message: err.message, stack: err.stack });
    logger.on("finish", () => process.exit(1));
    logger.close();
  });

// Start server
app.listen(3000, () => {
  logger.info("Server is running on port 3000");
});
