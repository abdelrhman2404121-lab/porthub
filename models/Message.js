// models/Message.js — Chat / Message Schema
'use strict';

const mongoose = require('mongoose');

// ─── Individual Message Sub-document ─────────────────────────────────────────
const MessageItemSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text:      { type: String, required: true, trim: true },
    isRead:    { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

// ─── Conversation (Chat Room) Schema ──────────────────────────────────────────
const ConversationSchema = new mongoose.Schema({

    // ── Participants (always 2 users) ──────────────────────────────────────
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    // ── First message (the "request" message) ─────────────────────────────
    requestMessage: { type: String, default: '' },
    requestedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ── Acceptance State ──────────────────────────────────────────────────
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },

    // ── Message History ───────────────────────────────────────────────────
    messages: { type: [MessageItemSchema], default: [] },

    // ── Last Activity ─────────────────────────────────────────────────────
    lastMessageAt:  { type: Date, default: Date.now },
    lastMessageText:{ type: String, default: '' }

}, {
    timestamps: true
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
