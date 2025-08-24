const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');


 


exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // नई वाले पहले
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// नया प्रोडक्ट बनाएं
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
     
    // इमेजेस की जानकारी स्टोर करें
    const images = req.files?.map(file => ({
      path: file.path,
      filename: file.filename
    }));

    const product = new Product({
     ...req.body
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    // अगर एरर आए तो अपलोड की हुई फाइल्स डिलीट करें
    req.files?.forEach(file => {
      fs.unlinkSync(file.path);
    });
    res.status(500).json({ message: error.message });
  }
};

// प्रोडक्ट अपडेट करें
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      // अगर प्रोडक्ट नहीं मिला तो नई फाइल्स डिलीट करें
      req.files?.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({ message: 'Product not found' });
    }

    // नई इमेजेस जोड़ें
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        path: file.path,
        filename: file.filename
      }));
      product.images = [...product.images, ...newImages];
    }

    // अन्य फील्ड्स अपडेट करें
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock || product.stock;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    req.files?.forEach(file => {
      fs.unlinkSync(file.path);
    });
    res.status(500).json({ message: error.message });
  }
};

// इमेज डिलीट करें
exports.deleteImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // डिलीट होने वाली इमेज ढूंढें
    const imageToDelete = product.images[req.params.imageIndex];
    if (!imageToDelete) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // फाइल सिस्टम से डिलीट करें
    fs.unlinkSync(imageToDelete.path);

    // इमेज को प्रोडक्ट से हटाएं
    product.images.splice(req.params.imageIndex, 1);
    await product.save();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// प्रोडक्ट डिलीट करें
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // सभी इमेज फाइल्स डिलीट करें
    product.images.forEach(image => {
      try {
        fs.unlinkSync(image.path);
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    });

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};