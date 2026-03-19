const OpenAI = require('openai');
const Product = require('../models/Product');
const Order = require('../models/Order');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define functions the AI can call to access our database
const tools = [
    {
        type: 'function',
        function: {
            name: 'search_products',
            description: 'Search for products in the store by name, category, or keyword. Use this when a customer asks about available products, wants recommendations, or is looking for something specific.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search term (product name, keyword, or description)' },
                    category: {
                        type: 'string',
                        description: 'Product category to filter by',
                        enum: ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Food', 'Other']
                    },
                    maxPrice: { type: 'number', description: 'Maximum price filter' },
                    limit: { type: 'number', description: 'Number of results to return (default 5)' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_product_details',
            description: 'Get detailed information about a specific product by its ID. Use when a customer asks for details about a particular product.',
            parameters: {
                type: 'object',
                properties: {
                    productId: { type: 'string', description: 'The product ID' }
                },
                required: ['productId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'track_order',
            description: 'Look up the status and details of an order. Use when a customer wants to check on their order status, delivery date, or tracking information.',
            parameters: {
                type: 'object',
                properties: {
                    orderId: { type: 'string', description: 'The order ID to track' }
                },
                required: ['orderId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_user_orders',
            description: 'Get all orders for the current user. Use when a customer asks about their order history or recent purchases.',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Number of recent orders to return (default 5)' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_recommendations',
            description: 'Get product recommendations based on category or popularity. Use when a customer asks for recommendations or wants to see popular/featured products.',
            parameters: {
                type: 'object',
                properties: {
                    category: { type: 'string', description: 'Category to get recommendations from' },
                    limit: { type: 'number', description: 'Number of recommendations (default 4)' }
                }
            }
        }
    }
];

// Execute tool calls — these query our actual database
async function executeFunction(name, args, userId) {
    switch (name) {
        case 'search_products': {
            const query = {};
            if (args.query) {
                query.$or = [
                    { name: { $regex: args.query, $options: 'i' } },
                    { description: { $regex: args.query, $options: 'i' } },
                    { tags: { $in: [new RegExp(args.query, 'i')] } }
                ];
            }
            if (args.category) query.category = args.category;
            if (args.maxPrice) query.price = { $lte: args.maxPrice };

            const products = await Product.find(query)
                .limit(args.limit || 5)
                .select('name price category image stock rating description');

            return products.map(p => ({
                id: p._id,
                name: p.name,
                price: `₦${p.price.toLocaleString()}`,
                category: p.category,
                image: p.image,
                inStock: p.stock > 0,
                rating: p.rating,
                description: p.description?.substring(0, 100)
            }));
        }

        case 'get_product_details': {
            try {
                const product = await Product.findById(args.productId);
                if (!product) return { error: 'Product not found' };
                return {
                    id: product._id,
                    name: product.name,
                    description: product.description,
                    price: `₦${product.price.toLocaleString()}`,
                    category: product.category,
                    image: product.image,
                    inStock: product.stock > 0,
                    stock: product.stock,
                    rating: product.rating,
                    numReviews: product.numReviews
                };
            } catch (err) {
                return { error: 'Invalid Product ID format. Please check the ID and try again.' };
            }
        }

        case 'track_order': {
            try {
                const cleanId = args.orderId.replace('#', '').trim();
                let order;

                if (cleanId.length === 24) {
                    order = await Order.findById(cleanId).populate('items.product', 'name image');
                } else {
                    order = await Order.findOne({
                        $expr: {
                            $regexMatch: {
                                input: { $toString: "$_id" },
                                regex: cleanId + '$',
                                options: 'i'
                            }
                        }
                    }).populate('items.product', 'name image');
                }

                if (!order) return { error: 'Order not found. Please check the order ID.' };
                if (order.user.toString() !== userId.toString()) {
                    return { error: 'This order does not belong to you.' };
                }
                return {
                    orderId: order._id,
                    status: order.status,
                    totalAmount: `₦${order.totalAmount.toLocaleString()}`,
                    items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: `₦${i.price.toLocaleString()}` })),
                    trackingNumber: order.trackingNumber || 'Not yet assigned',
                    isPaid: order.isPaid,
                    estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toLocaleDateString() : 'TBD',
                    createdAt: order.createdAt.toLocaleDateString()
                };
            } catch (err) {
                return { error: 'Invalid Order ID format. Please double-check your Order ID and try again.' };
            }
        }

        case 'get_user_orders': {
            const orders = await Order.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(args.limit || 5)
                .select('_id status totalAmount createdAt items');

            return orders.map(o => ({
                orderId: o._id,
                status: o.status,
                total: `₦${o.totalAmount.toLocaleString()}`,
                itemCount: o.items.length,
                date: o.createdAt.toLocaleDateString()
            }));
        }

        case 'get_recommendations': {
            const query = args.category ? { category: args.category } : { featured: true };
            let products = await Product.find(query)
                .sort({ rating: -1, numReviews: -1 })
                .limit(args.limit || 4)
                .select('name price category image rating');

            // Fallback if no featured products
            if (products.length === 0) {
                products = await Product.find()
                    .sort({ rating: -1 })
                    .limit(args.limit || 4)
                    .select('name price category image rating');
            }

            return products.map(p => ({
                id: p._id,
                name: p.name,
                price: `₦${p.price.toLocaleString()}`,
                category: p.category,
                image: p.image,
                rating: p.rating
            }));
        }

        default:
            return { error: 'Unknown function' };
    }
}

// System prompt — defines chatbot personality and behavior
const SYSTEM_PROMPT = `You are ShopBot, a friendly, professional, and helpful AI shopping assistant for ShopBotAI.

Your capabilities:
- Help customers find and browse products
- Provide product details and comparisons
- Give personalized product recommendations
- Track order status and delivery information
- Answer customer questions using our Knowledge Base (FAQ)

Guidelines:
- Use the predefined FAQ below as your primary knowledge base for store policies and general questions.
- Whenever a user asks a question that matches or is related to any FAQ, return the most relevant answer from the FAQ.
- Even if the user rephrases the question differently, intelligently map it to the closest FAQ.
- CRITICAL: Respond naturally like a human support agent (e.g., NEVER say "Based on the FAQ", "According to my knowledge base", or "The FAQ states...").
- Keep responses clear, concise, and human-like (not robotic).
- If a question is unclear, politely ask for clarification.
- If the question is outside the scope of your tools or the FAQ, give a helpful general response or advise the user that they can contact our support team.
- When recommending products, always use the search or recommendation tools to fetch real data.
- When a customer asks about an order, use the tracking tool.
- Format prices clearly with the ₦ (Naira) symbol.
- When showing products, mention key details: name, price, and availability.
- NEVER make up product information or policies. Only answer based on what is provided below or what the tools return.

--- SHOPBOTAI FAQ KNOWLEDGE BASE ---
1. What is ShopBotAI? 
ShopBotAI is a smart e-commerce platform powered by a friendly AI shopping assistant. Our AI helps you search for products, provides personalized recommendations, tracks your orders, and answers any questions you have while shopping.

2. How do I create a ShopBotAI account? 
Creating an account is simple. Just head to the registration page and sign up using your name, email address, and a secure password. Once registered, you can start shopping immediately.

3. How do I place an order on ShopBotAI? 
You can discover products by browsing or asking our AI assistant for recommendations. Simply add your desired items to your cart and proceed to checkout. At checkout, you will provide your shipping address and then be redirected to complete your order.

4. What payment methods does ShopBotAI accept? 
Our store ONLY accepts payments through WhatsApp. We do not process direct payments (such as Credit/Debit Cards, Bank Transfers, or Mobile app payments) on the website itself. Once you checkout, you will be guided to WhatsApp to finalize your payment securely. DO NOT mention any other payment methods under any circumstances.

5. How long does delivery take? 
Delivery typically takes 3 to 7 business days. Plus, we offer free shipping on all orders over ₦50,000!

6. Can I track my order? 
Yes, absolutely! You can easily track your order directly through the AI chat. Just ask to "track my order" and provide your Order ID, and it will instantly give you the real-time status and estimated delivery date.

7. What if I receive a wrong or damaged product? 
If an item arrives damaged or incorrect, please reach out to our support team immediately through the chat. We offer returns for unused items, and we will work with you via WhatsApp to resolve the issue as quickly as possible.

8. How long do I have to return a product? 
We offer a straightforward 30-day return policy on all unused items. Just ensure the product is in its original condition.

9. How long does a refund take? 
Since all payments and order finalizations are handled via our WhatsApp channel, our support representatives will construct your refund directly there once the returned item is received. Processing times will be communicated to you during that chat.

10. How can I contact customer service? 
Our customer support is available 24/7! You can get instant assistance at any time directly through this AI chatbot for everything from product questions to order tracking.
-----------------------------------`;

// Main chat function
async function processChat(messages, userId) {
    try {
        // Add system prompt
        const fullMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
        ];

        let response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: fullMessages,
            tools: tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 800
        });

        let assistantMessage = response.choices[0].message;
        let productCards = [];

        // Handle tool calls (function calling loop)
        while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Add assistant message with tool calls
            fullMessages.push(assistantMessage);

            // Execute each tool call
            for (const toolCall of assistantMessage.tool_calls) {
                const fnName = toolCall.function.name;
                const fnArgs = JSON.parse(toolCall.function.arguments);

                console.log(`AI calling function: ${fnName}`, fnArgs);
                const result = await executeFunction(fnName, fnArgs, userId);

                // Collect product cards for the frontend
                if (['search_products', 'get_recommendations', 'get_product_details'].includes(fnName)) {
                    const items = Array.isArray(result) ? result : [result];
                    productCards.push(...items.filter(i => i.id && !i.error));
                }

                fullMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
            }

            // Get the next response
            response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: fullMessages,
                tools: tools,
                tool_choice: 'auto',
                temperature: 0.7,
                max_tokens: 800
            });

            assistantMessage = response.choices[0].message;
        }

        return {
            content: assistantMessage.content,
            productCards: productCards.slice(0, 6) // Max 6 product cards
        };
    } catch (error) {
        console.error('Chatbot error:', error);
        throw error;
    }
}

module.exports = { processChat };
