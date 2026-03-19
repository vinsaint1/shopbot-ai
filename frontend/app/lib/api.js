const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
    constructor() {
        this.baseUrl = API_URL;
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const { headers: optHeaders, ...restOptions } = options;
        const config = {
            ...restOptions,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...optHeaders,
            },
        };

        const res = await fetch(`${this.baseUrl}${endpoint}`, config);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    }

    // Auth
    async register(userData) {
        return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
    }

    async login(credentials) {
        return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    }

    async getProfile() {
        return this.request('/auth/me');
    }

    async updateProfile(data) {
        return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
    }

    // Products
    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/products?${query}`);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async getCategories() {
        return this.request('/products/categories');
    }

    // Cart
    async getCart() {
        return this.request('/cart');
    }

    async addToCart(productId, quantity = 1) {
        return this.request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
    }

    async updateCartItem(itemId, quantity) {
        return this.request(`/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
    }

    async removeFromCart(itemId) {
        return this.request(`/cart/${itemId}`, { method: 'DELETE' });
    }

    async clearCart() {
        return this.request('/cart', { method: 'DELETE' });
    }

    // Orders
    async createOrder(orderData) {
        return this.request('/orders', { method: 'POST', body: JSON.stringify(orderData) });
    }

    async getOrders() {
        return this.request('/orders');
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    async cancelOrder(id) {
        return this.request(`/orders/${id}/cancel`, { method: 'PUT' });
    }

    // Payments
    async initializePayment(paymentData) {
        return this.request('/payment/initialize', { method: 'POST', body: JSON.stringify(paymentData) });
    }

    async verifyPayment(reference) {
        return this.request(`/payment/verify/${reference}`);
    }

    // Chat
    async sendMessage(message) {
        return this.request('/chat', { method: 'POST', body: JSON.stringify({ message }) });
    }

    async getChatHistory() {
        return this.request('/chat/history');
    }

    async clearChat() {
        return this.request('/chat/clear', { method: 'POST' });
    }

    // Admin
    async getAdminStats() {
        return this.request('/admin/stats');
    }

    async createProduct(productData) {
        return this.request('/admin/products', { method: 'POST', body: JSON.stringify(productData) });
    }

    async updateProduct(id, productData) {
        return this.request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) });
    }

    async deleteProduct(id) {
        return this.request(`/admin/products/${id}`, { method: 'DELETE' });
    }

    async getAdminOrders(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/orders?${query}`);
    }

    async updateOrderStatus(id, data) {
        return this.request(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async getAdminUsers() {
        return this.request('/admin/users');
    }
}

const api = new ApiClient();
export default api;
