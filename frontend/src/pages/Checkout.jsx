import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const PAYMENT_METHODS = ['Cash on Delivery', 'Credit Card', 'Mobile Money'];

// Stripe packages are optional. If not installed or keys not set,
// the Credit Card option is disabled to avoid build-time import errors.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) : null;

function CheckoutForm({ items, totalPrice, dispatch }) {
  const stripe = useStripe();
  const elements = useElements();
  // Detect whether Stripe is likely configured (publishable key present)
  const stripeAvailable = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName:   '',
    address:    '',
    city:       '',
    postalCode: '',
    country:    '',
    phone:      '',
  });

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [notes, setNotes] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const empty = Object.entries(form).find(([_, v]) => !v.trim());
    if (empty) {
      toast.error(`Please fill in ${empty[0]}`);
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    // Ensure server has the current cart contents before creating an order.
    // This makes the backend Cart model match the client's local cart.
    await api.post('/cart/sync', { items });

    setLoading(true);
    try {
      let paymentIntentId = undefined;

      if (paymentMethod === 'Credit Card') {
        if (!stripeAvailable) {
          toast.error('Credit card payments are not enabled. Install Stripe packages and set VITE_STRIPE_PUBLISHABLE_KEY.');
          setLoading(false);
          return;
        }

        // Create PaymentIntent on server
        const amountInCents = Math.round((totalPrice + (totalPrice > 100 ? 0 : 10)) * 100);
        const { data } = await api.post('/payments/create-intent', { amount: amountInCents });
        const clientSecret = data.clientSecret;
        paymentIntentId = data.intentId;

        // Confirm card payment using Stripe.js
        const card = elements.getElement(CardElement);
        if (!card) {
          toast.error('Card element not found');
          setLoading(false);
          return;
        }

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card },
        });

        if (result.error) {
          toast.error(result.error.message || 'Payment failed');
          setLoading(false);
          return;
        }

        if (result.paymentIntent?.status !== 'succeeded' && result.paymentIntent?.status !== 'requires_capture') {
          toast.error('Payment not completed');
          setLoading(false);
          return;
        }
      }

      // Create order with optional paymentIntentId
      await api.post('/orders', {
        shippingAddress: form,
        paymentMethod,
        notes,
        paymentIntentId,
      });

      dispatch({ type: 'CLEAR_CART' });
      toast.success('Order placed successfully! 🎉');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const shipping = totalPrice > 100 ? 0 : 10;
  const total = totalPrice + shipping;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FiMapPin className="text-primary-600" size={20} />
                Shipping Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'fullName', label: 'Full Name', placeholder: 'John Doe' },
                  { name: 'phone', label: 'Phone Number', placeholder: '+251911000000' },
                  { name: 'address', label: 'Street Address', placeholder: '123 Bole Road', full: true },
                  { name: 'city', label: 'City', placeholder: 'Addis Ababa' },
                  { name: 'postalCode', label: 'Postal Code', placeholder: '1000' },
                  { name: 'country', label: 'Country', placeholder: 'Ethiopia' },
                ].map(field => (
                  <div key={field.name} className={field.full ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="input-field"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FiCreditCard className="text-primary-600" size={20} />
                Payment Method
              </h2>

              <div className="space-y-3">
                {PAYMENT_METHODS.map(method => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
                      transition-colors ${paymentMethod === method
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="text-primary-600"
                    />
                    <span className="font-medium text-gray-700">{method}</span>
                    {paymentMethod === method && (
                      <FiCheck className="text-primary-600 ml-auto" size={18} />
                    )}
                  </label>
                ))}

                {paymentMethod === 'Credit Card' && (
                  <div className="mt-4 p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">
                      Credit card payments require Stripe client integration. To enable:
                    </p>
                    <ul className="text-sm list-disc ml-5 mt-2 text-gray-600">
                      <li>Install `@stripe/stripe-js` and `@stripe/react-stripe-js` in the frontend</li>
                      <li>Set `VITE_STRIPE_PUBLISHABLE_KEY` in your frontend .env</li>
                      <li>Reload the dev server</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special instructions for delivery..."
                className="input-field resize-none"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Your Order</h2>

              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.product} className="flex items-center gap-3">
                    <img src={item.image || 'https://via.placeholder.com/48'} alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <FiCheck size={20} />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, totalPrice, dispatch } = useCart();

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm items={items} totalPrice={totalPrice} dispatch={dispatch} />
    </Elements>
  );
}
