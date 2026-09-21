const express = require("express");
const router = express.Router();
const User = require("../models/users");
const bcrypt = require("bcrypt");
const joi = require("joi");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authmiddleware");

// Validation schemas
const createUserSchema = joi.object({
  username: joi.string().min(3).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
  deliveryAddress: joi.string().min(5).optional().allow(""),
  roles: joi.array().items(joi.string().valid("user", "seller", "admin")).optional(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

const updateProfileSchema = joi.object({
  username: joi.string().min(3).optional(),
  deliveryAddress: joi.string().min(5).optional(),
});

// Generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    },
    process.env.JWT_KEY || "default_secret",
    { expiresIn: "1d" }
  );
}

// Handler for user registration (signup / register / signin)
const handleRegister = async (req, res) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, email, password, deliveryAddress, roles } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      deliveryAddress: deliveryAddress || "",
      roles: roles && roles.length > 0 ? roles : ["user"],
    });

    await newUser.save();

    const token = generateToken(newUser);
    const { password: _, ...userData } = newUser.toObject();

    res.status(201).json({
      message: "User registered successfully",
      data: userData,
      token,
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Signup / Register / Signin routes
router.post("/signup", handleRegister);
router.post("/register", handleRegister);
router.post("/signin", handleRegister);

// ========== LOGIN ==========
router.post("/login", async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses social login (Google/Facebook). Please sign in via OAuth.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);
    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "User logged in successfully",
      data: userData,
      token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ========== GET PROFILE ==========
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

// ========== UPDATE PROFILE ==========
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.deliveryAddress !== undefined) updates.deliveryAddress = req.body.deliveryAddress;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", data: user });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

module.exports = router;
