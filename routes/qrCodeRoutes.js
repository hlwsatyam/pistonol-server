const express = require("express");
const {
  generateQRCodes,
  getQRCodes,
  deleteQRCode,
  getQRCodeById,
  updateQRCode,
  verifyQRCodes,
  GETUserQRHist,
} = require("../controllers/qrCodeController");
const router = express.Router();

router.route("/").post(generateQRCodes).get(getQRCodes);
router.post("/verification", verifyQRCodes);

// In your backend routes
router.get("/history/:userId", GETUserQRHist);

router.route("/:id").delete(deleteQRCode).get(getQRCodeById).put(updateQRCode);

module.exports = router;
