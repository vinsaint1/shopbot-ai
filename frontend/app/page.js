'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './components/ProductCard';
import api from './lib/api';
import styles from './page.module.css';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    try {
      const data = await api.getProducts({ featured: 'true', limit: 8 });
      setFeatured(data.products);
    } catch (err) {
      console.error('Failed to load featured products:', err);
    } finally {
      setLoading(false);
    }
  };

  const lookbooks = [
    { label: 'Minimalist', image: '/images/lookbook-minimalist.png' },
    { label: 'Classic', image: '/images/lookbook-classic.png' },
    { label: 'Modern', image: '/images/lookbook-modern.png' },
    { label: 'Avant-Garde', image: '/images/lookbook-avantgarde.png' },
  ];

  return (
    <div className={styles.home}>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>ShopbotAi</h1>
        </div>
        <img
          src="/images/hero-models.png"
          alt="Fashion models in royal blue"
          className={styles.heroImage}
        />
        <div className={styles.heroCta}>
          <Link href="/products" className={styles.shopNowBtn}>
            Shop Now
          </Link>
        </div>
      </section>

      {/* ===== ICON TAGLINE ===== */}
      <section className={styles.tagline}>
        <p className={styles.taglineText}>
          Everyday comfort with stylish versatility. Sleek designs for business and special occasions. Relaxed style with breathable comfort.
        </p>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className={styles.whySection}>
        <div className={styles.whyGrid}>
          <div className={styles.whyImageCol}>
            <img
              src="/images/why-choose.png"
              alt="Fashion editorial"
              className={styles.whyImage}
            />
          </div>
          <div className={styles.whyContent}>
            <h2 className={styles.whyTitle}>Why Choose Us?</h2>
            <p className={styles.whyText}>
              Shopping online should be effortless. With our AI-powered assistant, you get personalized product recommendations, instant answers to your questions, and real-time order tracking — all in one seamless experience.
            </p>
            <p className={styles.whyText}>
              We curate only the finest products from trusted brands, backed by secure checkout, fast delivery, and hassle-free returns. Every item is quality-checked so you can shop with complete confidence.
            </p>
            <Link href="/products" className={styles.whyBtn}>
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BEST SELLERS ===== */}
      <section className={styles.bestSellers}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Sellers</h2>
          <Link href="/products" className={styles.viewAllLink}>
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="loading-page"><div className="spinner"></div></div>
        ) : (
          <div className={styles.productGrid}>
            {featured.slice(0, 8).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ===== FEATURED COLLECTION ===== */}
      <section className={styles.collection}>
        <h2 className={styles.collectionTitle}>The Featured Collection</h2>
        <div className={styles.lookbookGrid}>
          {lookbooks.map((item) => (
            <Link href="/products" key={item.label} className={styles.lookbookCard}>
              <div className={styles.lookbookImageWrap}>
                <img src={item.image} alt={item.label} className={styles.lookbookImage} />
              </div>
              <span className={styles.lookbookLabel}>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
