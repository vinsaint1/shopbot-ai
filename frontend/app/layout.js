import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';

export const metadata = {
  title: 'ShopbotAi | Step In Style',
  description: 'Curated fashion and lifestyle essentials. Premium quality meets intelligent shopping at ShopbotAi.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main style={{ minHeight: '80vh' }}>
              {children}
            </main>
            <Footer />
            <ChatWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
