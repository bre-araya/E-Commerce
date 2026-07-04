import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Reducer: pure function that handles all cart operations
// Think of it like a switch board — receives an action, returns new state
const cartReducer = (state, action) => {
  switch (action.type) {

    case 'SET_CART':
      return action.payload;

    case 'ADD_ITEM': {
      // Check if product already in cart
      const exists = state.items.find(i => i.product === action.payload.product);
      if (exists) {
        // Just increment quantity — don't add duplicate
        return {
          ...state,
          items: state.items.map(i =>
            i.product === action.payload.product
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      // New product — add to cart
      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.product !== action.payload),
      };

    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map(i =>
          i.product === action.payload.product
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };

    case 'CLEAR_CART':
      return { items: [] };

    default:
      return state;
  }
};

export function CartProvider({ children }) {
  // Load cart from localStorage so it persists across page refreshes
  const saved = JSON.parse(localStorage.getItem('cart') || '{"items":[]}');
  const [state, dispatch] = useReducer(cartReducer, saved);

  // Listen for external cart updates (e.g. after login sync)
  useEffect(() => {
    const handler = () => {
      const updated = JSON.parse(localStorage.getItem('cart') || '{"items":[]}');
      dispatch({ type: 'SET_CART', payload: updated });
    };
    window.addEventListener('cart_updated', handler);
    return () => window.removeEventListener('cart_updated', handler);
  }, []);

  // Save cart to localStorage every time it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  // Computed values — derived from cart items
  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, dispatch, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);