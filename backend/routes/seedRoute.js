const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

router.get('/', async (req, res) => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});

        // Create admin user
        await User.create({
            name: 'Admin',
            email: 'admin@shopbot.com',
            password: 'admin123',
            role: 'admin'
        });

        // Create test user
        await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            role: 'user'
        });

        // Sample products
        const products = [
            {
                name: 'Wireless Bluetooth Headphones',
                description: 'Premium noise-cancelling wireless headphones with 30-hour battery life. Features deep bass, crystal clear audio, and comfortable over-ear design. Perfect for music lovers and remote workers.',
                price: 25000,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                stock: 50,
                rating: 4.5,
                numReviews: 128,
                featured: true,
                tags: ['headphones', 'wireless', 'bluetooth', 'audio']
            },
            {
                name: 'Smart Watch Pro',
                description: 'Advanced smartwatch with heart rate monitor, GPS, sleep tracking, and 7-day battery. Water-resistant up to 50m. Compatible with iOS and Android.',
                price: 45000,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                stock: 30,
                rating: 4.3,
                numReviews: 85,
                featured: true,
                tags: ['smartwatch', 'fitness', 'health', 'wearable']
            },
            {
                name: 'Laptop Backpack',
                description: 'Sleek, water-resistant laptop backpack with USB charging port. Fits 15.6" laptops with padded compartment. Multiple pockets for organization.',
                price: 12000,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
                stock: 100,
                rating: 4.7,
                numReviews: 245,
                featured: true,
                tags: ['backpack', 'laptop', 'travel', 'bag']
            },
            {
                name: 'Men\'s Classic Cotton Shirt',
                description: 'Premium quality 100% cotton formal shirt. Available in multiple colors. Slim fit design with wrinkle-free fabric.',
                price: 8500,
                category: 'Clothing',
                image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400',
                stock: 200,
                rating: 4.2,
                numReviews: 167,
                featured: false,
                tags: ['shirt', 'formal', 'cotton', 'men']
            },
            {
                name: 'Running Shoes Ultra',
                description: 'Lightweight running shoes with advanced cushioning technology. Breathable mesh upper, responsive foam midsole. Perfect for daily runs and marathon training.',
                price: 18000,
                category: 'Sports',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                stock: 75,
                rating: 4.6,
                numReviews: 312,
                featured: true,
                tags: ['shoes', 'running', 'sports', 'fitness']
            },
            {
                name: 'Ceramic Coffee Mug Set',
                description: 'Set of 4 handcrafted ceramic coffee mugs. Microwave and dishwasher safe. Elegant design perfect for home or office.',
                price: 5500,
                category: 'Home & Kitchen',
                image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
                stock: 150,
                rating: 4.4,
                numReviews: 89,
                featured: false,
                tags: ['mug', 'coffee', 'kitchen', 'ceramic']
            },
            {
                name: 'JavaScript: The Definitive Guide',
                description: 'The comprehensive guide to JavaScript programming. Covers ES6+, async programming, Node.js, and modern web development patterns. 7th Edition.',
                price: 7500,
                category: 'Books',
                image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
                stock: 60,
                rating: 4.8,
                numReviews: 432,
                featured: true,
                tags: ['book', 'javascript', 'programming', 'education']
            },
            {
                name: 'Organic Skincare Set',
                description: 'Complete skincare routine with cleanser, toner, moisturizer, and serum. Made from 100% natural ingredients. Suitable for all skin types.',
                price: 15000,
                category: 'Beauty',
                image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
                stock: 40,
                rating: 4.5,
                numReviews: 178,
                featured: true,
                tags: ['skincare', 'organic', 'beauty', 'natural']
            },
            {
                name: 'Wireless Mechanical Keyboard',
                description: 'RGB mechanical keyboard with hot-swappable switches. Bluetooth and 2.4GHz wireless connectivity. Rechargeable with 200-hour battery life.',
                price: 22000,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
                stock: 45,
                rating: 4.6,
                numReviews: 156,
                featured: false,
                tags: ['keyboard', 'mechanical', 'wireless', 'gaming']
            },
            {
                name: 'Yoga Mat Premium',
                description: 'Extra thick 6mm non-slip yoga mat. Eco-friendly TPE material with alignment lines. Includes carrying strap.',
                price: 6500,
                category: 'Sports',
                image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
                stock: 120,
                rating: 4.3,
                numReviews: 94,
                featured: false,
                tags: ['yoga', 'mat', 'fitness', 'exercise']
            },
            {
                name: 'Smart LED Desk Lamp',
                description: 'Adjustable LED desk lamp with wireless charging pad. 5 color temperatures, touch controls, and USB port. Eye-care technology reduces strain.',
                price: 9500,
                category: 'Home & Kitchen',
                image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400',
                stock: 80,
                rating: 4.4,
                numReviews: 112,
                featured: false,
                tags: ['lamp', 'desk', 'LED', 'smart']
            },
            {
                name: 'Women\'s Denim Jacket',
                description: 'Classic denim jacket with modern fit. Premium quality denim, metal buttons, and adjustable waist tabs. Versatile style for any occasion.',
                price: 14000,
                category: 'Clothing',
                image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
                stock: 65,
                rating: 4.1,
                numReviews: 73,
                featured: false,
                tags: ['jacket', 'denim', 'women', 'fashion']
            }
        ];

        await Product.insertMany(products);
        res.json({ success: true, message: `12 Products created and Database seeded successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
