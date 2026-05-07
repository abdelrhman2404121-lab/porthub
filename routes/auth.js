// routes/auth.js
'use strict';

const express = require('express');
const router  = express.Router();

const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout  (protected — marks user as offline)
router.post('/logout', protect, logout);

// GET /api/auth/me  (returns current logged-in user)
router.get('/me', protect, getMe);

module.exports = router;
