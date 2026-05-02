# CHAPTER FOUR: SYSTEM DESIGN AND IMPLEMENTATION

## 4.1 General System Design Objectives

The design of **ShopbotAI** was guided by a set of clearly defined system objectives intended to ensure that the final product meets the functional, non-functional, and user experience requirements of a modern e-commerce customer support platform. The following objectives informed every architectural and implementation decision throughout the development lifecycle:

### i. Scalability

The system was designed with a decoupled client-server architecture that allows both the frontend and backend to scale independently. The backend Application Programming Interface (API), built with Node.js and the Express.js framework, is deployed as a serverless function on Vercel, which enables automatic horizontal scaling in response to increased traffic. The MongoDB Atlas cloud database similarly provides elastic scalability, supporting seamless increases in data volume and concurrent connections without requiring manual infrastructure provisioning.

### ii. Real-Time Conversational Response

A core objective of the system was to deliver real-time, human-like conversational responses to customer queries. This was achieved through the integration of OpenAI's GPT-4o-mini Large Language Model (LLM) via the OpenAI Chat Completions API. The system implements a function-calling (tool-use) mechanism that allows the AI model to autonomously query the product catalogue, retrieve order tracking information, and provide personalised product recommendations — all within a single conversational turn, with typical response latencies of under three seconds.

### iii. User-Friendliness and Accessibility

The frontend was built using React (version 19) with the Next.js framework (version 16), employing a component-based architecture that ensures a consistent, intuitive, and visually cohesive user interface. The chat widget is accessible from every page of the application as a persistent floating component, allowing customers to initiate a support conversation at any point during their shopping experience without navigating away from the current page. The interface is fully responsive, adapting gracefully to desktop, tablet, and mobile screen dimensions.

### iv. Security and Data Integrity

Security was treated as a first-class concern throughout the system design. All API endpoints that handle sensitive operations are protected by JSON Web Token (JWT) authentication middleware. User passwords are hashed using the bcrypt algorithm with a salt factor of 12 rounds before storage. The backend is further hardened with the Helmet.js middleware for HTTP header security, Cross-Origin Resource Sharing (CORS) whitelisting for origin validation, and express-rate-limit middleware to mitigate brute-force and denial-of-service attacks. A dedicated stricter rate limiter is applied to the chatbot endpoint to control API cost consumption.

### v. Modularity and Maintainability

The codebase follows a modular design pattern, with clear separation of concerns across models, routes, middleware, services, and configuration modules. This modular structure ensures that individual components — such as the chatbot service, the authentication system, or the product catalogue — can be modified, tested, and extended independently without introducing regressions elsewhere in the system.

### vi. Twenty-Four-Hour Availability

By deploying the backend on Vercel's serverless infrastructure and the database on MongoDB Atlas, the system achieves continuous availability without the operational overhead of maintaining dedicated server hardware. The AI-powered chatbot provides round-the-clock customer support, eliminating the dependency on human support agents for common enquiries such as product information, order tracking, and return policies.

---

## 4.2 System Design

This section provides a detailed description of the design of each major subsystem of ShopbotAI, covering the user interface layout, the input and output pipelines, the modular programme structure, and the database schema.

### 4.2.1 Main Menu Design

The main menu of ShopbotAI serves as the primary navigation interface and is implemented as a persistent React component (`Navbar.js`) rendered within the root application layout (`layout.js`). The Next.js `RootLayout` component wraps the entire application in two context providers — `AuthProvider` and `CartProvider` — ensuring that authentication state and shopping cart state are globally accessible to all pages and components.

#### Navigation Bar

The navigation bar is fixed at the top of the viewport and contains the following elements:

- **Brand Logo**: A clickable brand identifier ("shopbotai.com") that links to the homepage.
- **Product Link**: A navigational link directing the user to the full product catalogue page (`/products`).
- **Authentication-Conditional Links**: When the user is not authenticated, a "Login" link is displayed. Upon successful authentication, the navigation dynamically renders "My Account" (linking to `/account`) and, if the authenticated user possesses an admin role, a "Dashboard" link (linking to `/admin`).
- **Cart Icon with Badge**: A shopping bag icon with a dynamic numerical badge indicating the current number of items in the user's cart. This badge is reactively updated via the `CartContext` consumer.
- **Responsive Hamburger Menu**: On mobile viewports, the navigation links collapse behind a hamburger toggle button, implemented using local React state (`menuOpen`).

#### Homepage Landing Page

The homepage (`page.js`) is structured into four distinct visual sections:

1. **Hero Section**: A full-width banner featuring a high-resolution fashion editorial image overlaid with the "ShopbotAi" brand title and a prominent "Shop Now" call-to-action button that routes to the product catalogue.

2. **Tagline Section**: A concise brand positioning statement describing the platform's value proposition — everyday comfort, stylish versatility, and sleek designs for business and special occasions.

3. **Why Choose Us Section**: A two-column layout featuring a fashion editorial image alongside persuasive copy highlighting the AI-powered assistant, personalised product recommendations, secure checkout, and quality-checked merchandise.

4. **Best Sellers Section**: A dynamically populated product grid that fetches featured products from the backend API on component mount. The data is loaded asynchronously using the `useEffect` hook and rendered as `ProductCard` components. A loading spinner is displayed during the fetch operation.

5. **Featured Collection Section**: A curated lookbook grid displaying four style categories (Minimalist, Classic, Modern, Avant-Garde), each linking to the product catalogue.

#### Chat Widget

The AI chat interface is implemented as a floating widget (`ChatWidget.js`) rendered globally within the `RootLayout`. It consists of:

- **Floating Action Button**: A circular button fixed to the bottom-right corner of the viewport with a pulsing animation to attract user attention.
- **Chat Window**: Upon activation, a 400×560 pixel chat panel slides into view with a smooth CSS animation. The window contains a branded header with a status indicator ("Online"), a scrollable message area, and an input form.

### 4.2.2 Input Design

The input design addresses how user data is captured across the system and prepared for processing by the backend API and the AI model.

#### Chat Message Input

The primary input mechanism for the chatbot is a text input field rendered within an HTML `<form>` element in the `ChatWidget` component. The input field is controlled by React state (`input`) and bound via the `onChange` event handler. Key input design decisions include:

- **Controlled Component Pattern**: The input value is managed through React's `useState` hook, ensuring that the component re-renders in response to each keystroke and that the current value is always accessible programmatically.
- **Submission via Form Event**: The message is submitted when the user presses the Enter key or clicks the send button (➤). The `onSubmit` handler (`sendMessage`) prevents the default form submission behaviour, trims whitespace from the input, and validates that the message is non-empty before proceeding.
- **Authentication Gate**: Before transmitting the message to the API, the system checks whether the user is authenticated. If not, the chatbot displays a polite prompt requesting the user to log in, without making any API call.
- **Input Sanitisation**: The message string is trimmed of leading and trailing whitespace on the client side. On the server side, the Express.js body parser (`express.json()`) deserialises the JSON request body, and the chatbot route handler validates that the `message` field is present and non-empty before proceeding to AI processing.

#### Authentication Input

User authentication is facilitated through dedicated login and registration forms on the `/auth/login` and `/auth/register` pages. The registration form captures three fields: full name, email address, and password. The login form captures email and password. All form data is serialised as JSON and transmitted to the backend via the `ApiClient` class's `login()` and `register()` methods, which issue HTTP POST requests to `/api/auth/login` and `/api/auth/register` respectively.

#### Product and Order Data Input

Administrative users can create and update products through the admin dashboard interface, which sends structured JSON payloads containing product attributes (name, description, price, category, stock, image URL, tags, and featured status) to the `/api/admin/products` endpoint. Order creation is initiated when a user proceeds through the checkout flow, with the shipping address and payment reference transmitted as the input payload.

### 4.2.3 Output Design

The output design specifies how processed data and AI-generated responses are rendered and presented to the end user within the user interface.

#### Chatbot Response Rendering

When the AI model returns a response, the `ChatWidget` component appends a new message object to the `messages` state array with the role `'assistant'`. Each message is rendered as a styled bubble within the scrollable chat window. The output rendering process includes:

- **Text Responses**: The assistant's textual content is displayed within a `<p>` element inside a message bubble styled with a light background colour and left-aligned positioning, visually distinguishing it from user messages, which are right-aligned with a royal blue background.
- **Product Card Attachments**: When the AI's response includes product recommendations or search results, the backend returns an array of `productCards` alongside the text content. These are rendered as clickable inline cards within the chat message, each displaying a product thumbnail image (44×44 pixels), the product name, and the price. Clicking a product card navigates the user to the corresponding product detail page (`/products/{id}`).
- **Typing Indicator**: While the system awaits a response from the AI model, an animated typing indicator (three bouncing dots) is displayed in the chat window, providing visual feedback that the system is processing the request.
- **Auto-Scroll Behaviour**: A `useRef` hook (`messagesEndRef`) is used in conjunction with a `useEffect` hook to automatically scroll the chat window to the most recent message whenever the `messages` array is updated.

#### Product Catalogue Output

The product catalogue page renders product data retrieved from the `/api/products` endpoint as a grid of `ProductCard` components. Each card displays the product image, name, price (formatted with the Nigerian Naira symbol ₦), and a "FEATURED" badge for promoted items. The product listing supports server-side search, category filtering, price range filtering, and sorting (by price ascending, price descending, rating, or name).

#### Administrative Dashboard Output

The admin dashboard (`/admin`) presents aggregate business intelligence data retrieved from the `/api/admin/stats` endpoint, including total product count, total order count, total registered users, total revenue (aggregated from paid orders), recent orders with customer details, order distribution by status, and monthly sales trends over the preceding twelve months.

### 4.2.4 Program Module Design

ShopbotAI is architected as a three-tier application comprising a frontend presentation layer, a backend API layer, and an AI integration layer.

#### A. Frontend Module (React / Next.js)

The frontend is a Next.js 16 application using the App Router paradigm, organised into four sub-modules: **Pages** (Home, Products, Cart, Checkout, Account, Admin, Login, Register), **Components** (Navbar, Footer, ProductCard, ChatWidget — each paired with a CSS Module for scoped styling), **Context Providers** (AuthContext and CartContext, implementing the React Context API for global state management), and an **API Client** (`lib/api.js` — a singleton class that encapsulates all HTTP communication with the backend and automatically attaches JWT tokens to every request).

#### B. Backend API Module (Node.js / Express.js)

The backend is an Express.js application (`server.js`) that registers seven route modules: `auth.js` (registration, login, JWT issuance, profile management), `products.js` (product listing with search, filtering, pagination, and sorting), `cart.js` (shopping cart CRUD operations), `orders.js` (order creation, history, and cancellation with stock restoration), `payment.js` (Paystack payment initialisation and verification), `admin.js` (dashboard statistics, product CRUD, order management, user listing — protected by admin middleware), and `chatbot.js` (AI message handling, conversation history, and session management). Two middleware functions — `protect` (JWT validation) and `admin` (role verification) — secure sensitive endpoints.

#### C. AI Integration Module (OpenAI GPT-4o-mini)

The AI layer, encapsulated in `services/chatbot.js`, implements a system prompt that defines the chatbot persona and embeds a ten-item FAQ knowledge base. It defines five callable tools (`search_products`, `get_product_details`, `track_order`, `get_user_orders`, `get_recommendations`) that the GPT-4o-mini model can autonomously invoke to query the live MongoDB database. The `processChat()` function implements an iterative tool-execution loop that continues until the model produces a final text response, returning both the AI's reply and up to six product cards for frontend rendering.

### 4.2.5 Database Design

ShopbotAI uses **MongoDB** (hosted on MongoDB Atlas) with schemas defined via **Mongoose** version 9. The database comprises five collections:

**i. Users Collection** — Stores registered accounts with fields for name, email (unique, regex-validated), bcrypt-hashed password (salt factor 12, excluded from default queries), role (`'user'` or `'admin'`), phone, and an embedded address object. A pre-save hook automatically hashes passwords, and an instance method `matchPassword()` enables secure login comparison.

**ii. Products Collection** — Stores the product catalogue with fields for name, description, price (in Naira), category (constrained to nine enumerated values including Electronics, Clothing, and Home & Kitchen), primary image URL, additional images array, stock count, rating (0–5), review count, featured flag, and keyword tags. A compound text index on the name, description, and tags fields supports full-text search.

**iii. Chats Collection** — Stores conversational sessions, each linked to a user via ObjectId reference. Each document contains an ordered array of message sub-documents (with role, content, optional product card attachments, and timestamp) and a `sessionActive` flag for session lifecycle management.

**iv. Orders Collection** — Records purchase transactions with fields for user reference, order items (product reference, name, quantity, price, image), total amount, fulfilment status (an enum of six states from `'pending'` to `'cancelled'`), shipping address, Paystack payment reference, payment confirmation flag, tracking number, and estimated delivery date.

**v. Carts Collection** — Maintains one active shopping cart per user (enforced by a unique constraint on the user field), containing an array of item sub-documents with product references and quantities.

#### Entity-Relationship Summary

- **User → Chats / Orders**: One-to-Many.
- **User → Cart**: One-to-One.
- **Product → Order Items / Cart Items**: Many-to-Many.

---

*End of Part 1 — Sections 4.1 through 4.2.5. Part 2 continues with Sections 4.3 through 4.5.2.*
