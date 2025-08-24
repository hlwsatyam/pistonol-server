const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/authController");

router.post("/login", login);
router.post("/register", register);

const {
  registerUser,
  sendOtp,
  getUsers,
  deleteUser,
  verify,
  getUserById,
  profile,
  updateUser,
  statusChange,
  passChange,
} = require("../controllers/userController");

router.post("/", registerUser);

router.get("/byrole/:role", getUsers);
router.route("/otp/send-otp").post(sendOtp);
router.route("/otp/verify").post(verify);
router.route("/users/profile").put(profile);
router.patch("/verify/:id", statusChange);
router.patch("/change-password/:id", passChange);
router.route("/:id").delete(deleteUser).get(getUserById).put(updateUser);

module.exports = router;
