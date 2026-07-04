import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

// Step 1: Create the context object
// This is like creating an empty "container" that any component can plug into
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // true = still checking if user is logged in

  // Step 2: When app loads, check if token exists and fetch user profile
  // This keeps the user logged in across page refreshes
  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false); // No token = not logged in, stop loading
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      // Token is invalid or expired — clean up
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Called after login or register
  const login = async (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);

    // Sync local cart with server if any items exist locally
    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '{"items":[]}');
      if (localCart.items && localCart.items.length > 0) {
        const { data } = await api.post('/cart/sync', { items: localCart.items });

        // Normalize server cart items to client shape and save
        const serverItems = (data.cart?.items || []).map((i) => ({
          product: i.product._id ? i.product._id : i.product,
          name: i.name,
          price: i.price,
          image: i.image,
          quantity: i.quantity,
        }));

        localStorage.setItem('cart', JSON.stringify({ items: serverItems }));
        // Notify CartProvider to reload from localStorage
        window.dispatchEvent(new Event('cart_updated'));
      }
    } catch (err) {
      // Non-fatal — if sync fails, user can continue with local cart
      console.error('Cart sync failed', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Everything in "value" is accessible by any component inside AuthProvider
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — instead of importing both useContext and AuthContext
// every time, we just call useAuth()
export const useAuth = () => useContext(AuthContext);