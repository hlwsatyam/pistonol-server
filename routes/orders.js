const express = require("express");
const router = express.Router();
const mongoose=require("mongoose")
const Order = require("../models/Order");
const Product = require("../models/Product");

// Dealer creates an order
router.post("/", async (req, res) => {
  try {
    const { products } = req.body;
    console.log( req.body)
    // Validate products and calculate total
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < parseInt(item.quantity)) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        priceAtOrder: product.price,
      });
    }

    const order = await Order.create({
      dealer: req.body.dealerId,

      products: orderProducts,
      totalAmount,
      status: "pending",
    });

    res.status(201).json(order);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message:error.message ||  "Server error" });
  }
});

// Company gets pending orders
router.get("/company/pending", async (req, res) => {
  try {
    const orders = await Order.find({
      company: req.user.id,
      status: "pending",
    }).populate("dealer", "name businessName");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Company approves/rejects order
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, companyMessage, paymentMethod } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.company.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    order.status = status;
    order.companyMessage = companyMessage;

    if (status === "approved") {
      order.paymentMethod = paymentMethod;

      // Deduct stock if approved
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Dealer gets their orders
router.get("/dealer/my-orders", async (req, res) => {
  try {
    const orders = await Order.find({ dealer: req.user.id })
      .populate("company", "businessName")
      .sort("-createdAt");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});















router.get('/dealer', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, startDate, endDate, _id } = req.query;

    // Validate inputs
    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: 'Valid dealer ID is required' });
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build aggregation pipeline
    const pipeline = [
      { $match: { dealer:new mongoose.Types.ObjectId(_id) } },
      
      // Status filter
      ...(status ? [{ $match: { status } }] : []),
      
      // Date range filter
      ...(startDate && endDate ? [{
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      }] : []),
      
      // Search filter
      ...(search ? [{
        $match: {
          $or: [
            { _id: { $regex: search, $options: 'i' } },
            { 'products.product.name': { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),
      
      // Lookup products
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'products.productDetails'
        }
      },
      { $unwind: { path: '$products.productDetails', preserveNullAndEmptyArrays: true } },
      
      // Group back
      {
        $group: {
          _id: '$_id',
          root: { $first: '$$ROOT' },
          products: { $push: '$products' }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$root', { products: '$products' }]
          }
        }
      },
      
      // Lookup company
      {
        $lookup: {
          from: 'users',
          localField: 'company',
          foreignField: '_id',
          as: 'companyDetails' 
        }
      },
      { $unwind: { path: '$companyDetails', preserveNullAndEmptyArrays: true } },
      
      // Pagination
      { $skip: skip },
      { $limit: limitNumber },
      
      // Count total (using facet)
      {
        $facet: {
          orders: [],
          total: [{ $count: 'count' }]
        }
      },
      { $unwind: '$total' }
    ];

    const result = await Order.aggregate(pipeline);
    
    const orders = result[0]?.orders || [];
    const total = result[0]?.total?.count || 0;

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });

  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});
 






module.exports = router;
