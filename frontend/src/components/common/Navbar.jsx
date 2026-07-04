import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiPackage } from 'react-icons/fi';
import { MdAdminPanelSettings } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout }    = useAuth();
  const { totalItems }      = useCart();
  const navigate            = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 text-white font-bold text-xl px-3 py-1 rounded-lg">
              SHOP NOW
            </div>
            <span className="font-bold text-gray-800 text-xl hidden sm:block">
              E-Commerece Store
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Home
            </Link>
            <Link to="/?category=Electronics"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Electronics
            </Link>
            <Link to="/?category=Clothing"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Clothing
            </Link>
            <Link to="/?category=Books"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Books
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin"
                className="font-medium text-primary-600 transition-colors hover:text-primary-700">
                Admin
              </Link>
            )}
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-4">

            {/* Cart icon with badge */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600">
              <FiShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white
                  text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                >
                  <div className="bg-primary-100 text-primary-700 rounded-full
                    h-8 w-8 flex items-center justify-center font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block font-medium text-sm">{user.name}</span>
                </button>

                {/* Dropdown menu */}
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg
                    border border-gray-100 py-1 z-50">

                    {/* Simple user menu: Cart, Orders, Profile. Admins also get dashboard link. */}
                    <>
                      <Link to="/cart"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <FiShoppingCart size={16} />
                        Cart
                      </Link>
                      <Link to="/orders"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <FiPackage size={16} />
                        My Orders
                      </Link>
                      <Link to="/profile"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <FiUser size={16} />
                        Profile
                      </Link>
                      <hr className="my-1 border-gray-100" />

                      {user.role === 'admin' && (
                        <>
                          <Link to="/admin" onClick={() => setDropOpen(false)} className="block px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50">Dashboard</Link>
                          <Link to="/admin/users" onClick={() => setDropOpen(false)} className="block px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50">Users</Link>
                        </>
                      )}

                    </>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                        hover:bg-red-50 w-full text-left">
                      <FiLogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">
                  Login
                </Link>
                <Link to="/register"
                  className="btn-primary text-sm py-2 px-4 hidden sm:block">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-2">
            {['/', '/?category=Electronics', '/?category=Clothing', '/?category=Books']
              .map((path, i) => (
                <Link key={i} to={path}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  {['Home', 'Electronics', 'Clothing', 'Books'][i]}
                </Link>
              ))}
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block rounded-lg bg-primary-50 px-4 py-2 font-medium text-primary-700">
                Admin Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}