import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, dispatch, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const updateQty = (productId, quantity) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
      toast.success('Item removed from cart');
    } else {
      dispatch({ type: 'UPDATE_QTY', payload: { product: productId, quantity } });
    }
  };

  const removeItem = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared');
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">
          Looks like you haven't added anything yet.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <FiShoppingBag size={18} />
          Start Shopping
        </Link>
      </div>
    );
  }

  const shipping = totalPrice > 100 ? 0 : 10;
  const total    = totalPrice + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Shopping Cart
          <span className="text-lg font-normal text-gray-500 ml-2">
            ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
        </h1>
        <button
          onClick={clearCart}
          className="text-red-500 hover:text-red-700 text-sm font-medium
            flex items-center gap-1 transition-colors"
        >
          <FiTrash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Cart Items ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100
                flex gap-4 items-center">

              {/* Product image */}
              <Link to={`/products/${item.product}`}>
                <img
                  src={item.image || 'https://via.placeholder.com/80'}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0
                    hover:opacity-80 transition-opacity"
                />
              </Link>

              {/* Item details */}
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product}`}>
                  <h3 className="font-semibold text-gray-800 hover:text-primary-600
                    transition-colors truncate">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-primary-600 font-bold text-lg mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => updateQty(item.product, item.quantity - 1)}
                    className="px-2 py-1.5 hover:bg-gray-100 transition-colors rounded-l-lg"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="px-3 py-1.5 font-semibold text-sm border-x border-gray-200 min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.product, item.quantity + 1)}
                    className="px-2 py-1.5 hover:bg-gray-100 transition-colors rounded-r-lg"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>

                {/* Item total */}
                <span className="font-bold text-gray-800 w-20 text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.product)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order Summary ────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalItems} items)</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">
                  Free shipping on orders over $100
                </p>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-bold text-xl text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
            >
              Proceed to Checkout
              <FiArrowRight size={20} />
            </button>

            <Link
              to="/"
              className="block text-center text-primary-600 hover:text-primary-700
                mt-4 text-sm font-medium transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}