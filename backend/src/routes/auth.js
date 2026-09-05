const express = require("express");
const router = express.Router();
const { registerUser, loginUser, AuthError, VALID_ROLES } = require("../services/authService");
const { requireAuth } = require("../middleware/auth");

router.get("/roles", (req, res) => {
  res.json({ roles: VALID_ROLES });
});

router.post("/register", (req, res) => {
  try {
    const user = registerUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post("/login", (req, res) => {
  try {
    const result = loginUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/** GET /api/auth/me — returns the currently logged-in user (sanity check for the frontend) */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
