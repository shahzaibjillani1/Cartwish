const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const Category = require("../models/category");
const checkRole = require("../middleware/checkRole");
const authMiddleware = require("../middleware/authmiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/category");
  },
  filename: (req, file, cb) => {
    const timeStamp = Date.now();
    const originalName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");
    cb(null, `${timeStamp}-${originalName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, JPG, and PNG images are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

// POST create category (Admin only)
router.post(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.body.name || !req.file) {
        return res.status(400).json({ message: "Name and image are required" });
      }

      const existingCategory = await Category.findOne({ name: req.body.name });
      if (existingCategory) {
        return res.status(400).json({ message: "Category with this name already exists" });
      }

      const newCategory = new Category({
        name: req.body.name,
        image: req.file.filename,
      });

      await newCategory.save();

      res.status(201).json({
        message: "Category created successfully",
        category: newCategory,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort("name");
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single category by ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update category (Admin only)
router.put(
  "/:id",
  authMiddleware,
  checkRole(["admin"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      if (req.body.name) {
        category.name = req.body.name;
      }

      if (req.file) {
        // Delete old image if present
        if (category.image) {
          const oldPath = path.join(__dirname, "../uploads/category", category.image);
          try {
            await fs.unlink(oldPath);
          } catch (e) {
            // Ignore if file doesn't exist
          }
        }
        category.image = req.file.filename;
      }

      await category.save();
      res.status(200).json({ message: "Category updated successfully", category });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE category (Admin only)
router.delete("/:id", authMiddleware, checkRole(["admin"]), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.image) {
      const imgPath = path.join(__dirname, "../uploads/category", category.image);
      try {
        await fs.unlink(imgPath);
      } catch (e) {
        // Ignore if file doesn't exist
      }
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
