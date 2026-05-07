// models/Comment.js — Comment & Rating Schema
'use strict';

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({

    // ── Who wrote the comment ──────────────────────────────────────────────
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment must have an author']
    },

    // ── Whose profile the comment is on ───────────────────────────────────
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment must have a target user']
    },

    // ── Comment text ──────────────────────────────────────────────────────
    comment: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },

    // ── Optional star rating tied to the comment (1-5) ────────────────────
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },

    // ── Moderation ────────────────────────────────────────────────────────
    isHidden: { type: Boolean, default: false }  // Admin can hide offensive comments

}, {
    timestamps: true
});

// One user can only comment once per profile (optional strict mode)
// CommentSchema.index({ userId: 1, targetUserId: 1 }, { unique: true });

CommentSchema.index({ targetUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
