import { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import api from '../../utils/axios';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLOR = {
  Pending:    'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped:    'bg-purple-100 text-purple-800',
  Delivered:  'bg-green-100 text-green-800',
  Cancelled:  'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All');
  const [expanded, setExpanded] = useState(null); // expanded order id

  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      // Update locally — no need to refetch all orders
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status } : o)
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = filter === 'All'
    ? orders
    : orders.filter(o => o.status === filter);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">{orders.length} total orders</p>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <FiFilter size={18} className="text-gray-500" />
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === s
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
          >
            {s}
            {s !== 'All' && (
              <span className="ml-1 text-xs opacity-70">
                ({orders.filter(o => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No {filter !== 'All' ? filter.toLowerCase() : ''} orders found
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Order Row */}
              <div
                className="flex flex-wrap items-center gap-4 p-5 cursor-pointer
                  hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === order._id ? null : order._id)}
              >
                {/* Order ID */}
                <div className="min-w-[100px]">
                  <p className="text-xs text-gray-400">Order ID</p>
                  <p className="font-mono font-semibold text-gray-800">
                    #{order._id.slice(-6).toUpperCase()}
                  </p>
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs text-gray-400">Customer</p>
                  <p className="font-medium text-gray-800">
                    {order.user?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">{order.user?.email}</p>
                </div>

                {/* Total */}
                <div className="min-w-[80px]">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="font-bold text-gray-900">
                    ${order.totalPrice.toFixed(2)}
                  </p>
                </div>

                {/* Date */}
                <div className="min-w-[100px]">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Status Badge + Update */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${STATUS_COLOR[order.status]}`}>
                    {order.status}
                  </span>

                  {/* Status Update Dropdown */}
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order._id, e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1
                      focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {STATUSES.filter(s => s !== 'All').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expanded === order._id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Items */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Items ({order.items.length})
                      </h3>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white
                            rounded-lg p-3">
                            <img
                              src={item.image || 'https://via.placeholder.com/40'}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <span className="font-bold text-sm text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping + Payment */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">
                          Shipping Address
                        </h3>
                        <div className="bg-white rounded-lg p-3 text-sm text-gray-600 space-y-1">
                          <p className="font-medium text-gray-800">
                            {order.shippingAddress.fullName}
                          </p>
                          <p>{order.shippingAddress.address}</p>
                          <p>
                            {order.shippingAddress.city},{' '}
                            {order.shippingAddress.postalCode}
                          </p>
                          <p>{order.shippingAddress.country}</p>
                          <p>{order.shippingAddress.phone}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">
                          Payment & Pricing
                        </h3>
                        <div className="bg-white rounded-lg p-3 text-sm space-y-1">
                          <div className="flex justify-between text-gray-600">
                            <span>Method</span>
                            <span className="font-medium">{order.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Items</span>
                            <span>${order.itemsPrice?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Shipping</span>
                            <span>${order.shippingPrice?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900
                            border-t border-gray-100 pt-1 mt-1">
                            <span>Total</span>
                            <span>${order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                          <p className="bg-white rounded-lg p-3 text-sm text-gray-600">
                            {order.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}