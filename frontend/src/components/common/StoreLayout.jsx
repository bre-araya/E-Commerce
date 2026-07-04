import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiClipboard, FiPackage, FiShoppingCart, FiTruck, FiUser, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const navItems = [
  { to: '/', label: 'Products', icon: FiPackage },
  { to: '/cart', label: 'Cart', icon: FiShoppingCart },
  { to: '/orders', label: 'Orders', icon: FiClipboard },
  { to: '/checkout', label: 'Checkout', icon: FiTruck },
  { to: '/profile', label: 'Profile', icon: FiUser },
];

export default function StoreLayout({ children }) {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (!user) return <>{children ?? <Outlet />}</>;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6 lg:py-8">
        <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-72">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)]">
            <div className="border-b border-slate-100 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-100">Store hub</p>
                  <h2 className="mt-2 text-xl font-semibold">Welcome back</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold backdrop-blur">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/20 bg-slate-950/20 p-3 backdrop-blur">
                <p className="text-sm text-primary-50">{user?.name || 'Valued customer'}</p>
                <p className="mt-1 text-xs text-primary-100">Fast access to your essentials</p>
              </div>
            </div>

            <div className="p-4">
              <nav className="space-y-2">
                {navItems.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-50 text-primary-700 shadow-sm'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-primary-600'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`rounded-xl p-2 ${active ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon size={16} />
                        </span>
                        {label}
                      </span>
                      {to === '/cart' && totalItems > 0 ? (
                        <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {totalItems}
                        </span>
                      ) : (
                        <FiChevronRight className={active ? 'text-primary-500' : 'text-slate-400'} size={15} />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Quick note</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your favorite products, cart, and orders are always one click away from this smart sidebar.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
