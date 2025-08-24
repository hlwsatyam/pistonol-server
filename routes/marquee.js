const express = require('express');
const Marquee = require('../models/Marquee');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// Get all marquees
router.get('/', async (req, res) => {
  try {
    const marquees = await Marquee.find().sort({ createdAt: -1 });
    res.json(marquees);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
});

// Get active marquee
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const activeMarquee = await Marquee.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    if (!activeMarquee) {
      return res.status(404).json({ message: 'No active marquee found' });
    }

    res.json(activeMarquee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new marquee
router.post(
  '/',
  [
    check('text', 'Text is required').not().isEmpty(),
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, isActive,  targetAudience,   startDate, endDate } = req.body;

    try {
      const marquee = new Marquee({
        text,targetAudience,
        isActive: isActive || false,
        startDate,
        endDate
      });

      const newMarquee = await marquee.save();
      res.status(201).json(newMarquee);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// Update a marquee
router.put('/:id', async (req, res) => {
  try {
    const marquee = await Marquee.findById(req.params.id);
    if (!marquee) {
      return res.status(404).json({ message: 'Marquee not found' });
    }

    marquee.text = req.body.text || marquee.text;
    marquee.targetAudience = req?.body?.targetAudience;
    marquee.isActive =
      req.body.isActive !== undefined ? req.body.isActive : marquee.isActive;
    marquee.startDate = req.body.startDate || marquee.startDate;
    marquee.endDate = req.body.endDate || marquee.endDate;
    marquee.updatedAt = Date.now();

    const updatedMarquee = await marquee.save();
    res.json(updatedMarquee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a marquee
router.delete('/:id', async (req, res) => {
  try {
    const marquee = await Marquee.findById(req.params.id);
    if (!marquee) {
      return res.status(404).json({ message: 'Marquee not found' });
    }

    await marquee.deleteOne();
    res.json({ message: 'Marquee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
