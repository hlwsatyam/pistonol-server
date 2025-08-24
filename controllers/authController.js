const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rolePermissions = require("../config/roleAccess");
const sendEmail = require("../service/emailService");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = password === user.password;
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerify) {
      // 1. Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000); // ensures 6-digit number

      // 2. Save OTP to user model
      user.otp = otp;
      await user.save();
      console.log(user);
      // 3. Prepare email
      const mailOptions = {
        from: `"DIGINIA Pay" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: "OTP Sent to Your Mobile Number",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verification Required</h2>
        <p>Dear ${user.name || "User"},</p>
        <p>We’ve sent a One-Time Password (OTP) to your registered mobile number ending with ****${user.phone?.slice(
          -4
        )}.</p>
        <p>Please enter the OTP on the screen to verify your account and proceed.</p>
        <p>If you did not request this, please ignore this message.</p>
        <br/>
        <p>Thanks,<br/>Team DIGINIA Pay</p>
      </div>
    `,
      };

      // 4. Send email
      await sendEmail(mailOptions);

      // 5. Return response
      return res.status(201).json({
        user,
        message: "OTP sent to your mobile. Please verify to continue.",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:
        (parseInt(process.env.COOKIE_EXPIRE_DAYS) || 7) * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
      isVerify:user.isVerify,
        _id: user._id,
        username: user.username,
        role: user.role,
        wallet: user.wallet,
        permissions: rolePermissions[user.role] || [],
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.register = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const newUser = await User.create({
      username,
      password,
      role,
      wallet: 0, // default wallet balance
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        wallet: newUser.wallet,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
