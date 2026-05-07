// routes/projects.js
'use strict';

const express = require('express');
const router  = express.Router();

const {
    getAllProjects,
    getUserProjects,
    getMyProjects,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');

// GET /api/projects           — all public projects
router.get('/',                 getAllProjects);

// GET /api/projects/mine      — logged-in user's own projects
router.get('/mine',             protect, getMyProjects);

// GET /api/projects/user/:userId — projects by a specific user (public)
router.get('/user/:userId',     getUserProjects);

// POST /api/projects          — create new project
router.post('/',                protect, createProject);

// PUT /api/projects/:id       — update project (owner only)
router.put('/:id',              protect, updateProject);

// DELETE /api/projects/:id    — delete project (owner or admin)
router.delete('/:id',           protect, deleteProject);

module.exports = router;
