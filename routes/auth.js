const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/users");
const jwt = require("jsonwebtoken");

const clientRedirectUrl = (token) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/login?token=${token}`;
};

// Google Login
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      message:
        "Google OAuth is not configured on this server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  }
  passport.authenticate("google", { scope: ["email", "profile"] })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ message: "Google OAuth is not configured." });
    }
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/login",
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const profile = req.user;
      const token = await handleOAuthCallback(profile, "googleId");
      res.redirect(clientRedirectUrl(token));
    } catch (err) {
      console.error("Google Auth Error:", err);
      res.status(500).json({ message: "Google Auth Failed" });
    }
  }
);

// Facebook Login
router.get("/facebook", (req, res, next) => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return res.status(503).json({
      message:
        "Facebook OAuth is not configured on this server. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.",
    });
  }
  passport.authenticate("facebook", { scope: ["public_profile", "email"] })(req, res, next);
});

router.get(
  "/facebook/callback",
  (req, res, next) => {
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      return res.status(503).json({ message: "Facebook OAuth is not configured." });
    }
    passport.authenticate("facebook", {
      session: false,
      failureRedirect: "/login",
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const profile = req.user;
      const token = await handleOAuthCallback(profile, "facebookId");
      res.redirect(clientRedirectUrl(token));
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
