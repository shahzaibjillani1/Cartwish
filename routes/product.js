const express = require("express");
const authMiddleware = require("../middleware/authmiddleware");
const checkRole = require("../middleware/checkRole");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const Product = require("../models/product");
const Category = require("../models/category");
const router = express.Router();

const uploadDirectory = process.env.VERCEL
  ? path.join("/tmp", "uploads/products")
  : "uploads/products";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const fsSync = require("fs");
      if (!fsSync.existsSync(uploadDirectory)) {
        fsSync.mkdirSync(uploadDirectory, { recursive: true });
      }
    } catch (err) {}
    cb(null, uploadDirectory);
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
    cb(
      new Error("Invalid file type. Only JPEG, JPG, and PNG images are allowed."),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

// GET search suggestions
router.get("/suggestions", async (req, res) => {
  try {
    const search = req.query.search;
    if (!search || typeof search !== "string" || search.trim() === "") {
      return res.json([]);
    }

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const products = await Product.find({
      title: { $regex: safeSearch, $options: "i" },
    })
      .select("_id title")
      .limit(10);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new product (Seller or Admin)
router.post(
  "/",
  authMiddleware,
  checkRole(["seller", "admin"]),
  upload.array("images", 8),
  async (req, res) => {
    try {
      const { title, description, category, price, stock } = req.body;

      if (!title || !description || !category || price === undefined || stock === undefined) {
        return res.status(400).json({ message: "All product fields are required" });
      }

      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ message: "At least one image is required" });
      }

      const images = files.map((file) => file.filename);

      const newProduct = new Product({
        title,
        description,
        category,
        price: Number(price),
        stock: Number(stock),
        images,
        seller: req.user._id,
      });

      await newProduct.save();

      res.status(201).json({
        message: "Product created successfully",
        product: newProduct,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET all products with filtering & pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 8;
    const querySearch = req.query.search || "";
    let query = {};

    if (req.query.category) {
      const categoryDoc = await Category.findOne({
        $or: [{ name: req.query.category }, { _id: req.query.category.match(/^[0-9a-fA-F]{24}$/) ? req.query.category : null }],
      });

      if (!categoryDoc) {
        return res.status(404).json({ message: "Category not found" });
      }
      query.category = categoryDoc._id;
    }

    if (querySearch) {
      const safeSearch = querySearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.title = { $regex: safeSearch, $options: "i" };
    }

    const products = await Product.find(query)
      .populate("category", "_id name")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const updatedProducts = products.map((prod) => {
      const reviews = prod.reviews || [];
      const numberOfReviews = reviews.length;
      const sumOfRatings = reviews.reduce((total, r) => total + r.rating, 0);

      return {
        ...prod,
        firstImage: prod.images ? prod.images[0] : null,
        reviewsSummary: {
          numberOfReviews,
          averageRating:
            numberOfReviews > 0 ? parseFloat((sumOfRatings / numberOfReviews).toFixed(1)) : 0,
        },
      };
    });

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);

    res.status(200).json({
      products: updatedProducts,
      totalProducts,
      totalPages,
      currentPage: page,
      perPage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single product by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findById(id)
      .populate("seller", "_id username email")
      .populate("category", "_id name")
      .populate("reviews.user", "_id username email")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = product.reviews || [];
    const numberOfReviews = reviews.length;
    const sumOfRatings = reviews.reduce((total, r) => total + r.rating, 0);
    const averageRating =
      numberOfReviews > 0 ? parseFloat((sumOfRatings / numberOfReviews).toFixed(1)) : 0;

    res.json({
      ...product,
      averageRating,
      numberOfReviews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST review on product
router.post("/:id/review", authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed
    const existingReviewIndex = product.reviews.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReviewIndex !== -1) {
      // Update review
      product.reviews[existingReviewIndex].rating = numRating;
      product.reviews[existingReviewIndex].comment = comment;
      product.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      // Add review
      product.reviews.push({
        user: req.user._id,
        rating: numRating,
        comment,
      });
    }

    await product.save();

    res.status(200).json({
      message: "Review added/updated successfully",
      reviews: product.reviews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update product (Seller or Admin)
router.put(
  "/:id",
  authMiddleware,
  checkRole(["seller", "admin"]),
  upload.array("images", 8),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check ownership unless admin
      if (!req.user.roles.includes("admin") && product.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only edit your own products" });
      }

      const { title, description, category, price, stock } = req.body;

      if (title) product.title = title;
      if (description) product.description = description;
      if (category) product.category = category;
      if (price !== undefined) product.price = Number(price);
      if (stock !== undefined) product.stock = Number(stock);

      if (req.files && req.files.length > 0) {
        // Replace images with new files
        const newImages = req.files.map((f) => f.filename);

        // Delete old image files
        for (const oldImg of product.images) {
          const fullPath = path.join(__dirname, "../uploads/products", oldImg);
          try {
            await fs.unlink(fullPath);
          } catch (e) {
            // Ignore missing files
          }
        }

        product.images = newImages;
      }

      await product.save();

      res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE product (Seller or Admin)
router.delete(
  "/:id",
  authMiddleware,
  checkRole(["seller", "admin"]),
  async (req, res) => {
    try {
      const id = req.params.id;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check ownership unless admin
      if (!req.user.roles.includes("admin") && product.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only delete your own products" });
      }

      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          const fullPath = path.join(__dirname, "../uploads/products", image);
          try {
            await fs.unlink(fullPath);
          } catch (e) {
            // Ignore missing files
          }
        }
      }

      await Product.findByIdAndDelete(id);

      res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
