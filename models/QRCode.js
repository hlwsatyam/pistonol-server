const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: [true, "Please add a value"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  scannedAt: {
    type: Date, // <-- Add this line
    default: null,
  },

  uniqueCode: {
    type: String,
    required: [true, "Please add a uniqueCode"],
  },
  client: {
    type: String,
    default: "customer",
  },
  batchNumber: {
    type: String,
    required: [true, "Please add a batch number"],
  },
  quantity: {
    type: Number,
    required: [true, "Please specify quantity"],
  },
  status: {
    type: String,
    enum: ["active", "used", "inactive"],
    default: "active",
  },
  imageUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QRCode", qrCodeSchema);
