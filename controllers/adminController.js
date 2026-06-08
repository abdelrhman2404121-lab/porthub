// controllers/adminController.js — Full Admin Panel Controls
'use strict';

const User         = require('../models/User');
const Project      = require('../models/Project');
const Comment      = require('../models/Comment');
const Conversation = require('../models/Message');

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────
const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalIndividuals,
            totalCompanies,
            totalAdmins,
            blockedUsers,
            totalProjects,
            totalComments,
            totalConversations,
            onlineUsers
        ] = await Promise.all([
            User.countDocuments({ role: { $ne: 'admin' } }),
            User.countDocuments({ role: 'individual' }),
            User.countDocuments({ role: 'company' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ isBlocked: true }),
            Project.countDocuments(),
            Comment.countDocuments(),
            Conversation.countDocuments(),
            User.countDocuments({ isOnline: true })
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalIndividuals,
                totalCompanies,
                totalAdmins,
                blockedUsers,
                totalProjects,
                totalComments,
                totalConversations,
                onlineUsers
            }
        });
    } catch (err) {
        console.error('getStats error:', err);
        res.status(500).json({ success: false, message: 'Could not fetch stats.' });
    }
};

// ─── GET /api/admin/users ──────────────────────────────────────────────────────
/**
 * Get all users with full details. Supports search, role filter, pagination.
 */
const getAllUsers = async (req, res) => {
    try {
        const { q, role, status, page = 1, limit = 50 } = req.query;

        const filter = { role: { $ne: 'admin' } };

        if (role && ['individual', 'company'].includes(role)) filter.role = role;
        if (status === 'blocked')  filter.isBlocked = true;
        if (status === 'active')   filter.isBlocked = false;
        if (status === 'online')   filter.isOnline  = true;

        if (q) {
            filter.$or = [
                { name:  { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-password -ratedBy'),
            User.countDocuments(filter)
        ]);

        // Attach project count for each user
        const userIds    = users.map(u => u._id);
        const projCounts = await Project.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: '$userId', count: { $sum: 1 } } }
        ]);

        const projCountMap = {};
        projCounts.forEach(p => { projCountMap[p._id.toString()] = p.count; });

        const enriched = users.map(u => ({
            ...u.toObject(),
            projectCount: projCountMap[u._id.toString()] || 0
        }));

        res.status(200).json({ success: true, total, page: parseInt(page), users: enriched });
    } catch (err) {
        console.error('admin getAllUsers error:', err);
        res.status(500).json({ success: false, message: 'Could not fetch users.' });
    }
};

// ─── GET /api/admin/projects ───────────────────────────────────────────────────
/**
 * Get all projects with owner details.
 */
const getAllProjects = async (req, res) => {
    try {
        const { q, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (q) {
            filter.$or = [
                { title:       { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [projects, total] = await Promise.all([
            Project.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email profileImage role'),
            Project.countDocuments(filter)
        ]);

        res.status(200).json({ success: true, total, projects });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch projects.' });
    }
};

// ─── GET /api/admin/comments ───────────────────────────────────────────────────
const getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find()
            .sort({ createdAt: -1 })
            .populate('userId',       'name profileImage')
            .populate('targetUserId', 'name profileImage');

        res.status(200).json({ success: true, comments });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch comments.' });
    }
};

// ─── PUT /api/admin/users/:id ──────────────────────────────────────────────────
/**
 * Admin updates a user's name, email, title, role.
 */
const editUser = async (req, res) => {
    try {
        const { name, email, title, role } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // Prevent demoting/promoting to admin via this route
        if (name)  user.name  = name;
        if (email) user.email = email.toLowerCase();
        if (title) user.title = title;
        if (role && ['individual', 'company'].includes(role)) user.role = role;

        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, message: 'User updated.', user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not update user.' });
    }
};

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
/**
 * Admin permanently deletes a user and all their projects & comments.
 */
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        
        if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Cannot delete other admin accounts.' });
        }

        
        await Promise.all([
            Project.deleteMany({ userId: user._id }),
            Comment.deleteMany({ $or: [{ userId: user._id }, { targetUserId: user._id }] }),
            Conversation.deleteMany({ participants: user._id })
        ]);

        await user.deleteOne();
        res.status(200).json({ success: true, message: 'User and all associated data deleted.' });
    } catch (err) {
        console.error('deleteUser error:', err);
        res.status(500).json({ success: false, message: 'Could not delete user.' });
    }
};

// ─── PUT /api/admin/users/:id/block ───────────────────────────────────────────
/**
 * Toggle block/unblock status of a user.
 */
const toggleBlock = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot block admin accounts.' });
        }

        user.isBlocked = !user.isBlocked;
        if (user.isBlocked) user.isOnline = false;  // Force offline if blocked
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success:   true,
            message:   `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
            isBlocked: user.isBlocked
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not toggle block status.' });
    }
};

// ─── DELETE /api/admin/projects/:id ───────────────────────────────────────────
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        await project.deleteOne();
        res.status(200).json({ success: true, message: 'Project deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not delete project.' });
    }
};

// ─── DELETE /api/admin/comments/:id ───────────────────────────────────────────
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
        await comment.deleteOne();
        res.status(200).json({ success: true, message: 'Comment deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not delete comment.' });
    }
};

// ─── PUT /api/admin/comments/:id/hide ─────────────────────────────────────────
const hideComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

        comment.isHidden = !comment.isHidden;
        await comment.save();
        res.status(200).json({
            success:  true,
            message:  `Comment ${comment.isHidden ? 'hidden' : 'unhidden'}.`,
            isHidden: comment.isHidden
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not hide comment.' });
    }
};

module.exports = {
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
};
