// models/User.js — Full User Schema (Individual + Company)
'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const ExperienceSchema = new mongoose.Schema({
    role:    { type: String, required: true },
    company: { type: String, required: true },
    years:   { type: String },                // e.g. "2020-Present"
    description: { type: String, default: '' }
}, { _id: true });

const EducationSchema = new mongoose.Schema({
    degree: { type: String, required: true },
    school: { type: String, required: true },
    year:   { type: String },
    description: { type: String, default: '' }
}, { _id: true });

const BranchSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    location: { type: String, required: true },
    contact:  { type: String, default: '' }
}, { _id: true });

const TeamMemberSchema = new mongoose.Schema({
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:    { type: String, required: true },
    role:    { type: String, required: true },
    avatar:  { type: String, default: '' }
}, { _id: true });

const TimelineEventSchema = new mongoose.Schema({
    date:  { type: String, required: true },   // e.g. "2020-01-15"
    title: { type: String, required: true },
    desc:  { type: String, required: true },
    icon:  { type: String, default: 'fas fa-star' }
}, { _id: true });

const JobSchema = new mongoose.Schema({
    title:    { type: String, required: true },
    location: { type: String, required: true },
    link:     { type: String, required: true },
    type:     { type: String, enum: ['full-time', 'part-time', 'remote', 'internship'], default: 'full-time' },
    postedAt: { type: Date, default: Date.now }
}, { _id: true });

const ViewerSchema = new mongoose.Schema({
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:    { type: String },
    avatar:  { type: String },
    role:    { type: String },
    viewedAt: { type: Date, default: Date.now }
}, { _id: false });

const NotificationSchema = new mongoose.Schema({
    text:    { type: String, required: true },
    type:    { type: String, enum: ['view', 'comment', 'rating', 'request', 'message', 'system'], default: 'system' },
    read:    { type: Boolean, default: false },
    link:    { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ConnectRequestSchema = new mongoose.Schema({
    fromId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromName:   { type: String },
    fromAvatar: { type: String },
    toId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type:       { type: String, enum: ['join', 'invite'], required: true },
    status:     { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    date:       { type: Date, default: Date.now }
}, { _id: true });

const SocialLinksSchema = new mongoose.Schema({
    github:   { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter:  { type: String, default: '' },
    website:  { type: String, default: '' },
    instagram:{ type: String, default: '' }
}, { _id: false });

const PrivacySettingsSchema = new mongoose.Schema({
    showEmail: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true }
}, { _id: false });

// ─── Main User Schema ─────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({

    // ── Core Identity ──────────────────────────────────────────────────────
    name:         { type: String, required: [true, 'Name is required'], trim: true },
    email:        { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password:     { type: String, required: [true, 'Password is required'], minlength: 8, select: false },

    // ── Role (tracks individual vs. company) ───────────────────────────────
    role:         { type: String, enum: ['individual', 'company', 'admin'], default: 'individual' },

    // ── Account Status ─────────────────────────────────────────────────────
    isBlocked:    { type: Boolean, default: false },
    isVerified:   { type: Boolean, default: false },

    // ── Activity Tracking ──────────────────────────────────────────────────
    lastSeen:     { type: Date, default: Date.now },  // Updated on every authenticated request
    isOnline:     { type: Boolean, default: false },   // Set true on login, false on logout

    // ── Shared Profile Fields ──────────────────────────────────────────────
    title:        { type: String, default: '' },       // e.g. "Frontend Developer" or "Innovative Company"
    bio:          { type: String, default: '' },
    profileImage: { type: String, default: '' },       // URL to profile picture
    phone:        { type: String, default: '' },
    location:     { type: String, default: '' },       // City, Country
    website:      { type: String, default: '' },
    socialLinks:  { type: SocialLinksSchema, default: () => ({}) },
    settings:     { type: PrivacySettingsSchema, default: () => ({}) },

    // ── Rating System ──────────────────────────────────────────────────────
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    ratingCount:  { type: Number, default: 0 },
    ratedBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Prevent double-rating

    // ── Profile Viewers ────────────────────────────────────────────────────
    viewers:      { type: [ViewerSchema], default: [] },

    // ── Notifications ──────────────────────────────────────────────────────
    notifications: { type: [NotificationSchema], default: [] },

    // ── Connection Requests (join company / invite individual) ─────────────
    requests:     { type: [ConnectRequestSchema], default: [] },

    // ════════════════════════════════════════════════════════════════════════
    // ── INDIVIDUAL-SPECIFIC FIELDS ─────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════
    skills:       { type: [String], default: [] },
    experience:   { type: [ExperienceSchema], default: [] },
    education:    { type: [EducationSchema], default: [] },
    cvUrl:        { type: String, default: '' },           // URL to uploaded CV/resume

    // ════════════════════════════════════════════════════════════════════════
    // ── COMPANY-SPECIFIC FIELDS ────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════
    // Company Details
    industry:       { type: String, default: '' },           // e.g. "Technology", "Finance"
    companySize:    { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+', ''], default: '' },
    founded:        { type: String, default: '' },            // e.g. "2015"
    headquarters:   { type: String, default: '' },            // e.g. "New York, USA"
    brochureUrl:    { type: String, default: '' },            // URL to company brochure/pitch deck

    // Company branches/offices
    branches:     { type: [BranchSchema], default: [] },

    // Company team members
    team:         { type: [TeamMemberSchema], default: [] },

    // Company timeline/milestones
    timeline:     { type: [TimelineEventSchema], default: [] },

    // Company job listings
    jobs:         { type: [JobSchema], default: [] }

}, {
    timestamps: true  // Adds createdAt and updatedAt automatically
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: email is already indexed via unique:true on the field definition
UserSchema.index({ role: 1 });
UserSchema.index({ name: 'text', bio: 'text', title: 'text' }); // Text search

// ─── Password Hashing Middleware ──────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
    // Only hash the password if it's been modified (or is new)
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

// Compare entered password with stored hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Return a safe public profile (no password, no sensitive data)
UserSchema.methods.toPublicProfile = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.ratedBy;
    return obj;
};

// ─── Static Methods ───────────────────────────────────────────────────────────

// Find user by email and include password (for login)
UserSchema.statics.findByEmailWithPassword = function (email) {
    return this.findOne({ email }).select('+password');
};

module.exports = mongoose.model('User', UserSchema);
