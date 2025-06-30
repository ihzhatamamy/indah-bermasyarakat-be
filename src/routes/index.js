const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const userRoutes = require("./users");

// Auth routes
router.use("/auth", authRoutes);

// User routes
router.use("/users", userRoutes);

router.use("/test", (req, res) => {
  res.status(200).send("API Success");
});

// Tambahkan routes lainnya di sini

module.exports = router;
