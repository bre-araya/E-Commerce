import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiShoppingBag, FiStar, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const perks = [
  'Early access to new arrivals',
  'Personalized recommendations',
  'Priority customer support',
];

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'user' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        ...(isAdmin ? { role: form.role } : { role: 'user' }),
      };

      await api.post('/auth/register', payload);
      api.post('/auth/send-verify', { email: form.email }).catch(() => {});

      toast.success('Successfully registered. Please verify your email and login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-primary-900 to-primary-600 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="w-full max-w-2xl rounded-[32px] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium">
            <FiStar />
            Join thousands of smart shoppers
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Create an account and unlock your best shopping experience.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-primary-100">
            Track orders, save favorites, and get access to curated deals that match your style and needs.
          </p>

          <div className="mt-8 rounded-[24px] border border-white/15 bg-slate-950/20 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                <FiShoppingBag size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Why join us?</h3>
                <p className="text-sm text-primary-100">A smoother, more rewarding way to shop.</p>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-primary-50">
                  <FiCheckCircle />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full max-w-lg rounded-[32px] border border-gray-200 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto inline-flex rounded-2xl bg-primary-600 px-4 py-2 text-2xl font-bold text-white">
              Shop
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-gray-900">Create account</h2>
            <p className="mt-2 text-gray-500">Start shopping today with a premium account experience</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { name: 'name', label: 'Full Name', icon: FiUser, type: 'text', ph: 'John Doe' },
              { name: 'email', label: 'Email Address', icon: FiMail, type: 'email', ph: 'you@example.com' },
              { name: 'password', label: 'Password', icon: FiLock, type: 'password', ph: '••••••••' },
              { name: 'confirm', label: 'Confirm Password', icon: FiLock, type: 'password', ph: '••••••••' },
            ].map((field) => (
              <div key={field.name}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={field.type === 'password' && showPass ? 'text' : field.type}
                    value={form[field.name]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                    placeholder={field.ph}
                    className="input-field pl-10 pr-10"
                    required
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="input-field"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base">
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}