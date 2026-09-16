const express = require('express');
const router = express.Router();
const multer = require('multer');
const Category = require('../models/category'); 
const checkRole = require('../middleware/checkRole');
const authMiddleware = require('../middleware/authmiddleware');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/category');
    },
    filename: (req, file, cb) => {
        const timeStamp = Date.now();
        const originalName = file.originalname
            .replace(/\s+/g, '-')       
            .replace(/[^a-zA-Z0-9.-]/g, ''); 
        cb(null, `${timeStamp}-${originalName}`);
    }
});


const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, and PNG images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } 
});

// POST route
router.post("/",authMiddleware, checkRole(["admin"]), upload.single("image"), async (req, res) => {
    try {
        if (!req.body.name || !req.file) {
            return res.status(400).json({ message: "Name and image are required" });
        }

        const newCategory = new Category({
            name: req.body.name,
            image: req.file.filename
        });

        await newCategory.save();

        res.status(201).json({
            message: "Category created successfully",
            category: newCategory
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort("name");
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
