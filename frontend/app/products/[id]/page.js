'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import styles from './detail.module.css';

export default function ProductDetail({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();
    const { user, loading: authLoading } = useAuth();

    // Auth Protection Check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            const data = await api.getProduct(id);
            setProduct(data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            window.location.href = '/auth/login';
            return;
        }
        try {
            setAdding(true);
            await addToCart(product._id, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (err) {
            alert(err.message);
        } finally {
            setAdding(false);
        }
    };

    if (authLoading || !user) return <div className="page-container"><div className="loading-page"><div className="spinner"></div></div></div>;
    if (loading) return <div className="page-container"><div className="loading-page"><div className="spinner"></div></div></div>;
    if (!product) return <div className="page-container"><div className="empty-state"><h3>Product not found</h3></div></div>;

    return (
        <div className="page-container">
            <Link href="/products" className={styles.backLink}>← Back to Products</Link>
            <div className={styles.layout}>
                <div className={styles.imageSection}>
                    <img src={product.image} alt={product.name} className={styles.mainImage} />
                </div>
                <div className={styles.infoSection}>
                    <span className={styles.category}>{product.category}</span>
                    <h1 className={styles.name}>{product.name}</h1>
                    <div className={styles.metaRow}>
                        {product.rating > 0 && <span className={styles.rating}><svg width="14" height="14" viewBox="0 0 24 24" fill="#D4960A" stroke="#D4960A" strokeWidth="1" style={{ marginRight: 4, verticalAlign: '-1px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{product.rating} ({product.numReviews} reviews)</span>}
                        <span className={product.stock > 0 ? styles.inStock : styles.outStock}>
                            {product.stock > 0 ? `✓ In Stock (${product.stock} left)` : '✕ Out of Stock'}
                        </span>
                    </div>
                    <div className={styles.price}>₦{product.price?.toLocaleString()}</div>
                    <p className={styles.description}>{product.description}</p>

                    {product.stock > 0 && (
                        <div className={styles.actions}>
                            <div className={styles.qtyControl}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
                            </div>
                            <button
                                className={`btn btn-primary btn-lg ${added ? styles.addedBtn : ''}`}
                                onClick={handleAddToCart}
                                disabled={adding}
                                style={{ flex: 1 }}
                            >
                                {added ? '✓ Added to Cart!' : adding ? 'Adding...' : 'Add to Cart'}
                            </button>
                        </div>
                    )}

                    <div className={styles.features}>
                        <div className={styles.feature}><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></span> Free shipping on orders over ₦50,000</div>
                        <div className={styles.feature}><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></span> 30-day return policy</div>
                        <div className={styles.feature}><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span> Secure checkout</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
