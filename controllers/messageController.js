// controllers/messageController.js — Request-based Chat Messaging
'use strict';

const Conversation = require('../models/Message');
const User         = require('../models/User');

// ─── GET /api/messages/conversations ──────────────────────────────────────────
/**
 * Get all conversations (accepted and pending) for the current user.
 */
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .sort({ lastMessageAt: -1 })
            .populate('participants', 'name profileImage title role isOnline lastSeen');

        res.status(200).json({ success: true, conversations });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch conversations.' });
    }
};

// ─── GET /api/messages/:conversationId ────────────────────────────────────────
/**
 * Get messages in a specific conversation.
 * Marks messages sent by the other party as read.
 */
const getMessages = async (req, res) => {
    try {
        const convo = await Conversation.findById(req.params.conversationId)
            .populate('participants', 'name profileImage title role isOnline lastSeen');

        if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found.' });

        // Check participant
        const isParticipant = convo.participants.some(p => p._id.toString() === req.user._id.toString());
        if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied.' });

        // Mark incoming messages as read
        let updated = false;
        convo.messages.forEach(msg => {
            if (msg.senderId.toString() !== req.user._id.toString() && !msg.isRead) {
                msg.isRead = true;
                updated = true;
            }
        });
        if (updated) await convo.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, conversation: convo });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not fetch messages.' });
    }
};

// ─── POST /api/messages/request ───────────────────────────────────────────────
/**
 * Send a message request to a user (first contact).
 * Creates a pending conversation with the opening message.
 */
const sendRequest = async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        if (!receiverId || !message) {
            return res.status(400).json({ success: false, message: 'Receiver and message are required.' });
        }

        if (receiverId === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot message yourself.' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ success: false, message: 'Receiver not found.' });

        // Check if a conversation already exists
        const existing = await Conversation.findOne({
            participants: { $all: [req.user._id, receiverId] }
        });

        if (existing) {
            // If already accepted, tell the client to just send a normal message
            if (existing.status === 'accepted') {
                return res.status(200).json({
                    success:      true,
                    alreadyExists: true,
                    conversation: existing
                });
            }
            // If pending, update the request message
            existing.requestMessage = message;
            existing.lastMessageAt  = new Date();
            await existing.save({ validateBeforeSave: false });
            return res.status(200).json({ success: true, conversation: existing });
        }

        // Create new pending conversation
        const convo = await Conversation.create({
            participants:   [req.user._id, receiverId],
            requestedBy:    req.user._id,
            requestMessage: message,
            status:         'pending',
            messages: [{
                senderId:  req.user._id,
                text:      message,
                createdAt: new Date()
            }],
            lastMessageAt:   new Date(),
            lastMessageText: message
        });

        // Notify the receiver
        receiver.notifications.unshift({
            text:  `<strong>${req.user.name}</strong> sent you a message request.`,
            type:  'message',
            read:  false,
            link:  `/messages.html`,
            createdAt: new Date()
        });
        if (receiver.notifications.length > 30) receiver.notifications.pop();
        await receiver.save({ validateBeforeSave: false });

        res.status(201).json({ success: true, conversation: convo });
    } catch (err) {
        console.error('sendRequest error:', err);
        res.status(500).json({ success: false, message: 'Could not send request.' });
    }
};

// ─── PUT /api/messages/:conversationId/accept ─────────────────────────────────
/**
 * Accept a pending message request.
 */
const acceptRequest = async (req, res) => {
    try {
        const convo = await Conversation.findById(req.params.conversationId);
        if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found.' });

        const isReceiver = convo.participants.some(p => p.toString() === req.user._id.toString())
            && convo.requestedBy.toString() !== req.user._id.toString();

        if (!isReceiver) return res.status(403).json({ success: false, message: 'Only the receiver can accept this request.' });

        convo.status = 'accepted';
        await convo.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, message: 'Request accepted.', conversation: convo });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not accept request.' });
    }
};

// ─── PUT /api/messages/:conversationId/decline ────────────────────────────────
/**
 * Decline and delete a pending message request.
 */
const declineRequest = async (req, res) => {
    try {
        const convo = await Conversation.findById(req.params.conversationId);
        if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found.' });

        await convo.deleteOne();
        res.status(200).json({ success: true, message: 'Request declined.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not decline request.' });
    }
};

// ─── POST /api/messages/:conversationId ───────────────────────────────────────
/**
 * Send a message inside an accepted conversation.
 */
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message text is required.' });
        }

        const convo = await Conversation.findById(req.params.conversationId);
        if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found.' });

        if (convo.status !== 'accepted') {
            return res.status(400).json({ success: false, message: 'Conversation is not accepted yet.' });
        }

        const isParticipant = convo.participants.some(p => p.toString() === req.user._id.toString());
        if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied.' });

        const newMsg = {
            senderId:  req.user._id,
            text:      message.trim(),
            isRead:    false,
            createdAt: new Date()
        };

        convo.messages.push(newMsg);
        convo.lastMessageAt   = new Date();
        convo.lastMessageText = message.trim();

        await convo.save({ validateBeforeSave: false });

        res.status(201).json({ success: true, message: convo.messages[convo.messages.length - 1] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Could not send message.' });
    }
};

// ─── POST /api/messages/group ────────────────────────────────────────────────
/**
 * Create a company team group chat.
 * Automatically adds all team members as participants.
 */
const createGroupChat = async (req, res) => {
    try {
        if (req.user.role !== 'company') {
            return res.status(403).json({ success: false, message: 'Only companies can create group chats.' });
        }

        const { groupName, memberIds } = req.body;
        if (!groupName) {
            return res.status(400).json({ success: false, message: 'Group name is required.' });
        }

        let teamMembers = [];
        if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
            // Verify that the provided IDs are actually in the team
            teamMembers = req.user.team
                .filter(t => memberIds.includes(t.userId?.toString() || t.userId))
                .map(t => t.userId);
        } else {
            // Fallback: Gather all team members if none selected
            teamMembers = req.user.team.map(t => t.userId);
        }
        
        if (teamMembers.length === 0) {
            return res.status(400).json({ success: false, message: 'No team members selected to create a group chat.' });
        }

        // Include the company itself
        const participants = [req.user._id, ...teamMembers];

        // Create the group conversation
        const convo = await Conversation.create({
            participants,
            isGroup: true,
            groupName: groupName.trim(),
            status: 'accepted', // Group chats don't need individual acceptances
            requestMessage: `Welcome to the ${groupName.trim()} group chat!`,
            requestedBy: req.user._id,
            lastMessageAt: new Date(),
            lastMessageText: 'Group chat created.'
        });

        res.status(201).json({ success: true, conversation: convo });
    } catch (err) {
        console.error('Group Chat Error:', err);
        res.status(500).json({ success: false, message: 'Could not create group chat.' });
    }
};
module.exports = {
    getConversations,
    getMessages,
    sendRequest,
    acceptRequest,
    declineRequest,
    sendMessage,
    createGroupChat
};
