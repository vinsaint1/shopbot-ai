'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import styles from './admin.module.css';

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '', description: '', price: '', category: 'Electronics', image: '', stock: '', featured: false
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') { router.push('/auth/login'); return; }
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const [statsData, prodData, ordData] = await Promise.all([
                api.getAdminStats(),
                api.getProducts({ limit: 100 }),
                api.getAdminOrders({ limit: 50 })
            ]);
            setStats(statsData);
            setProducts(prodData.products);
            setOrders(ordData.orders);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
            if (editingProduct) {
                await api.updateProduct(editingProduct._id, data);
            } else {
                await api.createProduct(data);
            }
            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm({ name: '', description: '', price: '', category: 'Electronics', image: '', stock: '', featured: false });
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name, description: product.description, price: product.price,
            category: product.category, image: product.image, stock: product.stock, featured: product.featured
        });
        setShowProductModal(true);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.deleteProduct(id);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            await api.updateOrderStatus(orderId, { status });
            loadData();
        } catch (err) { alert(err.message); }
    };

    if (!user || user.role !== 'admin') return null;
    if (loading) return <div className="page-container"><div className="loading-page"><div className="spinner"></div></div></div>;

    const tabs = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'products', label: 'Products' },
        { id: 'orders', label: 'Orders' },
    ];

    return (
        <div className="page-container">
            <h1 className="section-title">Admin Dashboard</h1>
            <p className="section-subtitle">Manage your store</p>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button key={tab.id} className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
                <div className={styles.dashboard}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}><span className={styles.statIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--royal-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span><div><h3>₦{stats.totalRevenue?.toLocaleString()}</h3><p>Total Revenue</p></div></div>
                        <div className={styles.statCard}><span className={styles.statIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--royal-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span><div><h3>{stats.totalOrders}</h3><p>Total Orders</p></div></div>
                        <div className={styles.statCard}><span className={styles.statIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--royal-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span><div><h3>{stats.totalProducts}</h3><p>Products</p></div></div>
                        <div className={styles.statCard}><span className={styles.statIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--royal-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><div><h3>{stats.totalUsers}</h3><p>Users</p></div></div>
                    </div>

                    <div className={styles.recentSection}>
                        <h3>Recent Orders</h3>
                        {stats.recentOrders?.length > 0 ? (
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {stats.recentOrders.map(order => (
                                            <tr key={order._id}>
                                                <td>#{order._id?.slice(-8)}</td>
                                                <td>{order.user?.name || 'N/A'}</td>
                                                <td>₦{order.totalAmount?.toLocaleString()}</td>
                                                <td><span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : 'info'}`}>{order.status}</span></td>
                                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p style={{ color: 'var(--text-muted)' }}>No orders yet</p>}
                    </div>
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div>
                    <div className={styles.toolBar}>
                        <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', category: 'Electronics', image: '', stock: '', featured: false }); setShowProductModal(true); }}>
                            + Add Product
                        </button>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product._id}>
                                        <td><img src={product.image} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} /></td>
                                        <td>{product.name}</td>
                                        <td>₦{product.price?.toLocaleString()}</td>
                                        <td>{product.category}</td>
                                        <td><span className={product.stock > 0 ? '' : 'badge badge-error'}>{product.stock}</span></td>
                                        <td>{product.featured ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#D4960A" stroke="#D4960A" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEditProduct(product)}>Edit</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td>#{order._id?.slice(-8)}</td>
                                    <td>{order.user?.name || 'N/A'}</td>
                                    <td>{order.items?.length} items</td>
                                    <td>₦{order.totalAmount?.toLocaleString()}</td>
                                    <td><span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : 'info'}`}>{order.status}</span></td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <select className="input" value={order.status} onChange={e => handleUpdateOrderStatus(order._id, e.target.value)}
                                            style={{ padding: '6px 10px', fontSize: '0.8rem', maxWidth: 140 }}>
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                        <form onSubmit={handleProductSubmit} className={styles.modalForm}>
                            <div className="input-group">
                                <label>Product Name</label>
                                <input className="input" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea className="input" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="input-group">
                                    <label>Price (₦)</label>
                                    <input type="number" className="input" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>Stock</label>
                                    <input type="number" className="input" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Category</label>
                                <select className="input" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                                    {['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Food', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Image URL</label>
                                <input className="input" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} placeholder="https://..." />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <input type="checkbox" checked={productForm.featured} onChange={e => setProductForm({ ...productForm, featured: e.target.checked })} />
                                Featured Product
                            </label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingProduct ? 'Update' : 'Create'} Product</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
