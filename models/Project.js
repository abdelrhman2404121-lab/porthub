// models/Project.js — Project Schema
'use strict';

const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({

    // ── Core Fields ────────────────────────────────────────────────────────
    title:        { type: String, required: [true, 'Project title is required'], trim: true },
    description:  { type: String, required: [true, 'Project description is required'] },

    // ── Technologies used (array of strings) ───────────────────────────────
    technologies: { type: [String], default: [] },

    // ── Media ──────────────────────────────────────────────────────────────
    image:        { type: String, default: '' },   // URL to project screenshot/image

    // ── Links ──────────────────────────────────────────────────────────────
    githubLink:   { type: String, default: '' },
    liveDemo:     { type: String, default: '' },

    // ── Legacy/Short link field (used in older frontend) ───────────────────
    link:         { type: String, default: '' },

    // ── Short description alias ────────────────────────────────────────────
    desc:         { type: String, default: '' },

    // ── Ownership ──────────────────────────────────────────────────────────
    userId:       {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Project must belong to a user']
    },

    // ── Visibility ─────────────────────────────────────────────────────────
    isPublic:     { type: Boolean, default: true },

    // ── Stats ──────────────────────────────────────────────────────────────
    views:        { type: Number, default: 0 },
    likes:        { type: Number, default: 0 }

}, {
    timestamps: true
});

// Text index for search
ProjectSchema.index({ title: 'text', description: 'text' });
ProjectSchema.index({ userId: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
