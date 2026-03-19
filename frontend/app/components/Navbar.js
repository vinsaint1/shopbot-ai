'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className={styles.nav}>
            <div className={styles.container}>
                <Link href="/" className={styles.brand}>
                    shopbotai.com
                </Link>

                <div className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
                    <Link href="/products" className={styles.link} onClick={() => setMenuOpen(false)}>Products</Link>
                    {user ? (
                        <>
                            <Link href="/account" className={styles.link} onClick={() => setMenuOpen(false)}>My Account</Link>
                            {user.role === 'admin' && (
                                <Link href="/admin" className={styles.link} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                            )}
                            <button onClick={() => { logout(); setMenuOpen(false); }} className={styles.logoutBtn}>Logout</button>
                        </>
                    ) : (
                        <Link href="/auth/login" className={styles.link} onClick={() => setMenuOpen(false)}>Login</Link>
                    )}
                </div>

                <div className={styles.actions}>
                    <Link href="/cart" className={styles.cartLink}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                        {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
                    </Link>
                    <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
