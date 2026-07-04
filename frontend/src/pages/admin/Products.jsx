import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiSearch } from 'react-icons/fi';
import api from '../../utils/axios';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Other'];

const EMPTY_FORM = {
  name: '', description: '', price: '', category: '',
  stock: '', featured: false, specifications: [],
};

export default function AdminProducts() {
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);  // product being edited
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [images,    setImages]    = useState([]);    // File objects
  const [previews,  setPreviews]  = useState([]);    // Preview URLs
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');
  const [specRows, setSpecRows] = useState([{ key: '', value: '' }]);
  const fileRef = useRef();

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products?limit=100')
      .then(({ data }) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, specifications: [] });
    setImages([]);
    setPreviews([]);
    setSpecRows([{ key: '', value: '' }]);
    setModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name:        product.name,
      description: product.description,
      price:       product.price,
      category:    product.category,
      stock:       product.stock,
      featured:    product.featured,
      specifications: product.specifications || [],
    });
    setImages([]);
    setPreviews(product.images.map(i => i.url)); // Show existing images
    setSpecRows((product.specifications || []).length > 0 ? product.specifications.map(item => ({ key: item.key || '', value: item.value || '' })) : [{ key: '', value: '' }]);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM, specifications: [] });
    setImages([]);
    setPreviews([]);
    setSpecRows([{ key: '', value: '' }]);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    // Generate preview URLs so user can see selected images
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await api.post('/products/import-csv', { csv: text });
      toast.success('Import started — refreshed product list');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
  };

  const exportCSV = async (type) => {
    try {
      const url = `/products/export/${type}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${type}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Use FormData because we're sending files (multipart/form-data)
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'specifications') return;
        formData.append(key, val);
      });
      const specifications = specRows.filter(row => row.key.trim() || row.value.trim()).map(row => ({ key: row.key.trim(), value: row.value.trim() }));
      formData.append('specifications', JSON.stringify(specifications));
      images.forEach(img => formData.append('images', img));

      if (editing) {
        await api.put(`/products/${editing._id}`, formData);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully!');
      }

      fetchProducts();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">{products.length} total products</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportCSV('products')} className="btn-secondary flex items-center gap-2">
            Export Products
          </button>
          <button onClick={() => exportCSV('orders')} className="btn-secondary flex items-center gap-2">
            Export Orders
          </button>
          <input type="file" accept="text/csv" onChange={handleImportFile} className="hidden" ref={fileRef} />
          <button onClick={() => fileRef.current.click()} className="btn-secondary flex items-center gap-2">
            <FiUpload size={16} /> Import CSV
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <FiPlus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-gray-500 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(product => (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  {/* Product */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]?.url || 'https://via.placeholder.com/40'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 max-w-[200px] truncate">
                          {product.name}
                        </p>
                        {product.featured && (
                          <span className="text-xs text-primary-600 font-medium">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-6 py-4 text-gray-600">{product.category}</td>
                  {/* Price */}
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  {/* Stock */}
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock <= 5  ? 'text-orange-500' :
                      'text-green-600'
                    }`}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                    </span>
                  </td>
                  {/* Rating */}
                  <td className="px-6 py-4 text-gray-600">
                    ⭐ {product.ratings || '—'} ({product.numReviews})
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No products found
            </div>
          )}
        </div>
      </div>

      {/* ── Create/Edit Modal ────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center
          justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Wireless Headphones Pro"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Describe the product..."
                  required
                />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="input-field"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="input-field"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Category + Featured */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 mt-7">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={form.featured}
                    onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured product
                  </label>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Specifications</label>
                  <button
                    type="button"
                    onClick={() => setSpecRows([...specRows, { key: '', value: '' }])}
                    className="text-sm text-primary-600 font-medium"
                  >
                    + Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {specRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => {
                          const next = [...specRows];
                          next[index].key = e.target.value;
                          setSpecRows(next);
                        }}
                        className="input-field"
                        placeholder="Example: Brand"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => {
                          const next = [...specRows];
                          next[index].value = e.target.value;
                          setSpecRows(next);
                        }}
                        className="input-field"
                        placeholder="Example: Apple"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = specRows.filter((_, i) => i !== index);
                          setSpecRows(next.length ? next : [{ key: '', value: '' }]);
                        }}
                        className="btn-secondary"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Images (max 4)
                </label>

                {/* Image previews */}
                {previews.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {previews.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Preview ${i+1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <FiUpload size={16} />
                  {images.length > 0
                    ? `${images.length} file(s) selected`
                    : editing ? 'Replace images' : 'Upload images'}
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WebP — max 2MB each
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent
                        rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}