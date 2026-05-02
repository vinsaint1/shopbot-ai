## 4.3 System Implementation

This section describes how the designs outlined in Section 4.2 were translated into working software using JavaScript as the primary programming language, supported by the MERN (MongoDB, Express.js, React, Node.js) technology stack and the OpenAI Large Language Model API for natural language processing.

### 4.3.1 Backend Implementation

The backend server was implemented in **Node.js** using the **Express.js** web application framework (version 5). The entry point of the application is `server.js`, which performs the following initialisation sequence:

1. **Environment Configuration**: The `dotenv` package loads environment variables (database URI, JWT secret, OpenAI API key, Paystack secret key, and frontend URL) from a `.env` file into `process.env`.

2. **Database Connection**: The `connectDB()` function, defined in `config/db.js`, establishes an asynchronous connection to the MongoDB Atlas cluster using Mongoose's `mongoose.connect()` method. Connection failure triggers an immediate process termination with exit code 1.

3. **Security Middleware Registration**: Three security layers are applied globally:
   - **Helmet.js**: Configures secure HTTP response headers while permitting cross-origin resource loading (`crossOriginResourcePolicy: 'cross-origin'`).
   - **CORS**: A dynamic origin validation function checks incoming requests against a whitelist comprising the frontend production URL and `localhost:3000` for development. Any origin ending with `.vercel.app` is also permitted to support Vercel preview deployments.
   - **Rate Limiting**: A general rate limiter restricts each IP address to 100 requests per 15-minute window across all API endpoints. A stricter rate limiter on the `/api/chat` route restricts chatbot usage to 10 messages per minute per IP, controlling the cost of OpenAI API invocations.

4. **Route Registration**: Eight route modules are mounted on their respective URL paths, as detailed in Section 4.2.4.

5. **Error Handling**: A global error-handling middleware catches unhandled exceptions and returns a JSON error response. In development mode, the error message is included in the response for debugging purposes; in production, it is suppressed. A catch-all 404 handler returns a "Route not found" response for unmatched URLs.

6. **Conditional Server Binding**: In non-production environments, the Express application binds to the port specified by the `PORT` environment variable (defaulting to 5000). In production (Vercel), the application is exported as a module rather than bound to a port, as Vercel's serverless runtime manages the HTTP listener.

#### Authentication Implementation

User authentication follows the **stateless JWT (JSON Web Token)** pattern:

- **Registration** (`POST /api/auth/register`): The route handler checks for duplicate email addresses, creates a new User document (triggering the Mongoose pre-save hook to hash the password), and returns the user profile along with a signed JWT valid for 30 days.
- **Login** (`POST /api/auth/login`): The handler retrieves the user document with the password field explicitly selected (`select('+password')`), invokes the `matchPassword()` instance method to compare the submitted password against the stored bcrypt hash, and issues a JWT upon successful verification.
- **Route Protection**: The `protect` middleware extracts the JWT from the `Authorization: Bearer <token>` header, verifies its signature using `jwt.verify()`, retrieves the corresponding user document, and attaches it to `req.user` for downstream handlers.

#### Chatbot Service Implementation

The chatbot intelligence is implemented in `services/chatbot.js` and constitutes the most technically sophisticated module of the system. The `processChat()` function operates as follows:

**Step 1 — Message Assembly**: The function prepends the system prompt (containing persona definition, behavioural guidelines, and the embedded FAQ knowledge base) to the array of recent conversation messages received from the route handler. The route handler limits the context window to the most recent 20 messages to manage token consumption.

**Step 2 — Initial API Call**: The assembled message array, along with the tool definitions, is submitted to the OpenAI Chat Completions API using the `openai.chat.completions.create()` method with the following parameters:
- `model`: `'gpt-4o-mini'` — a cost-efficient yet capable model suitable for customer support tasks.
- `tools`: The array of five function definitions (search_products, get_product_details, track_order, get_user_orders, get_recommendations).
- `tool_choice`: `'auto'` — allowing the model to decide autonomously whether to invoke a tool or respond directly.
- `temperature`: `0.7` — balancing creativity with consistency in responses.
- `max_tokens`: `800` — constraining response length for conciseness.

**Step 3 — Tool Execution Loop**: If the model's response includes `tool_calls`, the function enters an iterative loop:
  - Each tool call is parsed to extract the function name and arguments.
  - The `executeFunction()` dispatcher invokes the corresponding database query using Mongoose.
  - The query results are serialised as JSON and appended to the message array as `'tool'` role messages.
  - Product data from relevant tool calls is accumulated into a `productCards` array for frontend rendering.
  - The OpenAI API is re-invoked with the augmented message array, and the loop continues until the model produces a final text response without further tool calls.

**Step 4 — Response Composition**: The function returns an object containing the AI's textual response (`content`) and up to six product cards (`productCards`), which are transmitted to the frontend as a JSON response.

#### Database Query Implementation

Each tool function in the chatbot service translates natural language intent into structured MongoDB queries:

- **Product Search** (`search_products`): Constructs a query using `$or` with three `$regex` conditions matching against the `name`, `description`, and `tags` fields, with case-insensitive options. Optional `category` and `maxPrice` filters are applied additively.
- **Order Tracking** (`track_order`): Supports both full 24-character ObjectId lookups and partial ID matching using MongoDB's `$regexMatch` aggregation expression, providing a user-friendly experience where customers need not remember the complete order identifier.

### 4.3.2 Frontend Implementation

The frontend was implemented using **React 19** with the **Next.js 16** framework, which provides file-system-based routing, server-side rendering capabilities, and optimised production builds.

#### State Management

Global application state is managed using the **React Context API**, implemented through two provider components:

1. **AuthContext** (`context/AuthContext.js`): Manages the authenticated user object and provides `login()`, `register()`, `logout()`, and `checkAuth()` functions. On application mount, the `checkAuth()` function reads the JWT from `localStorage`, calls the `/api/auth/me` endpoint to validate the token and retrieve the current user profile, and updates the context state accordingly.

2. **CartContext** (`context/CartContext.js`): Manages the shopping cart state, including cart items and the derived item count. It synchronises the local cart state with the server-side cart via API calls, ensuring consistency across browser sessions.

#### API Communication Layer

All HTTP communication with the backend is centralised in the `ApiClient` class (`lib/api.js`). This singleton class implements:

- **Automatic Token Injection**: The `getToken()` method reads the JWT from `localStorage`, and the `request()` method attaches it to every outgoing request's `Authorization` header.
- **Unified Error Handling**: Non-2xx HTTP responses are caught, and the server's error message is thrown as a JavaScript `Error` object for consumption by calling components.
- **Domain-Specific Methods**: Thirty-one methods provide a clean, typed interface for all API operations, grouped into six categories: Authentication (4 methods), Products (3 methods), Cart (5 methods), Orders (4 methods), Payments (2 methods), Chat (3 methods), and Admin (6 methods).

#### Chat Widget Implementation

The `ChatWidget` component implements the following interaction lifecycle:

1. **Initialisation**: When the chat window is opened and the user is authenticated, the `loadHistory()` function fetches the conversation history from `/api/chat/history`. If no history exists, a welcome message is displayed.
2. **Message Sending**: The `sendMessage()` handler optimistically appends the user's message to the local state for immediate visual feedback, clears the input field, and asynchronously posts the message to the backend. Upon receiving the AI's response, it appends the assistant message (with any product cards) to the state.
3. **Error Recovery**: If the API call fails, a graceful error message is displayed within the chat interface rather than crashing the component.
4. **Session Management**: The `clearChat()` function marks the current session as inactive on the server and reinitialises the local message state with a fresh welcome message.

### 4.3.3 Deployment Implementation

The backend is deployed on **Vercel** as a serverless function. The `vercel.json` configuration file defines a URL rewrite rule that routes all requests matching `/api/(.*)` to the `api/index.js` entry point. Environment variables (MongoDB URI, JWT secret, OpenAI API key, Paystack secret key, and frontend URL) are configured through the Vercel dashboard and injected at runtime.

The frontend is configured to communicate with the deployed backend via the `NEXT_PUBLIC_API_URL` environment variable, set in `.env.local` to point to `https://shopbot-backend.vercel.app/api`.

---

## 4.4 System Requirements

### 4.4.1 Hardware Requirements

The development workstation requires a minimum of an Intel Core i5 processor (8th Generation or equivalent), 8 GB RAM (16 GB recommended), 256 GB SSD with at least 5 GB free space, and a broadband internet connection of at least 5 Mbps for API communication. A display resolution of 1366 × 768 or higher and standard input devices (keyboard and mouse) are also required. Since the production system is deployed on Vercel's serverless infrastructure with MongoDB Atlas, end-users require only a modern web browser and internet connectivity — no dedicated server hardware is needed.

### 4.4.2 Software Requirements

The system was developed on Windows 10/11 using Node.js (18.x LTS) as the JavaScript runtime, npm (9.x) for dependency management, Visual Studio Code as the IDE, Git for version control, and Google Chrome for testing. The key backend dependencies include: Express.js (5.2.1), Mongoose (9.2.4), OpenAI SDK (6.25.0), jsonwebtoken (9.0.3), bcryptjs (3.0.3), cors (2.8.6), helmet (8.1.0), express-rate-limit (8.3.0), dotenv (17.3.1), and axios (1.13.6). The frontend depends on React (19.2.3), React DOM (19.2.3), and Next.js (16.1.6). Four external services are utilised: MongoDB Atlas (cloud database), OpenAI API with GPT-4o-mini (natural language processing), Vercel (serverless deployment), and Paystack API (payment processing).

---

## 4.5 System Testing and Evaluation

### 4.5.1 System Testing

A multi-layered testing strategy was adopted to validate the system at the unit, integration, and end-to-end levels.

#### A. Unit Testing of API Endpoints

Each backend API endpoint was individually tested using manual HTTP requests and programmatic URL fetching. Key test results are summarised below:

| Module | Test Cases | All Passed |
|---|---|---|
| **Authentication** (`/api/auth`) | Register (valid data, duplicate email), Login (valid/invalid credentials), Access protected route without token | ✅ Yes (5/5) |
| **Products** (`/api/products`) | Fetch all products, fetch featured, fetch by ID, fetch with invalid ID | ✅ Yes (4/4) |
| **Chatbot** (`/api/chat`) | Send message (authenticated/unauthenticated), send empty message, fetch history, clear session | ✅ Yes (5/5) |
| **Health Check** (`/api/health`) | Verify status response | ✅ Yes (1/1) |

#### B. Integration Testing of Chatbot Conversational Flow

The end-to-end conversational pipeline was tested across six customer support scenarios:

| # | Scenario | User Input | Expected Tool / Behaviour | Result |
|---|---|---|---|---|
| 1 | Product Discovery | "Show me some electronics" | `search_products` with category filter | Products returned with prices and cards ✅ |
| 2 | Order Tracking | "Track my order" | `get_user_orders` → `track_order` | Order details and status returned ✅ |
| 3 | FAQ Query | "What payment methods do you accept?" | Knowledge base match (no tool call) | WhatsApp-only policy stated naturally ✅ |
| 4 | Recommendations | "Gift for a fitness lover" | `search_products` with "fitness" | Running Shoes, Yoga Mat recommended ✅ |
| 5 | Out-of-Scope | "What's the weather today?" | Polite redirect to shopping | Correctly declined and redirected ✅ |
| 6 | Multi-Turn Context | "Show headphones" → "How much is the first one?" | Context retention across turns | ₦25,000 price recalled correctly ✅ |

#### C. Frontend Integration Testing

The frontend was verified in Google Chrome across desktop, tablet, and mobile viewports. All eight pages rendered without errors, the ApiClient correctly attached JWT tokens to authenticated requests, the chat widget's full interaction lifecycle (open, send, receive, product cards, typing indicator, clear) functioned as designed, and cart state synchronised correctly between frontend and server.

### 4.5.2 Training and Documentation

The chatbot was "trained" through two complementary mechanisms rather than traditional model fine-tuning:

**1. Prompt-Engineered FAQ Knowledge Base**: A curated set of ten FAQ entries — covering platform overview, account creation, ordering, payment methods (WhatsApp-only), delivery (3–7 days, free over ₦50,000), order tracking, returns (30-day policy), refunds, and 24/7 support availability — was embedded directly into the system prompt in `services/chatbot.js`. The AI is instructed to match rephrased queries to the closest FAQ and respond naturally without referencing the knowledge base source.

**2. Tool-Augmented Generation (RAG)**: For dynamic queries (product searches, inventory checks, order tracking), the chatbot queries the live MongoDB database at inference time through its five callable tools, ensuring responses always reflect current data without periodic retraining.

System documentation includes inline code comments with HTTP method annotations, API endpoint specifications, a reproducible database seed script (`seed.js`) with test data, and environment variable management via `.env` files excluded from version control by `.gitignore`.

---

*End of Chapter Four: System Design and Implementation.*
