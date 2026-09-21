const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/users");
const jwt = require("jsonwebtoken");

// Google Login
router.get("/google", passport.authenticate("google", { scope: ["email", "profile"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    try {
      const profile = req.user;
      const token = await handleOAuthCallback(profile, "googleId");
      res.redirect(`http://localhost:3000/login?token=${token}`);
    } catch (err) {
      console.error("Google Auth Error:", err);
      res.status(500).json({ message: "Google Auth Failed" });
    }
  }
);

// Facebook Login
router.get("/facebook", passport.authenticate("facebook", { scope: ["public_profile", "email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    try {
      const profile = req.user;
      const token = await handleOAuthCallback(profile, "facebookId");
      res.redirect(`http://localhost:3000/login?token=${token}`);
    } catch (err) {
      console.error("Facebook Auth Error:", err);
      res.status(500).json({ message: "Facebook Auth Failed" });
    }
  }
);

// Reusable function for Google & Facebook
const handleOAuthCallback = async (profile, providerId) => {
  const email = profile.emails?.[0]?.value || profile.email;
  let user = await User.findOne({
    $or: [
      ...(email ? [{ email: email.toLowerCase() }] : []),
      { [providerId]: profile.id },
    ],
  });

  if (user) {
    if (!user[providerId]) {
      user[providerId] = profile.id;
      await user.save();
    }
  } else {
    user = new User({
      username: profile.displayName || profile.name?.givenName || "OAuthUser",
      email: email ? email.toLowerCase() : `${profile.id}@oauth.user`,
      [providerId]: profile.id,
      roles: ["user"],
    });
    await user.save();
  }

  // Generate JWT
  const token = jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    },
    process.env.JWT_KEY || "default_secret",
    { expiresIn: "1d" }
  );

  return token;
};

module.exports = router;
