const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /api/customer - Get all customers with pagination, search, and sort
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", sortField = "createdAt", sortOrder = "desc" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build the search query
    const searchQuery = search ? {
      $or: [
        { username: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ],
    } : {};

    const query = { role: "customer", ...searchQuery };

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get customers with sorting, skipping, and limiting
    const customers = await User.find(query)
      .sort({ [sortField]: sortOrder === "ascend" ? 1 : -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      data: customers,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/customer/:id - Get a single customer by ID
router.get("/:id", async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
