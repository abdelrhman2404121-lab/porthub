// app.js — PortfolioHub Express Server Entry Point
'use strict';

const express    = require('express');
const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
const path       = require('path');
const cors       = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files (CSS, JS, Images) ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/comments', require('./routes/comments'));

// ─── Serve HTML Views ────────────────────────────────────────────────────────
// Each HTML page is served from the /views directory
const viewsDir = path.join(__dirname, 'views');

const pages = [
    'index', 'login', 'register', 'dashboard', 'profile',
    'explore', 'projects', 'messages', 'settings',
    'about', 'contact', 'admin'
];

pages.forEach(page => {
    app.get(`/${page === 'index' ? '' : page}`, (req, res) => {
        res.sendFile(path.join(viewsDir, `${page}.html`));
    });
    // Also serve with .html extension
    app.get(`/${page}.html`, (req, res) => {
        res.sendFile(path.join(viewsDir, `${page}.html`));
    });
});

// Default route → index
app.get('/', (req, res) => {
    res.sendFile(path.join(viewsDir, 'index.html'));
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Global Error:', err.stack);
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
