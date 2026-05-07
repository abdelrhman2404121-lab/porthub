// controllers/authController.js — Register, Login, Logout, Me
'use strict';

const User            = require('../models/User');
const { generateToken } = require('../middleware/auth');

// ─── Helper: Build token response ────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.ratedBy;

    res.status(statusCode).json({
        success: true,
        token,
        user: userObj
    });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
/**
 * Registers a new user (individual or company).
 * Required body: { name, email, password, role }
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        }

        // Check name has no numbers (as per existing frontend validation)
        if (/\d/.test(name)) {
            return res.status(400).json({ success: false, message: 'Name cannot contain numbers.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }

        // Check password strength
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with a letter and a number.' });
        }

        // Check if email already exists
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Determine role (prevent registering as admin via API)
        const userRole = (role === 'company') ? 'company' : 'individual';

        // Build base user data
        const userData = {
            name,
            email,
            password,
            role: userRole,
            title: userRole === 'company' ? 'Innovative Company' : 'New Member',
            bio: userRole === 'company'
                ? 'We are a company that builds great things!'
                : "I'm new here!",
            profileImage: `https://i.pravatar.cc/150?u=${email}`,
            isOnline: true,
            lastSeen: new Date()
        };

        // Create user
        const user = await User.create(userData);

        sendTokenResponse(user, 201, res);
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * Logs in a user. Returns JWT + user object.
 * Required body: { email, password }
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        // Find user WITH password field (select: false by default)
        const user = await User.findByEmailWithPassword(email.toLowerCase());

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Check if blocked
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked by an administrator.' });
        }

        // Update online status and lastSeen
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
/**
 * Logout — sets isOnline: false, updates lastSeen. 
 * The JWT is destroyed client-side.
 */
const logout = async (req, res) => {
    try {
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                isOnline: false,
                lastSeen: new Date()
            });
        }
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Logout error.' });
    }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * Returns the currently authenticated user's full data.
 */
const getMe = async (req, res) => {
    try {
        // req.user is attached by the protect middleware
        const user = await User.findById(req.user._id).select('-password -ratedBy');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.status(200).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch user data.' });
    }
};

module.exports = { register, login, logout, getMe };
