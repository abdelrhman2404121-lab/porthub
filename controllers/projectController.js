// controllers/projectController.js — Project CRUD
'use strict';

const Project = require('../models/Project');
const User    = require('../models/User');

// ─── GET /api/projects ────────────────────────────────────────────────────────
/**
 * Get all public projects (for the Projects page).
 * Supports search by title/tech, sort.
 */
const getAllProjects = async (req, res) => {
    try {
        const { q, sort, page = 1, limit = 20 } = req.query;

        const filter = { isPublic: true };

        if (q) {
            filter.$or = [
                { title:       { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { technologies:{ $regex: q, $options: 'i' } }
            ];
        }

        let sortObj = { createdAt: -1 };
        if (sort === 'views') sortObj = { views: -1 };
        if (sort === 'likes') sortObj = { likes: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [projects, total] = await Promise.all([
            Project.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name profileImage title role'),
            Project.countDocuments(filter)
        ]);

        res.status(200).json({ success: true, total, projects });
    } catch (err) {
        console.error('getAllProjects error:', err);
        res.status(500).json({ success: false, message: 'Could not fetch projects.' });
    }
};

// ─── GET /api/projects/user/:userId ───────────────────────────────────────────
/**
 * Get all projects for a specific user (for profile page).
 */
const getUserProjects = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.params.userId, isPublic: true })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, projects });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch user projects.' });
    }
};

// ─── GET /api/projects/mine ────────────────────────────────────────────────────
/**
 * Get all projects for the logged-in user (including private ones).
 */
const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, projects });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch your projects.' });
    }
};

// ─── POST /api/projects ────────────────────────────────────────────────────────
/**
 * Create a new project for the authenticated user.
 */
const createProject = async (req, res) => {
    try {
        const { title, description, technologies, image, githubLink, liveDemo, link, desc, isPublic } = req.body;

        if (!title || (!description && !desc)) {
            return res.status(400).json({ success: false, message: 'Title and description are required.' });
        }

        const project = await Project.create({
            title,
            description: description || desc || '',
            desc:        desc || description || '',
            technologies: Array.isArray(technologies)
                ? technologies
                : (technologies ? technologies.split(',').map(t => t.trim()) : []),
            image:      image || '',
            githubLink: githubLink || '',
            liveDemo:   liveDemo || '',
            link:       link || liveDemo || githubLink || '',
            isPublic:   isPublic !== undefined ? isPublic : true,
            userId:     req.user._id
        });

        res.status(201).json({ success: true, message: 'Project created.', project });
    } catch (err) {
        console.error('createProject error:', err);
        res.status(500).json({ success: false, message: 'Could not create project.' });
    }
};

// ─── PUT /api/projects/:id ─────────────────────────────────────────────────────
/**
 * Update a project. Only the project owner can update.
 */
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        // Ownership check
        if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this project.' });
        }

        const allowedFields = ['title', 'description', 'desc', 'technologies', 'image', 'githubLink', 'liveDemo', 'link', 'isPublic'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'technologies' && typeof req.body[field] === 'string') {
                    project[field] = req.body[field].split(',').map(t => t.trim());
                } else {
                    project[field] = req.body[field];
                }
            }
        });

        await project.save();
        res.status(200).json({ success: true, message: 'Project updated.', project });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not update project.' });
    }
};

// ─── DELETE /api/projects/:id ──────────────────────────────────────────────────
/**
 * Delete a project. Owner or admin only.
 */
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this project.' });
        }

        await project.deleteOne();
        res.status(200).json({ success: true, message: 'Project deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not delete project.' });
    }
};

module.exports = {
    getAllProjects,
    getUserProjects,
    getMyProjects,
    createProject,
    updateProject,
    deleteProject
};
