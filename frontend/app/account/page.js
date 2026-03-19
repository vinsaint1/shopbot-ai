'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../lib/api';
import styles from './account.module.css';

export default function AccountPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [confirmingId, setConfirmingId] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/auth/login'); return; }
        loadOrders();
    }, [user, authLoading]);

    const loadOrders = async () => {
        try {
            const data = await api.getOrders();
            setOrders(data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            setCancellingId(orderId);
            setConfirmingId(null);
            await api.cancelOrder(orderId);
            // Refresh orders
            const data = await api.getOrders();
            setOrders(data);
        } catch (err) {
            alert(err.message || 'Failed to cancel order');
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusColor = (status) => {
        const map = { pending: 'badge-warning', confirmed: 'badge-info', processing: 'badge-info', shipped: 'badge-info', delivered: 'badge-success', cancelled: 'badge-error' };
        return map[status] || 'badge-info';
    };

    if (authLoading || !user) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className={styles.header}>
                <div>
                    <h1 className="section-title">My Account</h1>
                    <p className="section-subtitle">Welcome back, {user.name}!</p>
                </div>
                {user.role === 'admin' && (
                    <Link href="/admin" className="btn btn-primary">Admin Dashboard</Link>
                )}
            </div>

            <div className={styles.grid}>
                {/* Profile Card */}
                <div className={styles.profileCard}>
                    <div className={styles.profileAvatar}>{user.name?.[0]?.toUpperCase()}</div>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`}>{user.role}</span>
                    <button onClick={logout} className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }}>Logout</button>
                </div>

                {/* Orders */}
                <div className={styles.ordersSection}>
                    <h2>Order History</h2>
                    {loading ? (
                        <div className="loading-page"><div className="spinner"></div></div>
                    ) : orders.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📦</div>
                            <h3>No orders yet</h3>
                            <p>Start shopping to see your orders here!</p>
                            <Link href="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
                        </div>
                    ) : (
                        <div className={styles.ordersList}>
                            {orders.map(order => (
                                <div key={order._id} className={styles.orderCard}>
                                    <div className={styles.orderHeader}>
                                        <div>
                                            <span className={styles.orderId}>Order #{order._id.slice(-8)}</span>
                                            <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                                    </div>
                                    <div className={styles.orderItems}>
                                        {order.items?.slice(0, 3).map((item, i) => (
                                            <div key={i} className={styles.orderItem}>
                                                <img src={item.image || item.product?.image} alt="" className={styles.orderItemImg} />
                                                <span>{item.name} ×{item.quantity}</span>
                                            </div>
                                        ))}
                                        {order.items?.length > 3 && <span className={styles.moreItems}>+{order.items.length - 3} more items</span>}
                                    </div>
                                    <div className={styles.orderFooter}>
                                        <span className={styles.orderTotal}>₦{order.totalAmount?.toLocaleString()}</span>
                                        <div className={styles.orderActions}>
                                            {order.trackingNumber && <span className={styles.tracking}>📦 {order.trackingNumber}</span>}
                                            {order.status === 'pending' && (
                                                confirmingId === order._id ? (
                                                    <div className={styles.confirmGroup}>
                                                        <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>Cancel this order?</span>
                                                        <button
                                                            className={styles.confirmYesBtn}
                                                            onClick={() => handleCancelOrder(order._id)}
                                                            disabled={cancellingId === order._id}
                                                        >
                                                            {cancellingId === order._id ? 'Cancelling...' : 'Yes, Cancel'}
                                                        </button>
                                                        <button
                                                            className={styles.confirmNoBtn}
                                                            onClick={() => setConfirmingId(null)}
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className={styles.cancelBtn}
                                                        onClick={() => setConfirmingId(order._id)}
                                                    >
                                                        ✕ Cancel Order
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
