'use client';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './ProductCard.module.css';
import { useState } from 'react';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            window.location.href = '/auth/login';
            return;
        }
        try {
            setAdding(true);
            await addToCart(product._id);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
        } catch (err) {
            alert(err.message);
        } finally {
            setAdding(false);
        }
    };

    return (
        <Link href={`/products/${product._id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={product.image} alt={product.name} className={styles.image} />
                {product.featured && <span className={styles.featuredBadge}>Featured</span>}
                {product.stock === 0 && <span className={styles.outOfStock}>Out of Stock</span>}
            </div>
            <div className={styles.info}>
                <span className={styles.category}>{product.category}</span>
                <h3 className={styles.name}>{product.name}</h3>
                <div className={styles.meta}>
                    <span className={styles.price}>₦{product.price?.toLocaleString()}</span>
                    {product.rating > 0 && (
                        <span className={styles.rating}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" style={{ marginRight: 3, verticalAlign: '-1px', color: '#D4960A' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{product.rating}</span>
                    )}
                </div>
                <button
                    className={`${styles.addBtn} ${added ? styles.addedBtn : ''}`}
                    onClick={handleAdd}
                    disabled={adding || product.stock === 0}
                >
                    {added ? '✓ Added!' : adding ? 'Adding...' : '+ Add to Cart'}
                </button>
            </div>
        </Link>
    );
}
