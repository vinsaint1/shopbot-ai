'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { user } = useAuth();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const userRef = useRef(user);

    // Keep ref in sync without causing re-renders
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const fetchCart = useCallback(async () => {
        if (!userRef.current) { setCart(null); return; }
        try {
            setLoading(true);
            const data = await api.getCart();
            setCart(data);
        } catch {
            setCart(null);
        } finally {
            setLoading(false);
        }
    }, []); // No dependency on user — uses ref instead

    // Fetch cart when user changes
    useEffect(() => {
        fetchCart();
    }, [user, fetchCart]);

    const addToCart = async (productId, quantity = 1) => {
        const data = await api.addToCart(productId, quantity);
        setCart(data);
        return data;
    };

    const updateQuantity = async (itemId, quantity) => {
        const data = await api.updateCartItem(itemId, quantity);
        setCart(data);
        return data;
    };

    const removeItem = async (itemId) => {
        const data = await api.removeFromCart(itemId);
        setCart(data);
        return data;
    };

    const clearCart = async () => {
        await api.clearCart();
        setCart({ items: [] });
    };

    const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalPrice = cart?.items?.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * item.quantity;
    }, 0) || 0;

    return (
        <CartContext.Provider value={{
            cart, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart, itemCount, totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
