// controllers/userController.js — User Profile, Settings, Ratings, Notifications
'use strict';

const User    = require('../models/User');
const Comment = require('../models/Comment');

// ─── GET /api/users ────────────────────────────────────────────────────────────
/**
 * Get all users for the Explore page.
 * Supports search (q), filter by role, sort.
 */
const getAllUsers = async (req, res) => {
    try {
        const { q, role, sort, page = 1, limit = 20 } = req.query;

        // Build filter object
        const filter = {};

        // Only show non-admin users publicly
        filter.role = { $in: ['individual', 'company'] };

        // Exclude the logged-in user from their own search results
        if (req.user) {
            filter._id = { $ne: req.user._id };
        }

        // Role filter
        if (role === 'individual' || role === 'company') {
            filter.role = role;
        }

        // Text search
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { bio: { $regex: q, $options: 'i' } },
                { title: { $regex: q, $options: 'i' } },
                { skills: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } },
                { industry: { $regex: q, $options: 'i' } }
            ];
        }

        // Sort options
        let sortObj = { createdAt: -1 }; // Default: newest
        if (sort === 'rating') sortObj = { rating: -1 };
        if (sort === 'name')   sortObj = { name: 1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-password -ratedBy -notifications -requests'),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            users
        });
    } catch (err) {
        console.error('getAllUsers error:', err);
        res.status(500).json({ success: false, message: 'Could not fetch users.' });
    }
};

// ─── GET /api/users/:id ────────────────────────────────────────────────────────
/**
 * Get a single user's public profile.
 * If a viewer is authenticated, tracks profile view and adds notification.
 */
const getUserById = async (req, res) => {
    try {
        const profileUser = await User.findById(req.params.id)
            .select('-password -ratedBy')
            .populate('team.userId', 'name profileImage title');

        if (!profileUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Track profile view (if viewer is a different authenticated user)
        if (req.user && req.user._id.toString() !== req.params.id) {
            const viewerId  = req.user._id;
            const viewerDoc = req.user;

            // Prevent duplicate viewer entries
            const alreadyViewed = profileUser.viewers.some(
                v => v.userId && v.userId.toString() === viewerId.toString()
            );

            if (!alreadyViewed) {
                // Add viewer
                profileUser.viewers.unshift({
                    userId:   viewerId,
                    name:     viewerDoc.name,
                    avatar:   viewerDoc.profileImage,
                    role:     viewerDoc.role,
                    viewedAt: new Date()
                });

                // Keep only recent 20 viewers
                if (profileUser.viewers.length > 20) profileUser.viewers.pop();

                // Add notification for profile owner
                profileUser.notifications.unshift({
                    text:  `<strong>${viewerDoc.name}</strong> viewed your profile.`,
                    type:  'view',
                    read:  false,
                    link:  `/profile.html?id=${viewerId}`,
                    createdAt: new Date()
                });

                // Keep only recent 30 notifications
                if (profileUser.notifications.length > 30) profileUser.notifications.pop();

                await profileUser.save({ validateBeforeSave: false });
            }
        }

        let userData = profileUser.toObject();

        // If the user is an individual, find which companies they belong to
        if (userData.role === 'individual') {
            const memberCompanies = await User.find({ 
                role: 'company', 
                'team.userId': userData._id 
            }).select('_id name profileImage');
            userData.companies = memberCompanies;
        }

        res.status(200).json({ success: true, user: userData });
    } catch (err) {
        console.error('getUserById error:', err);
        res.status(500).json({ success: false, message: 'Could not fetch user profile.' });
    }
};

// ─── PUT /api/users/profile ────────────────────────────────────────────────────
/**
 * Update the authenticated user's profile.
 * Handles both individual and company fields.
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user   = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // ── Shared fields (both individual & company) ──────────────────────
        const sharedFields = ['name', 'title', 'bio', 'phone', 'location', 'website', 'profileImage'];
        sharedFields.forEach(field => {
            if (req.body[field] !== undefined) user[field] = req.body[field];
        });

        // Social links
        if (req.body.socialLinks) {
            user.socialLinks = { ...user.socialLinks.toObject(), ...req.body.socialLinks };
        }

        // ── Individual-specific fields ─────────────────────────────────────
        if (user.role === 'individual') {
            if (req.body.cvUrl !== undefined) user.cvUrl = req.body.cvUrl;
        }

        // ── Company-specific fields ────────────────────────────────────────
        if (user.role === 'company') {
            const companyFields = ['industry', 'companySize', 'founded', 'headquarters', 'brochureUrl'];
            companyFields.forEach(field => {
                if (req.body[field] !== undefined) user[field] = req.body[field];
            });
        }

        await user.save({ validateBeforeSave: false });

        const updated = await User.findById(userId).select('-password -ratedBy');
        res.status(200).json({ success: true, message: 'Profile updated successfully.', user: updated });
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ success: false, message: 'Could not update profile.' });
    }
};

// ─── PUT /api/users/settings ────────────────────────────────────────────────────
/**
 * Update privacy settings and/or change password.
 */
const updateSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // Privacy settings
        if (req.body.settings) {
            user.settings = { ...user.settings.toObject(), ...req.body.settings };
        }

        // Password change
        if (req.body.currentPassword && req.body.newPassword) {
            const isMatch = await user.comparePassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
            }

            const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
            if (!passRegex.test(req.body.newPassword)) {
                return res.status(400).json({ success: false, message: 'New password must be at least 8 characters with a letter and a number.' });
            }

            user.password = req.body.newPassword; // Will be hashed by pre-save hook
        }

        await user.save();

        res.status(200).json({ success: true, message: 'Settings updated successfully.' });
    } catch (err) {
        console.error('updateSettings error:', err);
        res.status(500).json({ success: false, message: 'Could not update settings.' });
    }
};

// ─── POST /api/users/skills ────────────────────────────────────────────────────
const addSkill = async (req, res) => {
    try {
        const { skill } = req.body;
        if (!skill) return res.status(400).json({ success: false, message: 'Skill is required.' });

        const user = await User.findById(req.user._id);
        if (user.skills.includes(skill)) {
            return res.status(400).json({ success: false, message: 'Skill already added.' });
        }

        user.skills.push(skill);
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, skills: user.skills });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not add skill.' });
    }
};

// ─── DELETE /api/users/skills/:skill ─────────────────────────────────────────
const removeSkill = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.skills = user.skills.filter(s => s !== decodeURIComponent(req.params.skill));
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, skills: user.skills });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not remove skill.' });
    }
};

// ─── POST /api/users/experience ───────────────────────────────────────────────
const addExperience = async (req, res) => {
    try {
        const { role, company, years, description } = req.body;
        if (!role || !company) return res.status(400).json({ success: false, message: 'Role and company are required.' });

        const user = await User.findById(req.user._id);
        user.experience.push({ role, company, years, description });
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, experience: user.experience });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not add experience.' });
    }
};

// ─── DELETE /api/users/experience/:id ────────────────────────────────────────
const removeExperience = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.experience = user.experience.filter(e => e._id.toString() !== req.params.id);
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, experience: user.experience });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not remove experience.' });
    }
};

// ─── POST /api/users/education ────────────────────────────────────────────────
const addEducation = async (req, res) => {
    try {
        const { degree, school, year, description } = req.body;
        if (!degree || !school) return res.status(400).json({ success: false, message: 'Degree and school are required.' });

        const user = await User.findById(req.user._id);
        user.education.push({ degree, school, year, description });
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, education: user.education });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not add education.' });
    }
};

// ─── DELETE /api/users/education/:id ─────────────────────────────────────────
const removeEducation = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.education = user.education.filter(e => e._id.toString() !== req.params.id);
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, education: user.education });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not remove education.' });
    }
};

// ─── POST /api/users/:id/rate ──────────────────────────────────────────────────
/**
 * Rate another user (1-5 stars). Each user can only rate once.
 */
const rateUser = async (req, res) => {
    try {
        const { rating } = req.body;
        const ratingVal  = parseInt(rating);

        if (!ratingVal || ratingVal < 1 || ratingVal > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ success: false, message: 'You cannot rate yourself.' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

        // Check if already rated
        if (targetUser.ratedBy.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: 'You have already rated this user.' });
        }

        // Recalculate average rating
        const currentTotal  = (targetUser.rating || 0) * (targetUser.ratingCount || 0);
        targetUser.ratingCount += 1;
        targetUser.rating = (currentTotal + ratingVal) / targetUser.ratingCount;
        targetUser.ratedBy.push(req.user._id);

        // Add notification to target user
        targetUser.notifications.unshift({
            text:  `<strong>${req.user.name}</strong> gave you a ${ratingVal}★ rating.`,
            type:  'rating',
            read:  false,
            link:  `/profile.html?id=${req.user._id}`,
            createdAt: new Date()
        });
        if (targetUser.notifications.length > 30) targetUser.notifications.pop();

        await targetUser.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'Rating submitted.',
            rating:  parseFloat(targetUser.rating.toFixed(1)),
            ratingCount: targetUser.ratingCount
        });
    } catch (err) {
        console.error('rateUser error:', err);
        res.status(500).json({ success: false, message: 'Could not submit rating.' });
    }
};

// ─── GET /api/users/notifications ─────────────────────────────────────────────
const getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notifications');
        res.status(200).json({ success: true, notifications: user.notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch notifications.' });
    }
};

// ─── PUT /api/users/notifications/read ────────────────────────────────────────
const markNotificationsRead = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $set: { 'notifications.$[].read': true }
        });
        res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not mark notifications.' });
    }
};

// ─── GET /api/users/viewers ────────────────────────────────────────────────────
const getViewers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('viewers');
        res.status(200).json({ success: true, viewers: user.viewers });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch viewers.' });
    }
};

// ─── POST /api/users/:id/request ──────────────────────────────────────────────
/**
 * Send a join/invite connection request to another user.
 */
const sendConnectRequest = async (req, res) => {
    try {
        const { type } = req.body; // 'join' or 'invite'
        if (!type || !['join', 'invite'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Request type must be join or invite.' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

        // Check if request already pending
        const existingReq = targetUser.requests.find(
            r => r.fromId.toString() === req.user._id.toString() && r.status === 'pending'
        );
        if (existingReq) {
            return res.status(400).json({ success: false, message: 'Request already pending.' });
        }

        targetUser.requests.push({
            fromId:     req.user._id,
            fromName:   req.user.name,
            fromAvatar: req.user.profileImage,
            toId:       targetUser._id,
            type,
            status:     'pending',
            date:       new Date()
        });

        // Notification
        targetUser.notifications.unshift({
            text:  `<strong>${req.user.name}</strong> sent you a ${type === 'join' ? 'join request' : 'team invite'}.`,
            type:  'request',
            read:  false,
            link:  `/profile.html?id=${req.user._id}`,
            createdAt: new Date()
        });
        if (targetUser.notifications.length > 30) targetUser.notifications.pop();

        await targetUser.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, message: 'Request sent.' });
    } catch (err) {
        console.error('sendConnectRequest error:', err);
        res.status(500).json({ success: false, message: 'Could not send request.' });
    }
};

// ─── PUT /api/users/requests/:id ──────────────────────────────────────────────
/**
 * Accept or decline a connection request.
 * Body: { status: 'accepted' | 'declined' }
 */
const handleConnectRequest = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be accepted or declined.' });
        }

        const currentUser = await User.findById(req.user._id);
        const reqItem = currentUser.requests.id(req.params.id);
        if (!reqItem) return res.status(404).json({ success: false, message: 'Request not found.' });

        reqItem.status = status;

        // If accepted and type is 'join': individual joins company team
        if (status === 'accepted' && reqItem.type === 'join') {
            const individual = await User.findById(reqItem.fromId);
            if (individual && currentUser.role === 'company') {
                const alreadyInTeam = currentUser.team.some(t => String(t.userId) === String(individual._id));
                if (!alreadyInTeam) {
                    currentUser.team.push({
                        userId: individual._id,
                        name:   individual.name,
                        role:   individual.title || 'Team Member',
                        avatar: individual.profileImage,
                        status: 'accepted'
                    });
                }
            }
        }

        // If accepted and type is 'invite': company invited individual, individual accepts
        if (status === 'accepted' && reqItem.type === 'invite') {
            const company = await User.findById(reqItem.fromId);
            if (company && company.role === 'company' && currentUser.role === 'individual') {
                const alreadyInTeam = company.team.some(t => String(t.userId) === String(currentUser._id));
                if (!alreadyInTeam) {
                    company.team.push({
                        userId: currentUser._id,
                        name:   currentUser.name,
                        role:   currentUser.title || 'Team Member',
                        avatar: currentUser.profileImage,
                        status: 'accepted'
                    });
                    await company.save({ validateBeforeSave: false });
                }
            }
        }

        await currentUser.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, message: `Request ${status}.` });
    } catch (err) {
        console.error('handleConnectRequest error:', err);
        res.status(500).json({ success: false, message: 'Could not handle request.' });
    }
};

// ─── DELETE /api/users/:companyId/team/:memberId ──────────────────────────────
/**
 * Remove a team member.
 * If user is company, they can remove any member from their team.
 * If user is individual, they can remove themselves from a company's team.
 */
const removeTeamMember = async (req, res) => {
    try {
        const { companyId, memberId } = req.params;
        
        // Authorization check
        if (req.user.role === 'company' && req.user._id.toString() !== companyId) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this company.' });
        }
        if (req.user.role === 'individual' && req.user._id.toString() !== memberId) {
            return res.status(403).json({ success: false, message: 'Not authorized to remove this member.' });
        }

        const company = await User.findById(companyId);
        if (!company || company.role !== 'company') {
            return res.status(404).json({ success: false, message: 'Company not found.' });
        }

        const initialLength = company.team.length;
        company.team = company.team.filter(t => String(t.userId) !== memberId);

        if (company.team.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Member not found in team.' });
        }

        await company.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, message: 'Team member removed.', team: company.team });
    } catch (err) {
        console.error('removeTeamMember error:', err);
        res.status(500).json({ success: false, message: 'Could not remove team member.' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateProfile,
    updateSettings,
    addSkill,
    removeSkill,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    rateUser,
    getNotifications,
    markNotificationsRead,
    getViewers,
    sendConnectRequest,
    handleConnectRequest,
    removeTeamMember
};
