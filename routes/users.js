// routes/users.js
'use strict';

const express = require('express');
const router  = express.Router();

const {
    getAllUsers,
    getUserById,
    updateProfile,
    updateSettings,
    addSkill,
    removeSkill,
    addExperience,
    removeExperience,
    updateExperience,
    addEducation,
    removeEducation,
    updateEducation,
    rateUser,
    getNotifications,
    markNotificationsRead,
    getViewers,
    sendConnectRequest,
    handleConnectRequest,
    removeTeamMember
} = require('../controllers/userController');

const { protect, optionalAuth } = require('../middleware/auth');

// ── Public routes ──────────────────────────────────────────────────────────────
// GET /api/users  — explore / search users
router.get('/', optionalAuth, getAllUsers);

// ── Protected routes — MUST be declared before /:id to avoid route conflict ───

// Profile & Settings
router.put('/profile',  protect, updateProfile);
router.put('/settings', protect, updateSettings);

// Skills
router.post('/skills',             protect, addSkill);
router.delete('/skills/:skill',    protect, removeSkill);

// Experience (individual)
router.post('/experience',         protect, addExperience);
router.put('/experience/:id',      protect, updateExperience);
router.delete('/experience/:id',   protect, removeExperience);

// Education (individual)
router.post('/education',          protect, addEducation);
router.put('/education/:id',       protect, updateEducation);
router.delete('/education/:id',    protect, removeEducation);

// Notifications
router.get('/me/notifications',        protect, getNotifications);
router.put('/me/notifications/read',   protect, markNotificationsRead);

// Viewers
router.get('/me/viewers', protect, getViewers);

// Connect Requests (accept/decline)
router.put('/requests/:id',     protect, handleConnectRequest);

// Remove Team Member (Company removes member or individual leaves company)
router.delete('/:companyId/team/:memberId', protect, removeTeamMember);

// ── Wildcard routes — MUST be last ────────────────────────────────────────────

// GET /api/users/:id  — single profile (optionalAuth for view tracking)
router.get('/:id', optionalAuth, getUserById);

// Rating
router.post('/:id/rate', protect, rateUser);

// Connect Requests (send)
router.post('/:id/request', protect, sendConnectRequest);

module.exports = router;

