'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            if (data.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authIcon}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--royal-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your account</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.authSwitch}>
                    Don&apos;t have an account? <Link href="/auth/register">Create one</Link>
                </p>

            </div>
        </div>
    );
}
