const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, toggleUserStatus } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/Auth');

router.get('/dashboard', protect, adminOnly, getDashboard);
router.get('/users', protect, adminOnly, getUsers);
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus);

module.exports = router;
