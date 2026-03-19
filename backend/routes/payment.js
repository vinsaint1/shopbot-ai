const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');

const router = express.Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// POST /api/payment/initialize — Start payment
router.post('/initialize', protect, async (req, res) => {
    try {
        const { email, amount, orderId, callbackUrl } = req.body;

        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                email,
                amount: Math.round(amount * 100), // Paystack expects amount in kobo/cents
                callback_url: callbackUrl || `${process.env.FRONTEND_URL}/checkout/verify`,
                metadata: {
                    orderId,
                    userId: req.user._id.toString()
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            message: 'Payment initialization failed',
            error: error.response?.data || error.message
        });
    }
});

// GET /api/payment/verify/:reference — Verify payment
router.get('/verify/:reference', protect, async (req, res) => {
    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${req.params.reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`
                }
            }
        );

        const { data } = response.data;

        if (data.status === 'success') {
            // Update order payment status
            const Order = require('../models/Order');
            const orderId = data.metadata?.orderId;
            if (orderId) {
                await Order.findByIdAndUpdate(orderId, {
                    isPaid: true,
                    paidAt: new Date(),
                    paymentRef: data.reference,
                    status: 'confirmed'
                });
            }
        }

        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            message: 'Payment verification failed',
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;
