// scripts/createTestUser.js
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

connectDB();
const createUser = async () => {
  const user = new User({
    email: "admin@zeelab.com",
    password: "password123",
  });
  await user.save();

  console.log("User created ✅");
  await mongoose.disconnect();
};
const createSuperAdmin = async () => {
  const user = new User({
    email: "admin@zeelab.com",
    password: "password123",
  });
  await user.save();

  console.log("User created ✅");
  await mongoose.disconnect();
};
const findUser = async () => {
  const allData = await User.find();
  console.log(allData);
  await mongoose.disconnect();
};
const deleteUser = async () => {
  const allData = await User.deleteMany();
  console.log(allData);
  await mongoose.disconnect();
};

// createUser();
createSuperAdmin();
//  findUser();
//  deleteUser();
