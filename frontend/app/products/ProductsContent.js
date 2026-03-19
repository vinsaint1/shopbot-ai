'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import styles from './products.module.css';

export default function ProductsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auth Protection Check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [sort, setSort] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Food', 'Other'];

    useEffect(() => {
        loadProducts();
    }, [category, sort, page]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (search) params.search = search;
            if (category) params.category = category;
            if (sort) params.sort = sort;

            const data = await api.getProducts(params);
            setProducts(data.products);
            setTotalPages(data.pages);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadProducts();
    };

    if (authLoading || !user) {
        return <div className="page-container"><div className="loading-page"><div className="spinner"></div></div></div>;
    }

    return (
        <div className="page-container">
            <h1 className="section-title">All Products</h1>
            <p className="section-subtitle">{category ? `Category: ${category}` : 'Browse our full catalog'}</p>

            <div className={styles.filters}>
                <form onSubmit={handleSearch} className={styles.searchBar}>
                    <input type="text" placeholder="Search products..." value={search}
                        onChange={e => setSearch(e.target.value)} className="input" />
                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                </form>
                <div className={styles.filterRow}>
                    <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="input">
                        <option value="">Sort by</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                        <option value="name">Name A-Z</option>
                    </select>
                    {category && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setCategory(''); setPage(1); }}>
                            Clear Filter ✕
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-page"><div className="spinner"></div></div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    <div className={styles.grid}>
                        {products.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Previous</button>
                            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
