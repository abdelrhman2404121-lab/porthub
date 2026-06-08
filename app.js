// app.js — PortfolioHub Express Server Entry Point
'use strict';

const express    = require('express');
const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
const path       = require('path');
const cors       = require('cors');

const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── View Engine Setup ───────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static Files (CSS, JS, Images) ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/upload',   require('./routes/upload'));
app.use('/api/comments', require('./routes/comments'));

// Load Models for SSR
const User = require('./models/User');

// ─── Serve EJS Views ─────────────────────────────────────────────────────────
// Support legacy .html extension requests by redirecting to the EJS equivalent
const legacyPages = ['index', 'login', 'register', 'dashboard', 'profile', 'settings', 'messages', 'explore', 'projects', 'about', 'contact', 'admin'];
legacyPages.forEach(page => {
    app.get(`/${page}.html`, (req, res) => {
        // Redirect to the non-html version, preserving query string
        const url = new URL(req.url, `http://${req.headers.host}`);
        res.redirect(301, `/${page === 'index' ? '' : page}${url.search}`);
    });
});

const pages = [
    'index', 'login', 'register', 'dashboard', 'profile',
    'projects', 'messages', 'settings',
    'about', 'contact', 'admin'
];

pages.forEach(page => {
    app.get(`/${page === 'index' ? '' : page}`, (req, res) => {
        res.render(page);
    });
});

const { protect, adminOnly, optionalAuth } = require('./middleware/auth');

// Explore Page SSR
app.get('/explore', optionalAuth, async (req, res) => {
    try {
        const { q, role, sort } = req.query;
        let query = { role: { $in: ['individual', 'company'] } };

        // Exclude the currently logged-in user
        if (req.user) {
            query._id = { $ne: req.user._id };
        }

        // Search by name, title, bio, skills, industry, companySize
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { title: { $regex: q, $options: 'i' } },
                { bio: { $regex: q, $options: 'i' } },
                { skills: { $regex: q, $options: 'i' } },
                { industry: { $regex: q, $options: 'i' } },
                { companySize: { $regex: q, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            query.role = role;
        }

        let sortObj = { createdAt: -1 }; 
        if (sort === 'oldest') sortObj = { createdAt: 1 };
        if (sort === 'rating') sortObj = { rating: -1, ratingCount: -1 };

        const users = await User.find(query).select('-password').sort(sortObj).limit(50);
        res.render('explore', { users });
    } catch (err) {
        console.error('SSR Explore Error:', err);
        res.render('explore', { users: [] });
    }
});
app.get('/explore.html', (req, res) => res.redirect('/explore'));

// Default route → index rendered in pages setup above

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`Global Error [${req.method} ${req.originalUrl}]:`, err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// 404 Handler for unknown API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// ─── Connect to MongoDB & Start Server ───────────────────────────────────────
const PORT     = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
        const server = app.listen(PORT, () => {
            console.log(`🚀 PortfolioHub Server running on http://localhost:${PORT}`);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Run: taskkill /F /IM node.exe`);
            } else {
                console.error('❌ Server error:', err.message);
            }
            process.exit(1);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

module.exports = app;
