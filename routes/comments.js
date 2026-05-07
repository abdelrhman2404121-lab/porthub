// routes/comments.js
'use strict';

const express = require('express');
const router  = express.Router();

const {
    getComments,
    addComment,
    deleteComment,
    toggleHideComment
} = require('../controllers/commentController');

const { protect, adminOnly } = require('../middleware/auth');

// GET /api/comments/:userId       — get comments on a profile (public)
router.get('/:userId',              getComments);

// POST /api/comments/:userId      — add a comment (must be logged in)
router.post('/:userId',             protect, addComment);

// DELETE /api/comments/:id        — delete a comment (author or admin)
router.delete('/:id',               protect, deleteComment);

// PUT /api/comments/:id/hide      — admin hide/unhide comment
router.put('/:id/hide',             protect, adminOnly, toggleHideComment);

module.exports = router;
