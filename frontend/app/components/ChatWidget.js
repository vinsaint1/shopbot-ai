'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import styles from './ChatWidget.module.css';

export default function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && user && messages.length === 0) {
            loadHistory();
        }
    }, [isOpen, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const data = await api.getChatHistory();
            if (data.messages?.length > 0) {
                setMessages(data.messages);
            } else {
                setMessages([{
                    role: 'assistant',
                    content: "Hi there! 👋 I'm ShopBot, your AI shopping assistant. I can help you find products, track orders, and answer your questions. What can I help you with today?",
                }]);
            }
        } catch {
            setMessages([{
                role: 'assistant',
                content: "Hi! 👋 I'm ShopBot. How can I help you today?",
            }]);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        if (!user) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Please log in to chat with me! I need to know who you are to help track orders and give personalized recommendations. 😊'
            }]);
            return;
        }

        const userMsg = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const data = await api.sendMessage(userMsg.content);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                productCards: data.productCards
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again! 🙏'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = async () => {
        try {
            await api.clearChat();
            setMessages([{
                role: 'assistant',
                content: "Chat cleared! How can I help you today? 😊"
            }]);
        } catch { }
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                className={`${styles.chatButton} ${isOpen ? styles.chatButtonHidden : ''}`}
                onClick={() => setIsOpen(true)}
                aria-label="Open chat"
            >
                <span className={styles.chatIcon}>💬</span>
                <span className={styles.chatPulse}></span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className={styles.chatWindow}>
                    <div className={styles.chatHeader}>
                        <div className={styles.headerInfo}>
                            <span className={styles.headerIcon}>🤖</span>
                            <div>
                                <h4>ShopBot AI</h4>
                                <span className={styles.statusDot}>● Online</span>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button onClick={clearChat} className={styles.clearBtn} title="Clear chat">🗑️</button>
                            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✕</button>
                        </div>
                    </div>

                    <div className={styles.chatMessages}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                                {msg.role === 'assistant' && <span className={styles.avatar}>🤖</span>}
                                <div className={styles.messageContent}>
                                    <p>{msg.content}</p>
                                    {msg.productCards?.length > 0 && (
                                        <div className={styles.productCards}>
                                            {msg.productCards.map((p, j) => (
                                                <a key={j} href={`/products/${p.id}`} className={styles.productCard}>
                                                    {p.image && <img src={p.image} alt={p.name} className={styles.prodImage} />}
                                                    <div className={styles.prodInfo}>
                                                        <span className={styles.prodName}>{p.name}</span>
                                                        <span className={styles.prodPrice}>{p.price}</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className={`${styles.message} ${styles.assistant}`}>
                                <span className={styles.avatar}>🤖</span>
                                <div className={styles.typing}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className={styles.chatInput}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
