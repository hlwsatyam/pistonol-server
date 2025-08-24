// walletController.js
const User = require("../models/User");
const Transaction = require("../models/transaction");

// Transfer funds between users
exports.transferFunds = async (req, res) => {
  try {
    const { senderId, receiverUsername, amount } = req.body;

    // Validate input
    if (!senderId || !receiverUsername || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Find sender and receiver
    const sender = await User.findById(senderId);
     
    const receiver = await User.findOne({
      username: receiverUsername,
      role: sender?.role === "customer" ? "mechanic" : "",
    });

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (sender._id.equals(receiver._id)) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    if (sender.wallet < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Perform transfer
    sender.wallet -= amount;
    receiver.wallet += amount;

    // Create transaction record
    const transaction = new Transaction({
      sender: sender._id,
      receiver: receiver._id,
      amount,
      type: "transfer",
    });

    // Save all changes
    await Promise.all([sender.save(), receiver.save(), transaction.save()]);

    // Update lastTransferedAt for sender
    sender.lastTransferedAt = new Date();
    await sender.save();

    res.json({
      message: "Transfer successful",
      senderBalance: sender.wallet,
      receiverBalance: receiver.wallet,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
