const QRCode = require("../models/QRCode");
const User = require("../models/User");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

// Ensure directory exists
const outputDir = path.join(__dirname, "..", "generated_qrcodes");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function generate8DigitCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// exports.generateQRCodes = async (req, res) => {

//   try {
//     const { value, quantity, batchNumber } = req.body;
//     const qrCodes = [];

//     await updateCompanyWallet(quantity * value);

//     for (let i = 0; i < quantity; i++) {
//       const qrCodeData = {
//         value: value,
//         batchNumber: batchNumber + "-" + (i + 1),
//         quantity: 1,
//         status: "active",
//         cost: 1,
//       };

//       const qrCode = await QRCode.create(qrCodeData);
//       qrCodes.push(qrCode);
//     }

//     res.status(201).json(qrCodes);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// Helper function to update company wallet

exports.generateQRCodes = async (req, res) => {
  try {
    const { value, quantity, batchNumber } = req.body;
    const qrCodes = [];

    for (let i = 0; i < quantity; i++) {
      const uniqueCode = generate8DigitCode();
      const fullBatch = `${batchNumber}-${i + 1}`;

      // QR Payload as raw JSON string
      const qrPayload = JSON.stringify({
        value,
        batch: fullBatch,
        code: uniqueCode,
      });

      // Generate QR Code Data URL
      const qrDataUrl = await require("qrcode").toDataURL(qrPayload, {
        errorCorrectionLevel: "H", // High level for robustness
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Canvas size
      const canvas = createCanvas(400, 500);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code image
      const qrImage = await loadImage(qrDataUrl);
      ctx.drawImage(qrImage, 100, 50, 200, 200);

      // Batch and Unique Code below
      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Batch: ${fullBatch}`, 200, 300);
      ctx.fillText(`Code: ${uniqueCode}`, 200, 340);

      // Save to file
      const fileName = `qr_${fullBatch}_${uniqueCode}.png`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

      // Save to DB
      const qrCodeDoc = await QRCode.create({
        value,
        uniqueCode,
        batchNumber: fullBatch,
        quantity: 1,
        status: "active",
        imageUrl: `/generated_qrcodes/${fileName}`,
      });

      qrCodes.push(qrCodeDoc);
    }

    res.status(201).json(qrCodes);
  } catch (err) {
    console.error("QR generation error:", err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};

const updateCompanyWallet = async (amount, cond = "", oldAmount = "") => {
  try {
    const company = await User.findOne({ role: "company" });
    if (!company) {
      throw new Error("Company user not found");
    }
    if (cond) {
      company.wallet = company.wallet - oldAmount;
      company.wallet += amount;
    } else {
      company.wallet += amount;
    }

    await company.save();
    return company;
  } catch (error) {
    throw error;
  }
};

// exports.generateQRCodes = async (req, res) => {

//   try {
//     const { value, quantity, batchNumber } = req.body;
//     const qrCodes = [];

//     await updateCompanyWallet(quantity * value);

//     for (let i = 0; i < quantity; i++) {
//       const qrCodeData = {
//         value: value,
//         batchNumber: batchNumber + "-" + (i + 1),
//         quantity: 1,
//         status: "active",

//       };

//       const qrCode = await QRCode.create(qrCodeData);
//       qrCodes.push(qrCode);
//     }

//     res.status(201).json(qrCodes);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: error.message });
//   }
// };

exports.deleteQRCode = async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (qrCode) {
      // Refund to company wallet when deleting
      await updateCompanyWallet(-qrCode.value);

      await qrCode.deleteOne();
      res.json({ message: "QR code removed" });
    } else {
      res.status(404).json({ message: "QR code not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateQRCode = async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);
    let d = qrCode;
    if (qrCode) {
      const oldStatus = qrCode.status;
      const newStatus = req.body.status;

      qrCode.value = req.body.value || qrCode.value;
      qrCode.status = newStatus || qrCode.status;

      // Update wallet if status changes from active to used/inactive or vice versa
      if (oldStatus !== newStatus) {
        let walletChange = 0;

        if (newStatus === "active" && oldStatus !== "active") {
          // Deduct if activating
          walletChange = -(qrCode.cost || 1);
        } else if (newStatus !== "active" && oldStatus === "active") {
          // Refund if deactivating
          walletChange = qrCode.value || 1;
        }

        if (walletChange !== 0) {
          await updateCompanyWallet(walletChange, "update", d.value);
        }
      }

      const updatedQRCode = await qrCode.save();
      res.json(updatedQRCode);
    } else {
      res.status(404).json({ message: "QR code not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all QR codes
// @route   GET /api/qrcodes
// @access  Private
exports.getQRCodes = async (req, res) => {
  try {
    const qrCodes = await QRCode.find({});
    res.json(qrCodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyQRCodes = async (req, res) => {
  const { code, _id, role } = req.body;
  console.log(code, _id, role);
   
  try {
    const user = await User.findById(_id);
   
    if (!user) {
      return res.status(404).json({ message: "Userr not found" });
    }


let parsedCode = code;
try {
  const temp = JSON.parse(code);
  parsedCode = temp?.code || code;
} catch (e) {
  parsedCode = code; // fallback if it's not JSON
}


    // Step 1: Find the QR code by uniqueCode
    const qrCode = await QRCode.findOne({ uniqueCode: parsedCode, client: role });

    if (!qrCode) {
      return res
        .status(404)
        .json({ message: "QR Code not found For This User" });
    }

    if (qrCode.status !== "active") {
      return res.status(400).json({ message: `QR Code is ${qrCode.status}` });
    }

    // Step 2: Update QR Code status to "used"
    qrCode.status = "used";
    qrCode.user = _id;
    qrCode.scannedAt = new Date();
    await qrCode.save();

    // Step 3: Credit value to user's wallet

    user.wallet += parseInt(qrCode.value);
    user.lastScannedAt = new Date();
    await user.save();

    // ✅ Success
    return res.json({
      message: "QR Code verified successfully",
      user,
    });
  } catch (error) {
    console.error("QR Verification Error:", error);
    res.status(500).json({
      message: error.message || "Server error during QR Code verification",
    });
  }
};
exports.GETUserQRHist = async (req, res) => {
  console.log( req.params)
  try {
    const { userId } = req.params;

    // Find all QR codes scanned by this user or assigned to this user
    const history = await QRCode.find({
      $or: [{ user: userId } ],
      status: "used",  
    }).sort({ scannedAt: -1 }); 

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get QR code by ID
// @route   GET /api/qrcodes/:id
// @access  Private
exports.getQRCodeById = async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (qrCode) {
      res.json(qrCode);
    } else {
      res.status(404).json({ message: "QR code not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
