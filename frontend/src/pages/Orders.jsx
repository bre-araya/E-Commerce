import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiClock, FiCheck, FiTruck, FiX } from 'react-icons/fi';
import api from '../utils/axios';
import Spinner from '../components/common/Spinner';

// Status config — color + icon for each order status
const STATUS = {
  Pending:    { color: 'bg-yellow-100 text-yellow-800', icon: FiClock    },
  Processing: { color: 'bg-blue-100 text-blue-800',     icon: FiPackage  },
  Shipped:    { color: 'bg-purple-100 text-purple-800', icon: FiTruck    },
  Delivered:  { color: 'bg-green-100 text-green-800',   icon: FiCheck    },
  Cancelled:  { color: 'bg-red-100 text-red-800',       icon: FiX        },
};

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-7xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">You haven't placed any orders.</p>
          <Link to="/" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = STATUS[order.status] || STATUS.Pending;
            const Icon   = status.icon;

            return (
              <div key={order._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Order ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-700">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Date</p>
                    <p className="text-sm text-gray-700">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total</p>
                    <p className="font-bold text-gray-900">
                      ${order.totalPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`flex items-center gap-1.5 px-3 py-1.5
                    rounded-full text-sm font-medium ${status.color}`}>
                    <Icon size={14} />
                    {order.status}
                  </span>
                </div>

                {/* Order items preview */}
                <div className="flex gap-3 flex-wrap">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50
                      rounded-lg px-3 py-2">
                      <img
                        src={item.image || 'https://via.placeholder.com/40'}
                        alt={item.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span className="text-sm text-gray-700 max-w-[120px] truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping address */}
                <div className="mt-4 pt-4 border-t border-gray-100
                  flex flex-wrap gap-6 text-sm text-gray-500">
                  <div>
                    <span className="font-medium text-gray-700">Ship to: </span>
                    {order.shippingAddress.fullName}, {order.shippingAddress.city},{' '}
                    {order.shippingAddress.country}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Payment: </span>
                    {order.paymentMethod}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}