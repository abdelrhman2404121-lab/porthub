// routes/admin.js
'use strict';

const express = require('express');
const router  = express.Router();

const {
    getStats,
    getAllUsers,
    getAllProjects,
    getAllComments,
    editUser,
    deleteUser,
    toggleBlock,
    deleteProject,
    deleteComment,
    hideComment
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require login + admin role
router.use(protect, adminOnly);

router.get('/stats',                    getStats);

// Users
router.get('/users',                    getAllUsers);
router.put('/users/:id',                editUser);
router.delete('/users/:id',             deleteUser);
router.put('/users/:id/block',          toggleBlock);

// Projects
router.get('/projects',                 getAllProjects);
router.delete('/projects/:id',          deleteProject);

// Comments
router.get('/comments',                 getAllComments);
router.delete('/comments/:id',          deleteComment);
router.put('/comments/:id/hide',        hideComment);

module.exports = router;
