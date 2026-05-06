const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/Auth');

const normalizeAddress = (payload = {}) => ({
  label: payload.label?.trim() || '',
  name: payload.name?.trim() || '',
  phone: payload.phone?.trim() || '',
  street: payload.street?.trim() || '',
  city: payload.city?.trim() || '',
  state: payload.state?.trim() || '',
  pincode: payload.pincode?.trim() || '',
  country: payload.country?.trim() || 'India',
  isDefault: Boolean(payload.isDefault),
});

const validateAddress = (address) => {
  const requiredFields = ['name', 'phone', 'street', 'city', 'state', 'pincode', 'country'];
  const missing = requiredFields.find((field) => !address[field]);
  if (missing) return `Address field "${missing}" is required`;
  return null;
};

router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, addresses: user.addresses || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add address
router.post('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = normalizeAddress(req.body);
    const validationError = validateAddress(address);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (address.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => (a.isDefault = false));
      address.isDefault = true;
    }

    user.addresses.push(address);
    await user.save();
    res.json({ success: true, user, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Set default address
router.put('/addresses/:addressId/default', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    user.addresses.forEach((item) => {
      item.isDefault = item._id.toString() === req.params.addressId;
    });

    await user.save();
    res.json({ success: true, user, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete address
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addressToDelete = user.addresses.id(req.params.addressId);

    if (!addressToDelete) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = addressToDelete.isDefault;
    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, user, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
