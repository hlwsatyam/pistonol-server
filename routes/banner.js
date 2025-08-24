const express = require("express");
const Banner = require("../models/Banner");
const { check, validationResult } = require("express-validator");

const router = express.Router();

// Get all banners
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get active banners
router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const activeBanners = await Banner.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    res.json(activeBanners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get banner by ID
router.get("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create banner
router.post(
  "/",
  [
    check("title", "Title is required").not().isEmpty(),
    check("imageUrl", "Image URL is required").not().isEmpty(),
    check("publicId", "Public ID is required").not().isEmpty(),
    check("startDate", "Start date is required").not().isEmpty(),
    check("endDate", "End date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(req.body);
    try {
      const banner = new Banner({
        title: req.body.title,
        imageUrl: req.body.imageUrl,
        publicId: req.body.publicId,
        targetAudience: req?.body?.targetAudience || "all",
        link: req.body.link,
        isActive: req.body.isActive || false,
        position: req.body.position || "top",
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      });

      const newBanner = await banner.save();
      res.status(201).json(newBanner);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// Update banner
router.put("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Update fields
    banner.title = req.body.title || banner.title;
    banner.targetAudience = req.body.targetAudience || banner.targetAudience;
    banner.imageUrl = req.body.imageUrl || banner.imageUrl;
    banner.publicId = req.body.publicId || banner.publicId;
    banner.link = req.body.link || banner.link;
    banner.isActive =
      req.body.isActive !== undefined ? req.body.isActive : banner.isActive;
    banner.position = req.body.position || banner.position;
    banner.startDate = req.body.startDate || banner.startDate;
    banner.endDate = req.body.endDate || banner.endDate;
    banner.updatedAt = Date.now();

    const updatedBanner = await banner.save();
    res.json(updatedBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete banner
router.delete("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    await banner.deleteOne();
    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle banner status
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    banner.updatedAt = Date.now();
    await banner.save();

    res.json({
      message: `Banner ${banner.isActive ? "activated" : "deactivated"}`,
      banner,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
