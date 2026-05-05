const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalized = email.toLowerCase().trim();
    const existing = await Subscriber.findOne({ email: normalized });
    if (existing) {
      return res.json({ success: true, message: 'Already subscribed', subscriber: existing });
    }

    const subscriber = new Subscriber({ email: normalized, name });
    await subscriber.save();
    return res.status(201).json({ success: true, message: 'Subscribed', subscriber });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Subscriber.findOne({ email: req.body.email.toLowerCase().trim() });
      return res.json({ success: true, message: 'Already subscribed', subscriber: existing });
    }
    next(err);
  }
});

module.exports = router;
