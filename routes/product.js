const express = require("express");
const authMiddleware = require("../middleware/authmiddleware");
const checkRole = require("../middleware/checkRole");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const Product = require("../models/product");
const User = require("../models/users");
const Category = require("../models/category");
const product = require("../models/product");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products");
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
      new Error(
        "Invalid file type. Only JPEG, JPG, and PNG images are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

router.get('/suggestions', async (req, res) => {
  const search = req.query.search;
  const products = await Product.find(
    { title: { $regex: search, $options: 'i' } },
  ).select("_id title").limit(10);

  res.json(products);
});
router.post(
  "/",
  authMiddleware,
  checkRole("seller"),
  upload.array("images", 8),
  async (req, res) => {
    const { title, description, category, price, stock } = req.body;
    const images = req.files.map((file) => file.filename);

    if (images.length == 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    const newProduct = new Product({
      title,
      description,
      category,
      price,
      stock,
      images,
      seller: req.user._id,
    });
    await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  }
);

router.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 8;
    const querySearch = req.query.search || "";
    let query = {};
    if (req.query.category) {
      const category = await Category.findOne({ name: req.query.category });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      query.category = category._id;
    }
    if (querySearch) {
      query.title = { $regex: querySearch, $options: "i" };
    }

    const products = await Product.find(query)
      .select("-description -category -seller -__v")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const updatedProducts = products.map((product) => {
      const numberOfReviews = product.review?.length || 0;
      const sumOfRatings =
        product.review?.reduce((total, review) => total + review.rating, 0) ||
        0;

      return {
        ...product,
        images: product.images[0],
        reviews: {
          numberOfReviews,
          averageRating:
            numberOfReviews > 0 ? sumOfRatings / numberOfReviews : 0,
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

});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  const product = await Product.findById(id)
    .populate("seller", "_id username email")
    .populate("review.user", "_id username email")
    .select("-category -__v").lean();

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
});

router.delete("/:id", authMiddleware, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        const fullPath = path.join(__dirname, "../uploads/products", image);
        console.log("Deleting:", fullPath);

          await fs.unlink(fullPath);
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully" });
});

module.exports = router;
