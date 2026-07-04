import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiShoppingBag, FiUsers,
  FiDollarSign, FiTrendingUp, FiAlertCircle
} from 'react-icons/fi';
import api from '../../utils/axios';
import Spinner from '../../components/common/Spinner';

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders?limit=5'),
      api.get('/products'),
    ])
      .then(([ordersRes, productsRes]) => {
        const allOrders = ordersRes.data.orders;
        setOrders(allOrders.slice(0, 5));
        setStats({
          totalOrders:   ordersRes.data.total,
          totalProducts: productsRes.data.total,
          totalRevenue:  allOrders.reduce((s, o) => s + o.totalPrice, 0),
          pending:       allOrders.filter(o => o.status === 'Pending').length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const statCards = [
    { label: 'Total Revenue',  value: `$${stats.totalRevenue.toFixed(2)}`, icon: FiDollarSign, color: 'bg-green-100 text-green-700'  },
    { label: 'Total Orders',   value: stats.totalOrders,                   icon: FiShoppingBag, color: 'bg-blue-100 text-blue-700'   },
    { label: 'Total Products', value: stats.totalProducts,                 icon: FiPackage,     color: 'bg-purple-100 text-purple-700' },
    { label: 'Pending Orders', value: stats.pending,                       icon: FiAlertCircle, color: 'bg-orange-100 text-orange-700' },
  ];

  const STATUS_COLOR = {
    Pending:    'bg-yellow-100 text-yellow-800',
    Processing: 'bg-blue-100 text-blue-800',
    Shipped:    'bg-purple-100 text-purple-800',
    Delivered:  'bg-green-100 text-green-800',
    Cancelled:  'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`inline-flex p-3 rounded-xl mb-3 ${card.color}`}>
              <card.icon size={22} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/admin/products"
          className="bg-primary-600 text-white rounded-2xl p-6 hover:bg-primary-700
            transition-colors flex items-center gap-4">
          <FiPackage size={28} />
          <div>
            <p className="font-bold text-lg">Manage Products</p>
            <p className="text-primary-200 text-sm">Add, edit, delete products</p>
          </div>
        </Link>
        <Link to="/admin/orders"
          className="bg-gray-800 text-white rounded-2xl p-6 hover:bg-gray-900
            transition-colors flex items-center gap-4">
          <FiShoppingBag size={28} />
          <div>
            <p className="font-bold text-lg">Manage Orders</p>
            <p className="text-gray-400 text-sm">View and update order statuses</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders"
            className="text-primary-600 text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left pb-3 text-gray-500 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-mono font-semibold text-gray-700">
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-3 text-gray-700">
                    {order.user?.name || 'Unknown'}
                  </td>
                  <td className="py-3 font-bold text-gray-900">
                    ${order.totalPrice.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${STATUS_COLOR[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}