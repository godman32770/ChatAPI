// chat-api/routes/chat.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatLimiter = require('../middleware/rateLimit');
const chatController = require('../controllers/chatController');

// @route   POST /api/chat
// @desc    Send a message and get AI response
// @access  Private (requires authentication and rate limiting)
router.post('/', auth, chatLimiter, chatController.sendMessage);

// @route   GET /api/chat/:conversationId
// @desc    Retrieve chat history for a specific conversation
// @access  Private
router.get('/:conversationId', auth, chatController.getConversationHistory);

// @route   GET /api/conversations
// @desc    List user's conversations
// @access  Private
router.get('/', auth, chatController.listConversations);

module.exports = router;