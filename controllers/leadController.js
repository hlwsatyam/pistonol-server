const Lead = require('../models//Lead');
const mongoose=require('mongoose')
exports.createLead = async (req, res) => {
  try {
    const leadData = req.body;
    const newLead = new Lead(leadData);
    await newLead.save();
    res.status(201).json(newLead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.getUserLeads = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     const leads = await Lead.find({ createdBy: userId })
//       .sort({ createdAt: -1 });
//     res.json(leads);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


exports.getUserLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
 console.log(req.query.userId , req.query   )
    const leads = await Lead.find({ createdBy: req.query.userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
 
    res.status(200).json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};







exports.getLeadAnalytics = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Today's leads
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todaysLeads = await Lead.countDocuments({
      createdBy: userId,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // Last 7 days leads
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const last7DaysLeads = await Lead.countDocuments({
      createdBy: userId,
      createdAt: { $gte: sevenDaysAgo, $lte: todayEnd }
    });

    // Monthly leads
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyLeads = await Lead.countDocuments({
      createdBy: userId,
      createdAt: { $gte: monthStart, $lte: todayEnd }
    });

    // Status-wise counts
    const statusCounts = await Lead.aggregate([
      { $match: { createdBy:new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Weekly trend (last 4 weeks)
    const weeklyTrend = await Lead.aggregate([
      { 
        $match: { 
          createdBy:new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 28)) }
        } 
      },
      {
        $group: {
          _id: { $week: "$createdAt" },
          count: { $sum: 1 },
          startDate: { $min: "$createdAt" }
        }
      },
      { $sort: { startDate: 1 } },
      { $limit: 4 }
    ]);

    res.json({
      todaysLeads,
      last7DaysLeads,
      monthlyLeads,
      statusCounts,
      weeklyTrend
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


















exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};










exports.updateLead = async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(updatedLead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    lead.feedbacks.push({
      message: req.body.message,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    await lead.save();
    res.json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    const feedback = lead.feedbacks.id(req.params.feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    feedback.message = req.body.message;
    feedback.updatedAt = Date.now();
    
    await lead.save();
    res.json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};