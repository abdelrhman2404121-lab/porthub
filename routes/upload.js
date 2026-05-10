// routes/upload.js — File upload handling with Multer
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');

// Setup storage configuration for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Setup upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max size
    fileFilter: function (req, file, cb) {
        // Accept images, PDFs, Word docs, Excel, PowerPoint, Text, and Archives
        const filetypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar|7z/;
        const mimetype = filetypes.test(file.mimetype) || file.mimetype.includes('zip') || file.mimetype.includes('compressed') || file.mimetype.includes('document') || file.mimetype.includes('sheet') || file.mimetype.includes('presentation') || file.mimetype.includes('text');
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports images, documents, and archives.'));
    }
});

/**
 * POST /api/upload
 * Upload a single file (image or pdf)
 * Requires authentication
 */
router.post('/', protect, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Return the public URL to the file
        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            url: fileUrl
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, message: err.message || 'File upload failed' });
    }
});

module.exports = router;
