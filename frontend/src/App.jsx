import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar          from './components/common/Navbar';
import Footer          from './components/common/Footer';
import ProtectedRoute  from './components/common/ProtectedRoute';

// Pages
import Home            from './pages/Home';
import ProductDetail   from './pages/ProductDetail';
import CartPage        from './pages/Cart';
import CheckoutPage    from './pages/Checkout';
import LoginPage       from './pages/Login';
import RegisterPage    from './pages/Register';
import OrdersPage      from './pages/Orders';
import ProfilePage     from './pages/Profile';
import VerifyEmailPage from './pages/VerifyEmail';

// Admin Pages
import AdminDashboard  from './pages/admin/Dashboard';
import AdminProducts   from './pages/admin/Products';
import AdminOrders     from './pages/admin/Orders';
import AdminUsers      from './pages/admin/Users';


export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        {/* Main content grows to fill space between navbar and footer */}
        <main className="flex-1">
          <Routes>
            {/* Public routes — anyone can access */}
            <Route path="/"            element={<Home />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/register"    element={<RegisterPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

            {/* Protected routes — must be logged in */}
            {/* Also routes shown for admin are in the admin route block below */}
            <Route element={<ProtectedRoute />}>

              <Route path="/cart"     element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders"   element={<OrdersPage />} />
              <Route path="/profile"  element={<ProfilePage />} />
            </Route>

            {/* Admin routes — must be logged in + admin role */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin"          element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders"   element={<AdminOrders />} />
              <Route path="/admin/users"    element={<AdminUsers />} />
            </Route>
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}