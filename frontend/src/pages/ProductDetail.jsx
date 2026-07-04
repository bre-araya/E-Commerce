import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiStar, FiArrowLeft,
  FiMinus, FiPlus, FiPackage
} from 'react-icons/fi';
import api from '../utils/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id }       = useParams();   // Gets :id from URL
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { dispatch } = useCart();

  const [product,    setProduct]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [quantity,   setQuantity]   = useState(1);
  const [activeImg,  setActiveImg]  = useState(0);   // which image is selected
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch product when page loads
  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product:  product._id,
        name:     product.name,
        price:    product.price,
        image:    product.images[0]?.url,
        quantity,
      },
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      toast.success('Review submitted!');
      // Refresh product to show new review
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!product) return null;

  const alreadyReviewed = product.reviews?.some(
    r => r.user === user?._id || r.user?._id === user?._id
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600
          mb-6 transition-colors"
      >
        <FiArrowLeft size={18} />
        Back
      </button>

      {/* ── Product Main Section ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

        {/* Images */}
        <div>
          {/* Main image */}
          <div className="bg-gray-100 rounded-2xl overflow-hidden h-96 mb-3">
            <img
              src={product.images[activeImg]?.url || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors
                    ${activeImg === i ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-primary-600 font-medium uppercase tracking-wide text-sm mb-2">
            {product.category}
          </p>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>

          {/* Rating summary */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(star => (
                <FiStar
                  key={star}
                  size={18}
                  className={star <= Math.round(product.ratings)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-gray-600 text-sm">
              {product.ratings > 0 ? `${product.ratings} / 5` : 'No ratings yet'}
              {product.numReviews > 0 && ` (${product.numReviews} reviews)`}
            </span>
          </div>

          <p className="text-4xl font-bold text-gray-900 mb-4">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-600 leading-relaxed mb-6">
            {product.description}
          </p>

          {product.specifications?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{spec.key}</p>
                    <p className="font-medium text-gray-800">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-6">
            <FiPackage size={18} className={product.stock > 0 ? 'text-green-600' : 'text-red-500'} />
            <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0
                ? product.stock <= 5
                  ? `Only ${product.stock} left in stock!`
                  : `${product.stock} in stock`
                : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <FiMinus size={16} />
                </button>
                <span className="px-5 py-2 font-semibold border-x border-gray-300">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <FiPlus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="btn-primary w-full flex items-center justify-center gap-3
              py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShoppingCart size={22} />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* ── Reviews Section ──────────────────────────── */}
      <div className="border-t border-gray-200 pt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Customer Reviews
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">
                Write a Review
              </h3>

              {!user ? (
                <p className="text-gray-500 text-sm">
                  Please{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-primary-600 font-medium hover:underline"
                  >
                    login
                  </button>{' '}
                  to write a review.
                </p>
              ) : alreadyReviewed ? (
                <p className="text-green-600 text-sm font-medium">
                  ✅ You already reviewed this product.
                </p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Star Rating Selector */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Your Rating
                    </label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                          className="transition-transform hover:scale-110"
                        >
                          <FiStar
                            size={28}
                            className={star <= reviewForm.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Your Comment
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      rows={4}
                      placeholder="Share your experience with this product..."
                      className="input-field resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {product.reviews?.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-2">💬</p>
                <p>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              product.reviews.map(review => (
                <div key={review._id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-100 text-primary-700 rounded-full
                        h-9 w-9 flex items-center justify-center font-semibold">
                        {review.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{review.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(star => (
                        <FiStar
                          key={star}
                          size={14}
                          className={star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}