import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const benefits = [
  { icon: FiTruck, title: 'Fast shipping', text: 'Free delivery on orders over $50' },
  { icon: FiShield, title: 'Secure payments', text: 'Protected checkout with trusted providers' },
  { icon: FiShoppingBag, title: 'Saved favorites', text: 'Keep your wishlist and orders in one place' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      const accessToken = data.token || data.accessToken;
      login(data.user, accessToken);

      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user?.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-primary-900 to-primary-600 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="w-full max-w-2xl rounded-[32px] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium">
            <FiShoppingBag />
            Welcome back to your favorite storefront
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Sign in and continue your next great purchase.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-primary-100">
            Enjoy a faster checkout, see your order history, and stay connected with handpicked deals made for you.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-white/15 bg-slate-950/20 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-primary-100">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-lg rounded-[32px] border border-gray-200 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto inline-flex rounded-2xl bg-primary-600 px-4 py-2 text-2xl font-bold text-white">
              Shop
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-500">Sign in to your account and continue shopping</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base">
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-700">
            <div className="flex items-center gap-2 font-medium">
              <FiCheckCircle />
              Trusted by thousands of shoppers worldwide
            </div>
          </div>

          {import.meta.env.DEV && (
            <button
              onClick={() => setForm({ email: 'admin@ecommerce.com', password: 'admin123' })}
              className="mt-4 w-full text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Dev: Fill admin credentials
            </button>
          )}

          <p className="mt-6 text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}