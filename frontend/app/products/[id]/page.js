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
                        {product.rating > 0 && <span className={styles.rating}>⭐ {product.rating} ({product.numReviews} reviews)</span>}
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
                                {added ? '✓ Added to Cart!' : adding ? 'Adding...' : '🛒 Add to Cart'}
                            </button>
                        </div>
                    )}

                    <div className={styles.features}>
                        <div className={styles.feature}><span>🚚</span> Free shipping on orders over ₦50,000</div>
                        <div className={styles.feature}><span>↩️</span> 30-day return policy</div>
                        <div className={styles.feature}><span>🔒</span> Secure checkout</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
