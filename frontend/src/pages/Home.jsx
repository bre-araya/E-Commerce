import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiClipboard, FiFilter, FiHeadphones, FiPackage, FiSearch, FiShield, FiShoppingCart, FiStar, FiTruck, FiUser, FiZap } from 'react-icons/fi';
import api from '../utils/axios';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Other'];

const highlights = [
  {
    icon: FiTruck,
    title: 'Fast delivery',
    description: 'Free express shipping on orders above $50 with live tracking.',
  },
  {
    icon: FiShield,
    title: 'Secure checkout',
    description: 'Protected payments and reliable support for every transaction.',
  },
  {
    icon: FiHeadphones,
    title: 'Dedicated support',
    description: 'Our team is available around the clock for quick assistance.',
  },
];

const categoryCards = [
  {
    title: 'Electronics',
    description: 'Smart devices, audio, and everyday tech essentials.',
    href: '/?category=Electronics',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Fashion',
    description: 'Fresh looks for work, travel, and weekend comfort.',
    href: '/?category=Clothing',
    accent: 'from-fuchsia-500 to-pink-500',
  },
  {
    title: 'Home & Living',
    description: 'Upgrade your space with practical and modern pieces.',
    href: '/?category=Home',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Books & More',
    description: 'Discover stories, learning picks, and thoughtful gifts.',
    href: '/?category=Books',
    accent: 'from-amber-500 to-orange-500',
  },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;
  const isAuthenticated = Boolean(user);
  const showLanding = !isAuthenticated && !keyword && !category;

  useEffect(() => {
    api.get('/products/featured')
      .then(({ data }) => setFeatured(data.products))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (category) params.set('category', category);
    params.set('page', page);
    params.set('limit', 12);

    api.get(`/products?${params}`)
      .then(({ data }) => {
        setProducts(data.products);
        setTotalPages(data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [keyword, category, page]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="bg-gray-50">
      {showLanding && (
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-primary-800 to-primary-600 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_40%)]" />
            <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:gap-14 lg:px-8 lg:py-28">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
                  <FiStar />
                  New season arrivals are live
                </div>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Shop smarter.
                  <span className="block text-primary-100">Live better.</span>
                </h1>
                <p className="mt-5 max-w-xl text-lg text-primary-100 sm:text-xl">
                  Discover premium essentials, curated collections, and standout deals designed for the way you live today.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/?category=Electronics" className="btn-primary inline-flex items-center justify-center gap-2">
                    Explore collection
                    <FiArrowRight />
                  </Link>
                  <Link to="/?category=Clothing" className="btn-secondary inline-flex items-center justify-center border-white/30 bg-white/10 text-white hover:bg-white/20">
                    Shop deals
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-primary-50">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Free delivery over $50</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">24/7 customer support</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Easy returns</span>
                </div>
              </div>

              <div className="w-full max-w-xl rounded-[28px] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[24px] bg-white p-6 text-gray-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-600">Featured pick</p>
                      <h2 className="mt-1 text-2xl font-semibold">Elevated everyday essentials</h2>
                    </div>
                    <div className="rounded-full bg-primary-50 p-3 text-primary-600">
                      <FiZap size={20} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-500">Average rating</p>
                      <div className="mt-3 flex items-center gap-2">
                        <FiStar className="text-yellow-400" />
                        <span className="text-2xl font-semibold text-gray-900">4.9/5</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-500">Trusted by</p>
                      <p className="mt-3 text-2xl font-semibold text-gray-900">20k+ shoppers</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search products..."
                      defaultValue={keyword}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateFilter('keyword', e.target.value);
                      }}
                      className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                  </div>
                );
              })}
            </div>

            <section className="mt-14 grid gap-8 rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Curated categories</p>
                <h2 className="mt-3 text-3xl font-semibold text-gray-900">Find exactly what fits your lifestyle.</h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  Every collection is handpicked for quality, value, and modern design so you can shop with confidence.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {categoryCards.map((card) => (
                  <Link key={card.title} to={card.href} className="group rounded-2xl border border-gray-200 bg-gray-50 p-5 transition hover:-translate-y-1 hover:shadow-md">
                    <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${card.accent}`} />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{card.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600">
                      Browse now
                      <FiArrowRight className="transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {featured.length > 0 && (
              <section className="mt-14">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Featured picks</p>
                    <h2 className="mt-2 text-3xl font-semibold text-gray-900">Fresh favorites worth showing off</h2>
                  </div>
                  <Link to="/" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                    See all products →
                  </Link>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {featured.slice(0, 4).map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-14 rounded-[32px] bg-gradient-to-r from-primary-600 to-primary-500 p-8 text-white shadow-xl sm:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-100">Ready to shop?</p>
                  <h2 className="mt-3 text-3xl font-semibold">Upgrade your routine with premium picks.</h2>
                  <p className="mt-3 text-lg text-primary-50">
                    Explore the latest arrivals, discover curated collections, and enjoy a smooth, reliable shopping experience from start to finish.
                  </p>
                </div>
                <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-primary-700 transition hover:bg-primary-50">
                  Start shopping
                  <FiArrowRight />
                </Link>
              </div>
            </section>
          </div>
        </>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 font-medium text-gray-600">
              <FiFilter size={18} />
              <span>Filter:</span>
            </div>

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => updateFilter('category', cat === 'All' ? '' : cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  (cat === 'All' && !category) || category === cat
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {(keyword || category) && (
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Search products..."
                defaultValue={keyword}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateFilter('keyword', e.target.value);
                }}
                className="input-field max-w-sm"
              />
            </div>
          )}

          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            {keyword ? `Results for "${keyword}"` : category ? `${category} Products` : 'All Products'}
          </h2>

          {loading ? (
            <Spinner />
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="mb-4 text-6xl text-gray-400">🔍</p>
              <p className="text-lg text-gray-500">No products found</p>
              <button onClick={() => setSearchParams({})} className="btn-primary mt-4">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('page', p);
                    setSearchParams(next);
                  }}
                  className={`h-10 w-10 rounded-lg font-medium transition-colors ${
                    page === p
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}