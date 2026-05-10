// routes/messages.js
'use strict';

const express = require('express');
const router  = express.Router();

const {
    getConversations,
    getMessages,
    sendRequest,
    acceptRequest,
    declineRequest,
    sendMessage,
    createGroupChat
} = require('../controllers/messageController');

const { protect } = require('../middleware/auth');

// All message routes require authentication
router.use(protect);

// GET  /api/messages/conversations         — list all conversations for current user
router.get('/conversations',                getConversations);

// POST /api/messages/request               — send a new message request
router.post('/request',                     sendRequest);

// POST /api/messages/group                 — create a company team group chat
router.post('/group',                       createGroupChat);

// GET  /api/messages/:conversationId       — get messages in a conversation
router.get('/:conversationId',              getMessages);

// PUT  /api/messages/:conversationId/accept  — accept a message request
router.put('/:conversationId/accept',       acceptRequest);

// PUT  /api/messages/:conversationId/decline — decline a message request
router.put('/:conversationId/decline',      declineRequest);

// POST /api/messages/:conversationId       — send a message in accepted chat
router.post('/:conversationId',             sendMessage);

module.exports = router;
