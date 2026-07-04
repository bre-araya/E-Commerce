import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { dispatch }  = useCart();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigating to product detail

    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (product.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product:  product._id,
        name:     product.name,
        price:    product.price,
        image:    product.images[0]?.url,
        quantity: 1,
      },
    });

    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Link to={`/products/${product._id}`}>
      <div className="card group cursor-pointer overflow-hidden">

        {/* Product Image */}
        <div className="relative overflow-hidden h-52 bg-gray-100">
          <img
            src={product.images[0]?.url || 'https://via.placeholder.com/300x200'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105
              transition-transform duration-300"
          />

          {/* Out of stock badge */}
          {product.stock === 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white
              text-xs px-2 py-1 rounded-full font-medium">
              Out of Stock
            </div>
          )}

          {/* Featured badge */}
          {product.featured && (
            <div className="absolute top-2 right-2 bg-primary-600 text-white
              text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <p className="text-xs text-primary-600 font-medium uppercase tracking-wide mb-1">
            {product.category}
          </p>

          <h3 className="font-semibold text-gray-800 truncate mb-1 group-hover:text-primary-600
            transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <FiStar className="text-yellow-400 fill-yellow-400" size={14} />
            <span className="text-sm text-gray-600">
              {product.ratings > 0 ? product.ratings : 'No reviews'}
            </span>
            {product.numReviews > 0 && (
              <span className="text-xs text-gray-400">({product.numReviews})</span>
            )}
          </div>

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.stock > 0 && product.stock <= 5 && (
                <p className="text-xs text-orange-500 mt-0.5">
                  Only {product.stock} left!
                </p>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="bg-primary-600 text-white p-2.5 rounded-lg
                hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
              title="Add to Cart"
            >
              <FiShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}