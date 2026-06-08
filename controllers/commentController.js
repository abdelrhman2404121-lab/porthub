// controllers/commentController.js — Comments on user profiles
'use strict';

const Comment = require('../models/Comment');
const User    = require('../models/User');

// ─── GET /api/comments/:userId ─────────────────────────────────────────────────
/**
 * Get all visible comments on a user's profile.
 */
const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({
            targetUserId: req.params.userId,
            isHidden: false
        })
            .populate('userId', 'name profileImage title role')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, comments });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch comments.' });
    }
};

// ─── POST /api/comments/:userId ────────────────────────────────────────────────
/**
 * Add a comment (and optional rating) on another user's profile.
 */
const addComment = async (req, res) => {
    try {
        const { comment, rating } = req.body;
        const targetId = req.params.userId;

        if (!comment || !comment.trim()) {
            return res.status(400).json({ success: false, message: 'Comment text is required.' });
        }

        if (req.user._id.toString() === targetId) {
            return res.status(400).json({ success: false, message: 'You cannot comment on your own profile.' });
        }

        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

        // Create the comment
        const newComment = await Comment.create({
            userId:       req.user._id,
            targetUserId: targetId,
            comment:      comment.trim(),
            rating:       rating ? parseInt(rating) : null
        });

        
        targetUser.notifications.unshift({
            text:  `<strong>${req.user.name}</strong> left a comment on your profile.`,
            type:  'comment',
            read:  false,
            link:  `/profile.html?id=${req.user._id}`,
            createdAt: new Date()
        });
        if (targetUser.notifications.length > 30) targetUser.notifications.pop();
        await targetUser.save({ validateBeforeSave: false });

        // Populate author info before returning
        await newComment.populate('userId', 'name profileImage title role');

        res.status(201).json({ success: true, message: 'Comment added.', comment: newComment });
    } catch (err) {
        console.error('addComment error:', err);
        res.status(500).json({ success: false, message: 'Could not add comment.' });
    }
};

// ─── DELETE /api/comments/:id ──────────────────────────────────────────────────
/**
 * Delete a comment. Only the comment author or an admin can delete.
 */
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

        const isOwner = comment.userId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
        }

        await comment.deleteOne();
        res.status(200).json({ success: true, message: 'Comment deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not delete comment.' });
    }
};

// ─── PUT /api/comments/:id/hide ───────────────────────────────────────────────
/**
 * Admin-only: toggle a comment's hidden status.
 */
const toggleHideComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

        comment.isHidden = !comment.isHidden;
        await comment.save();

        res.status(200).json({
            success: true,
            message: `Comment ${comment.isHidden ? 'hidden' : 'unhidden'}.`,
            isHidden: comment.isHidden
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not toggle comment.' });
    }
};

module.exports = { getComments, addComment, deleteComment, toggleHideComment };
