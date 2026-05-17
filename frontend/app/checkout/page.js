'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import styles from './checkout.module.css';

export default function CheckoutPage() {
    const { cart, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({
        street: '', city: '', state: '', country: 'Nigeria', zipCode: ''
    });

    // WhatsApp number for payments (change this to your business number)
    const WHATSAPP_NUMBER = '2348089504573';

    if (!user) {
        router.push('/auth/login');
        return null;
    }

    if (!cart?.items?.length) {
        router.push('/cart');
        return null;
    }

    const shipping = totalPrice >= 50000 ? 0 : 2500;
    const total = totalPrice + shipping;

    const buildWhatsAppMessage = (orderId) => {
        const itemsList = cart.items.map(item =>
            `• ${item.product?.name} ×${item.quantity} — ₦${(item.product?.price * item.quantity).toLocaleString()}`
        ).join('\n');

        const message = `🛒 *New Order from ShopBot AI*\n\n` +
            `*Order ID:* #${orderId.slice(-8)}\n` +
            `*Customer:* ${user.name}\n` +
            `*Email:* ${user.email}\n\n` +
            `*Items:*\n${itemsList}\n\n` +
            `*Subtotal:* ₦${totalPrice.toLocaleString()}\n` +
            `*Shipping:* ${shipping === 0 ? 'Free' : `₦${shipping.toLocaleString()}`}\n` +
            `*Total:* ₦${total.toLocaleString()}\n\n` +
            `*Shipping Address:*\n${address.street}\n${address.city}, ${address.state}\n${address.country} ${address.zipCode}\n\n` +
            `I would like to complete payment for this order. 💳`;

        return encodeURIComponent(message);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Create the order (status: pending)
            const order = await api.createOrder({
                shippingAddress: address
            });

            // Build WhatsApp URL with order details
            const whatsappMessage = buildWhatsAppMessage(order._id);
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

            // Open WhatsApp in a new tab
            window.open(whatsappUrl, '_blank');

            // Redirect to account page
            router.push('/account');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1 className="section-title">Checkout</h1>
            <p className="section-subtitle">Complete your order</p>

            <form onSubmit={handleSubmit} className={styles.layout}>
                <div className={styles.formSection}>
                    <h3>Shipping Address</h3>
                    <div className={styles.formGrid}>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Street Address</label>
                            <input className="input" placeholder="123 Main Street" value={address.street}
                                onChange={e => setAddress({ ...address, street: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>City</label>
                            <input className="input" placeholder="Lagos" value={address.city}
                                onChange={e => setAddress({ ...address, city: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>State</label>
                            <input className="input" placeholder="Lagos State" value={address.state}
                                onChange={e => setAddress({ ...address, state: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Country</label>
                            <input className="input" value={address.country}
                                onChange={e => setAddress({ ...address, country: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Zip Code</label>
                            <input className="input" placeholder="100001" value={address.zipCode}
                                onChange={e => setAddress({ ...address, zipCode: e.target.value })} required />
                        </div>
                    </div>
                </div>

                <div className={styles.orderSummary}>
                    <h3>Order Summary</h3>
                    <div className={styles.orderItems}>
                        {cart.items.map(item => (
                            <div key={item._id} className={styles.orderItem}>
                                <img src={item.product?.image} alt="" className={styles.orderImage} />
                                <div className={styles.orderItemInfo}>
                                    <span>{item.product?.name}</span>
                                    <span className={styles.orderQty}>×{item.quantity}</span>
                                </div>
                                <span className={styles.orderItemPrice}>₦{(item.product?.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.costs}>
                        <div className={styles.costRow}><span>Subtotal</span><span>₦{totalPrice.toLocaleString()}</span></div>
                        <div className={styles.costRow}><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₦${shipping.toLocaleString()}`}</span></div>
                        <div className={styles.costTotal}><span>Total</span><span>₦{total.toLocaleString()}</span></div>
                    </div>
                    <button type="submit" className={styles.whatsappBtn} disabled={loading}>
                        <span className={styles.whatsappIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
                        {loading ? 'Processing...' : `Pay ₦${total.toLocaleString()} via WhatsApp`}
                    </button>
                    <p className={styles.secureNote}>Your order will be created and you'll be redirected to WhatsApp to complete payment</p>
                </div>
            </form>
        </div>
    );
}
