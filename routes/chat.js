// chat-api/routes/chat.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatLimiter = require('../middleware/rateLimit');
const chatController = require('../controllers/chatController');

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message and get AI response
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId:
 *                 type: string
 *                 description: (Optional) ID of an existing conversation to continue.
 *                 example: 60c72b2f9f1b2c001c8e4d3a
 *               message:
 *                 type: string
 *                 description: The user's message content.
 *                 example: Tell me about artificial intelligence
 *     responses:
 *       200:
 *         description: AI response and token usage details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Artificial Intelligence (AI) is a branch of computer science...
 *                 conversationId:
 *                   type: string
 *                   example: 60c72b2f9f1b2c001c8e4d3a
 *                 tokensUsed:
 *                   type: number
 *                   example: 57
 *                 remainingTokens:
 *                   type: number
 *                   example: 99943
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Insufficient tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Insufficient tokens. Please top up your balance.
 *                 remainingTokens:
 *                   type: number
 *                   example: 10
 *       404:
 *         description: User or Conversation not found
 *       429:
 *         description: Too many requests (Rate limit exceeded)
 *       500:
 *         description: Server error
 */

router.post('/', auth, chatLimiter, chatController.sendMessage);

/**
 * @swagger
 * /api/chat/{conversationId}:
 *   get:
 *     summary: Retrieve chat history for a specific conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the conversation to retrieve.
 *         example: 60c72b2f9f1b2c001c8e4d3a
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60c72b2f9f1b2c001c8e4d3a
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                             example: user
 *                           content:
 *                             type: string
 *                             example: Tell me about artificial intelligence
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-29T10:30:00Z
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       404:
 *         description: Conversation not found or unauthorized
 *       500:
 *         description: Server error
 */

router.get('/:conversationId', auth, chatController.getConversationHistory);

/**
 * @swagger
 * /api/chat:
 *   get:
 *     summary: List user's conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 60c72b2f9f1b2c001c8e4d3a
 *                       lastMessage:
 *                         type: string
 *                         example: Tell me about artificial intelligence
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-29T10:30:01Z
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       500:
 *         description: Server error
 */

router.get('/', auth, chatController.listConversations);

module.exports = router;