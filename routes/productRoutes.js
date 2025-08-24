const express = require("express");
const router = express.Router();
const upload = require('../middleware/upload');
const {
  
  createProduct,
  deleteProduct,
 
  updateProduct,
  deleteImage,
  getAllProducts,
  getSingleProduct
} = require("../controllers/productController");

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get("/", getAllProducts);

// @route   POST /api/products
// @desc    Create new product with images
// @access  Private/Admin
router.post("/", 
  upload.array('images', 5), // अधिकतम 5 इमेजेस
  createProduct
);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get("/:id", getSingleProduct);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put("/:id",
  upload.array('images', 5), // अधिकतम 5 नई इमेजेस
  updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete product and its images
// @access  Private/Admin
router.delete("/:id", deleteProduct);

// @route   DELETE /api/products/:productId/images/:imageIndex
// @desc    Delete specific image from product
// @access  Private/Admin
router.delete("/:productId/images/:imageIndex", deleteImage);

module.exports = router;