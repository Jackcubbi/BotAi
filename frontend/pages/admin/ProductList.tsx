import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Filter, Eye } from 'lucide-react';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
  created_at: string;
}

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; productId: number | null; productName: string }>({ show: false, productId: null, productName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = ['All', 'Apparel', 'Accessories', 'Footwear', 'Jewelry', 'Bags'];
  const limit = 20;

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      setTotal(data.total);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (productId: number, productName: string) => {
    setDeleteConfirm({ show: true, productId, productName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.productId) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/products/${deleteConfirm.productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Refresh product list
      fetchProducts();
      setDeleteConfirm({ show: false, productId: null, productName: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">
            Products
          </h1>
          <p className="font-noto-sans text-botai-text">
            Manage your product inventory
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="mt-4 md:mt-0 flex items-center gap-2 bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-botai-grey-line mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green appearance-none bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-botai-grey-line overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-botai-black"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-noto-sans text-botai-text">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-botai-grey-bg">
                  <tr>
                    <th className="px-6 py-4 text-left font-space-grotesk font-bold text-sm text-botai-dark uppercase">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left font-space-grotesk font-bold text-sm text-botai-dark uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left font-space-grotesk font-bold text-sm text-botai-dark uppercase">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left font-space-grotesk font-bold text-sm text-botai-dark uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-right font-space-grotesk font-bold text-sm text-botai-dark uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-botai-grey-line">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-botai-grey-bg transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/local-assets/placeholder.svg';
                            }}
                          />
                          <div>
                            <p className="font-space-grotesk font-bold text-botai-dark">
                              {product.name}
                            </p>
                            <p className="font-noto-sans text-sm text-botai-text line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-noto-sans bg-botai-grey-bg text-botai-dark">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-space-grotesk font-bold text-botai-dark">
                          ${product.price.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-noto-sans ${
                          product.stock < 10
                            ? 'bg-red-100 text-red-700'
                            : product.stock < 50
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.open(`/product/${product.id}`, '_blank')}
                            className="p-2 text-botai-text hover:text-botai-accent-green transition-colors"
                            title="View Product"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className="p-2 text-botai-text hover:text-blue-500 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product.id, product.name)}
                            className="p-2 text-botai-text hover:text-red-500 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-botai-grey-line">
                <p className="font-noto-sans text-sm text-botai-text">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} products
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans disabled:opacity-50 disabled:cursor-not-allowed hover:bg-botai-grey-bg transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans disabled:opacity-50 disabled:cursor-not-allowed hover:bg-botai-grey-bg transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, productId: null, productName: '' })}
        onConfirm={handleDeleteConfirm}
        title="DELETE PRODUCT"
        message={`Are you sure you want to delete ${deleteConfirm.productName}? This action cannot be undone.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

