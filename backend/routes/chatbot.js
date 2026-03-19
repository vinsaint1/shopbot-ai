const express = require('express');
const Chat = require('../models/Chat');
const { processChat } = require('../services/chatbot');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/chat — Send message and get AI response
router.post('/', protect, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Get or create chat session for user
        let chat = await Chat.findOne({ user: req.user._id, sessionActive: true });
        if (!chat) {
            chat = new Chat({ user: req.user._id, messages: [] });
        }

        // Add user message
        chat.messages.push({ role: 'user', content: message });

        // Build messages for OpenAI (last 20 messages for context window)
        const recentMessages = chat.messages.slice(-20).map(m => ({
            role: m.role,
            content: m.content
        }));

        // Get AI response
        const aiResponse = await processChat(recentMessages, req.user._id);

        // Add assistant message
        chat.messages.push({
            role: 'assistant',
            content: aiResponse.content,
            productCards: aiResponse.productCards?.map(p => ({
                productId: p.id?.toString(),
                name: p.name,
                price: typeof p.price === 'string' ? parseFloat(p.price.replace(/[₦,]/g, '')) : p.price,
                image: p.image,
                category: p.category
            }))
        });

        await chat.save();

        res.json({
            response: aiResponse.content,
            productCards: aiResponse.productCards || []
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: 'Failed to process message. Please try again.' });
    }
});

// GET /api/chat/history — Get chat history
router.get('/history', protect, async (req, res) => {
    try {
        const chat = await Chat.findOne({ user: req.user._id, sessionActive: true });
        if (!chat) {
            return res.json({ messages: [] });
        }

        res.json({
            messages: chat.messages.slice(-50).map(m => ({
                role: m.role,
                content: m.content,
                productCards: m.productCards,
                timestamp: m.timestamp
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/chat/clear — Clear chat history
router.post('/clear', protect, async (req, res) => {
    try {
        await Chat.findOneAndUpdate(
            { user: req.user._id, sessionActive: true },
            { sessionActive: false }
        );
        res.json({ message: 'Chat cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
