import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary-600 text-white font-bold px-3 py-1 rounded-lg">
                Shop
              </div>
              <span className="font-bold text-white text-lg">CodeAlpha</span>
            </div>
            <p className="text-sm text-gray-400">
              A full-stack e-commerce store built with React, Node.js and MongoDB.
              CodeAlpha Internship Project.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[['/', 'Home'], ['/cart', 'Cart'], ['/orders', 'My Orders'], ['/login', 'Login']].map(([path, label]) => (
                <li key={path}>
                  <Link to={path} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {['Electronics', 'Clothing', 'Books', 'Sports', 'Home', 'Beauty'].map(cat => (
                <li key={cat}>
                  <Link to={`/?category=${cat}`} className="hover:text-white transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row
          justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2025 CodeAlpha E-Commerce. Built for internship purposes.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="hover:text-white transition-colors">
              <FiGithub size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer"
              className="hover:text-white transition-colors">
              <FiLinkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}