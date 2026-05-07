// middleware/auth.js — JWT Authentication & Authorization Middleware
'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Verifies JWT token, attaches req.user, updates lastSeen.
 * Use on any route that requires a logged-in user.
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // 1) Read token from Authorization header or query param
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
        }

        // 2) Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
        }

        // 3) Check user still exists
        const user = await User.findById(decoded.id).select('-password -ratedBy');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists.' });
        }

        // 4) Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked by an administrator.' });
        }

        // 5) Update lastSeen and isOnline silently (non-blocking)
        User.findByIdAndUpdate(decoded.id, {
            lastSeen: new Date(),
            isOnline: true
        }).catch(() => {}); // Silent fail — don't break the request

        // 6) Attach user to request
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

/**
 * adminOnly — Must be used AFTER protect.
 * Allows access only to users with role === 'admin'.
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
};

/**
 * optionalAuth — Attaches user if token is present, but does NOT require it.
 * Use on public routes that have optional auth behavior (e.g., profile view tracking).
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password -ratedBy');
                if (user && !user.isBlocked) {
                    req.user = user;
                    // Update lastSeen silently
                    User.findByIdAndUpdate(decoded.id, { lastSeen: new Date(), isOnline: true }).catch(() => {});
                }
            } catch (err) {
                // Token invalid — proceed as guest
                req.user = null;
            }
        }
        next();
    } catch (err) {
        next();
    }
};

/**
 * generateToken — Creates a signed JWT for a given user ID.
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

module.exports = { protect, adminOnly, optionalAuth, generateToken };
