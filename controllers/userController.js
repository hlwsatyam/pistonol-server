// controllers/userController.js
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const sendEmail = require("../service/emailService");
const now = new Date();
const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Month with leading zero

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_USER,
  },
});

exports.registerUser = async (req, res) => {
  try {
    const { mobile, role, password } = req.body;

    // Check required fields
    if (!mobile || !role || !password) {
      return res.status(400).json({
        message: "Mobile, role and password are required",
      });
    }

    // Generate username based on role
    let username;

    if (role === "distributor") {
      // Find the last distributor count
      const lastDistributor = await User.findOne({ role: "distributor" })
        .sort({ createdAt: -1 })
        .select("username");

      let count = 1;
      if (lastDistributor && lastDistributor.username.startsWith("DIST")) {
        const parts = lastDistributor.username.split("-");
        count = parseInt(parts[parts.length - 1]) + 1;
      }

      username = `DIST-${year}${month}-${count.toString().padStart(4, "0")}`;
    } else if (role === "company-employee") {
      // Find the last employee count
      const lastEmployee = await User.findOne({ role: "company-employee" })
        .sort({ createdAt: -1 })
        .select("username");

      let count = 1;
      if (lastEmployee && lastEmployee.username.startsWith("EMP")) {
        const parts = lastEmployee.username.split("-");
        count = parseInt(parts[parts.length - 1]) + 1;
      }

      username = `EMP-${year}${month}-${count.toString().padStart(4, "0")}`;
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ username }, { mobile }] });
    if (userExists) {
      return res.status(400).json({
        message: "User with this username or mobile already exists",
      });
    }
    console.log(req.body);
    // Create user data
    const userData = {
      username,
      mobile,
      role,
      password,
      // Optional fields
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.email && { email: req.body.email }),
      ...(req.body.panNumber && { panNumber: req.body.panNumber }),
      ...(req.body.aadhaarNumber && { aadhaarNumber: req.body.aadhaarNumber }),
      ...(req.body.address && { address: req.body.address }),
      ...(req.body.businessPan && { businessPan: req.body.businessPan }),
      ...(req.body.businessType && { businessType: req.body.businessType }),
      ...(req.body.businessName && { businessName: req.body.businessName }),
      ...(req.body.state && { state: req.body.state }),
      ...(req.body.district && { district: req.body.district }),
      ...(req.body.pincode && { pincode: req.body.pincode }),
      ...(req.body.photo && { photo: req.body.photo }),
    };

    const user = await User.create(userData);

    // Generate PDF
    const pdfDoc = new PDFDocument();
    const pdfPath = path.join(__dirname, "..", "temp", `${username}.pdf`);
    pdfDoc.pipe(fs.createWriteStream(pdfPath));

    pdfDoc.fontSize(20).text("User Registration Details", { align: "center" });
    pdfDoc.moveDown();

    pdfDoc.fontSize(14).text(`Username: ${user.username}`);
    pdfDoc.text(`Name: ${user.name || "Not provided"}`);
    pdfDoc.text(`Mobile: ${user.mobile}`);
    pdfDoc.text(`Role: ${user.role}`);
    pdfDoc.text(`Email: ${user.email || "Not provided"}`);
    pdfDoc.text(`Business Name: ${user.businessName || "Not provided"}`);
    pdfDoc.text(`Business Type: ${user.businessType || "Not provided"}`);

    pdfDoc.end();

    // Send email with PDF if email is provided
    if (user.email) {
      await new Promise((resolve, reject) => {
        pdfDoc.on("end", async () => {
          try {
            const mailOptions = {
              from: process.env.MAIL_USER,
              to: user.email,
              subject: "Your Registration Details",
              text: `Thank you for registering. Please find your registration details attached.\nUsername: ${user.username}\nPassword: ${password}`,
              attachments: [
                {
                  filename: `${username}_registration.pdf`,
                  path: pdfPath,
                  contentType: "application/pdf",
                },
              ],
            };

            await sendEmail(mailOptions);
            resolve();
          } catch (error) {
            console.error("Email sending error:", error);
            reject(error);
          } finally {
            // Delete the temporary PDF file
            fs.unlink(pdfPath, (err) => {
              if (err) console.error("Error deleting PDF:", err);
            });
          }
        });
      });
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      mobile: user.mobile,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: error.message || "Server error during registration",
    });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res
        .status(400)
        .json({ message: "Valid mobile number is required" });
    }

    // Generate a 6-digit OTP
    const otp = 123456;
    // Save or update OTP in DB (you can save in User or a separate OTP model)
    let user = await User.findOne({ mobile });

    if (!user) {
      const randomDigits = Math.floor(10000 + Math.random() * 90000); // Generates 5-digit number
      const username = `pistonol-${randomDigits}`;

      user = await User.create({
        mobile,
        username,
      });
    }

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send OTP via SMS
    // await sendSms(mobile, `Your OTP is ${otp}`);

    res.status(200).json({ message: "OTP sent successfully", mobile });
  } catch (error) {
    console.error("OTP send error:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error while sending OTP" });
  }
};
exports.verify = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // Validate inputs
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res
        .status(400)
        .json({ message: "Valid mobile number is required" });
    }

    if (!otp || !/^[0-9]{6}$/.test(otp)) {
      return res.status(400).json({ message: "Valid 6-digit OTP is required" });
    }

    // Find user
    const user = await User.findOne({ mobile });

    if (!user) {
      let username;

      const lastEmployee = await User.findOne({ role: "customer" })
        .sort({ createdAt: -1 })
        .select("username");

      let count = 1;
      if (lastEmployee && lastEmployee.username.startsWith("CUS")) {
        const parts = lastEmployee.username.split("-");
        count = parseInt(parts[parts.length - 1]) + 1;
      }

      username = `CUS-${year}${month}-${count.toString().padStart(4, "0")}`;

      const newUser = new User({
        username,
        mobile,
        isVerify: true,
        role: "customer",
        password: otp,
      });

     const sss= await newUser.save();
      return res.status(200).json({
        message: "Account Created successfully!",
        user:sss,
      });
    }
    if (!user.isVerify) {
      return res.status(403).json({
        message: "Account Unverifed!",

        user,
      });
    }

    // You can now issue a token or move to next step (e.g., profile setup)
    return res.status(200).json({
      message: "Logged successfully",

      user,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      message: error.message || "Server error during OTP verification",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = {
      ...(req.body.username && { username: req.body.username }),
      ...(req.body.mobile && { mobile: req.body.mobile }),
      ...(req.body.role && { role: req.body.role }),
      // Optional fields
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.email && { email: req.body.email }),
      ...(req.body.panNumber && { panNumber: req.body.panNumber }),
      ...(req.body.aadhaarNumber && { aadhaarNumber: req.body.aadhaarNumber }),
      ...(req.body.address && { address: req.body.address }),
      ...(req.body.state && { state: req.body.state }),
      ...(req.body.district && { district: req.body.district }),
      ...(req.body.pincode && { pincode: req.body.pincode }),
      ...(req.body.photo && { photo: req.body.photo }),
    };

    const user = await User.findByIdAndUpdate(userId, userData, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      message: error.message || "Server error during update",
    });
  }
};
exports.profile = async (req, res) => {
  try {
    const { _id } = req.body;
    console.log(req.body);
    const user = await User.findByIdAndUpdate(_id, req.body, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      message: error.message || "Server error during update",
    });
  }
};

exports.authUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  const { role } = req.params;
  try {
    const users = await User.find({ role });
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.statusChange = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = [
      "distributor",
      "dealer",
      "mechanic",
      "company-employee",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }
    const x = await User.findById(req.params.id);

    if (x.role !== role) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        role,
        isVerify: true,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Verification successful",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.passChange = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Update user password
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: newPassword },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Password changed successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.username = req.body.username || user.username;
      user.role = req.body.role || user.role;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        wallet: updatedUser.wallet,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
