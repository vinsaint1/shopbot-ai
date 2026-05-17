'use client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import styles from './cart.module.css';

export default function CartPage() {
    const { cart, loading, updateQuantity, removeItem, totalPrice, itemCount } = useCart();
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                    <h3>Please login to view your cart</h3>
                    <Link href="/auth/login" className="btn btn-primary" style={{ marginTop: 16 }}>Login</Link>
                </div>
            </div>
        );
    }

    if (loading) return <div className="page-container"><div className="loading-page"><div className="spinner"></div></div></div>;

    if (!cart?.items?.length) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
                    <h3>Your cart is empty</h3>
                    <p>Discover amazing products and add them to your cart!</p>
                    <Link href="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Start Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="section-title">Shopping Cart</h1>
            <p className="section-subtitle">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>

            <div className={styles.layout}>
                <div className={styles.items}>
                    {cart.items.map(item => (
                        <div key={item._id} className={styles.cartItem}>
                            <img src={item.product?.image} alt={item.product?.name} className={styles.itemImage} />
                            <div className={styles.itemInfo}>
                                <Link href={`/products/${item.product?._id}`} className={styles.itemName}>{item.product?.name}</Link>
                                <span className={styles.itemCategory}>{item.product?.category}</span>
                                <span className={styles.itemPrice}>₦{item.product?.price?.toLocaleString()}</span>
                            </div>
                            <div className={styles.itemActions}>
                                <div className={styles.qtyControl}>
                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                                </div>
                                <span className={styles.subtotal}>₦{(item.product?.price * item.quantity).toLocaleString()}</span>
                                <button onClick={() => removeItem(item._id)} className={styles.removeBtn}>✕</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.summary}>
                    <div className={styles.summaryCard}>
                        <h3>Order Summary</h3>
                        <div className={styles.summaryRow}>
                            <span>Subtotal ({itemCount} items)</span>
                            <span>₦{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Shipping</span>
                            <span>{totalPrice >= 50000 ? 'Free' : '₦2,500'}</span>
                        </div>
                        <div className={styles.summaryTotal}>
                            <span>Total</span>
                            <span>₦{(totalPrice + (totalPrice >= 50000 ? 0 : 2500)).toLocaleString()}</span>
                        </div>
                        <Link href="/checkout" className="btn btn-accent btn-lg" style={{ width: '100%' }}>
                            Proceed to Checkout →
                        </Link>
                        {totalPrice < 50000 && (
                            <p className={styles.freeShipping}>Add ₦{(50000 - totalPrice).toLocaleString()} more for free shipping!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
