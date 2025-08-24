const mongoose = require("mongoose");

const marqueeSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  targetAudience: {
    type: String,
    default: "All",
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Marquee = mongoose.model("Marquee", marqueeSchema);

module.exports = Marquee;
