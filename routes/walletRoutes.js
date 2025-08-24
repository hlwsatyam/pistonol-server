
// routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController.js');

router.post('/transfer', walletController.transferFunds);

module.exports = router;