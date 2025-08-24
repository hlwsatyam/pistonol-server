// In your backend route file (e.g., routes/userStats.js)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QRCode = require('../models/QRCode');
const Lead = require('../models/Lead');

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    
    // Build date filter based on time range
    let dateFilter = {};
    if (timeRange) {
      const now = new Date();
      
      switch (timeRange) {
        case 'today':
          dateFilter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
          break;
        case 'week':
          dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
          break;
        case 'month':
          dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
          break;
        case 'year':
          dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter.createdAt = { 
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            };
          }
          break;
      }
    }

    // Get total users count
    const totalUsers = await User.countDocuments(dateFilter);

    // Get verified users count
    const verifiedUsers = await User.countDocuments({ 
      ...dateFilter,
      isVerify: true 
    });

    // Get active users (those who have been active in last 30 days)
    const activeUsers = await User.countDocuments({
      ...dateFilter,
      $or: [
        { lastScannedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        { lastTransferedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      ]
    });

    // Get role distribution
    const roleDistribution = await User.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Convert role distribution array to object
    const roleDistributionObj = roleDistribution.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Get last scanned/transferred counts (last 7 days)
    const lastScannedCount = await User.countDocuments({
      lastScannedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const lastTransferredCount = await User.countDocuments({
      lastTransferedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      verifiedUsers,
      activeUsers,
      roleDistribution: roleDistributionObj,
      lastScannedCount,
      lastTransferredCount,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});




router.get('/qr/stats', async (req, res) => {
  try {
    // Total QR codes count
    const totalQRCodes = await QRCode.countDocuments();
    
    // Status-wise counts
    const statusCounts = await QRCode.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Scanned vs unscanned counts
    const scannedCount = await QRCode.countDocuments({ scannedAt: { $ne: null } });
    const unscannedCount = totalQRCodes - scannedCount;
    
    // Daily creation stats (last 30 days)
    const creationStats = await QRCode.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      },
      { 
        $group: { 
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Batch-wise distribution
    const batchStats = await QRCode.aggregate([
      { $group: { _id: "$batchNumber", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Scan activity (last 30 days)
    const scanActivity = await QRCode.aggregate([
      { 
        $match: { 
          scannedAt: { 
            $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      },
      { 
        $group: { 
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Value distribution
    const valueStats = await QRCode.aggregate([
      { 
        $group: { 
          _id: "$value", 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalQRCodes,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      scannedCount,
      unscannedCount,
      creationStats,
      batchStats,
      scanActivity,
      valueStats,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error fetching QR code stats:', error);
    res.status(500).json({ message: 'Server error while fetching QR code statistics' });
  }
});






router.get('/lead/stats', async (req, res) => {
  try {
    // Total leads count
    const totalLeads = await Lead.countDocuments();
    
    // Status-wise counts
    const statusCounts = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Daily creation stats (last 30 days)
    const creationStats = await Lead.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      },
      { 
        $group: { 
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    // State-wise distribution
    const stateStats = await Lead.aggregate([
      { $group: { _id: "$state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Conversion funnel
    const funnelStats = {
      new: await Lead.countDocuments({ status: 'New' }),
      contacted: await Lead.countDocuments({ status: 'Contacted' }),
      qualified: await Lead.countDocuments({ status: 'Qualified' }),
      lost: await Lead.countDocuments({ status: 'Lost' })
    };
    
    // User-wise lead creation
    const userStats = await Lead.aggregate([
      { 
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $group: { 
          _id: '$createdBy', 
          count: { $sum: 1 },
          name: { $first: '$user.name' },
          username: { $first: '$user.username' }
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalLeads,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      creationStats,
      stateStats,
      funnelStats,
      userStats,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ message: 'Server error while fetching lead statistics' });
  }
});

// Get lead timeline for a specific lead
router.get('/lead/:id/timeline', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const timeline = [
      {
        event: 'Lead Created',
        date: lead.createdAt,
        description: 'Lead was initially created in the system'
      },
      ...lead.feedbacks.map(feedback => ({
        event: 'Feedback Added',
        date: feedback.createdAt,
        description: feedback.message
      })),
      {
        event: 'Status Updated',
        date: lead.updatedAt,
        description: `Status changed to ${lead.status}`
      }
    ].sort((a, b) => b.date - a.date);

    res.json(timeline);
  } catch (error) {
    console.error('Error fetching lead timeline:', error);
    res.status(500).json({ message: 'Server error while fetching lead timeline' });
  }
});






// Get leads with pagination and filters
router.get('/leads', async (req, res) => {
  try {
    // Parse and validate query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { garageName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Get total count of documents (for pagination info)
    const total = await Lead.countDocuments(query);

    // Get paginated data
    const leads = await Lead.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email') // Only include name and email
      .lean(); // Convert to plain JS objects

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    // Send response
    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        page,
        pages,
        limit,
        hasNextPage: page < pages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Error in /leads endpoint:', err);
    
    // Handle specific errors
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid query parameters'
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching leads',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});




module.exports = router;