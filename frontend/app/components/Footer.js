import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            {/* Step In Style CTA */}
            <div className={styles.cta}>
                <h2 className={styles.ctaTitle}>Step In Style</h2>
                <p className={styles.ctaText}>Discover curated collections designed for the modern individual.</p>
            </div>

            {/* Footer Content */}
            <div className={styles.content}>
                <div className={styles.container}>
                    <div className={styles.grid}>
                        <div className={styles.brand}>
                            <h3 className={styles.brandName}>ShopbotAi</h3>
                            <p>Curated fashion and lifestyle essentials. Premium quality meets intelligent shopping.</p>
                        </div>
                        <div className={styles.col}>
                            <h4>Shop</h4>
                            <Link href="/products">All Products</Link>
                            <Link href="/products?category=Clothing">Clothing</Link>
                            <Link href="/products?category=Electronics">Electronics</Link>
                            <Link href="/products?category=Sports">Sports</Link>
                        </div>
                        <div className={styles.col}>
                            <h4>Account</h4>
                            <Link href="/auth/login">Login</Link>
                            <Link href="/auth/register">Register</Link>
                            <Link href="/account">My Account</Link>
                            <Link href="/cart">Cart</Link>
                        </div>
                        <div className={styles.col}>
                            <h4>Support</h4>
                            <p>Need help? Chat with our AI assistant anytime.</p>
                            <p className={styles.email}>support@shopbotai.com</p>
                        </div>
                    </div>
                    <div className={styles.bottom}>
                        <p>&copy; {new Date().getFullYear()} ShopbotAi. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
