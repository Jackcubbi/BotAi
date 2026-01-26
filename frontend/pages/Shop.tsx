import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, ShoppingCart, User, LogIn } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import OrderFlowTest from '../components/OrderFlowTest';
import { useAuth } from '../contexts/AuthContext';
import { useCart, Product } from '../contexts/CartContext';
import { getProductsFromApi, convertApiProductToCartProduct } from '../data/products';

export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const apiProducts = await getProductsFromApi();
      const cartProducts = apiProducts.map(convertApiProductToCartProduct);
      setProducts(cartProducts);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Navigation handlers
  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleLoginClick = () => {
    if (user) {
      navigate('/account');
    } else {
      navigate('/login');
    }
  };

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Sort products
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Show loading state while fetching products
  if (loading) {
    return (
      <div className="min-h-screen bg-botai-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-botai-black mx-auto mb-4"></div>
          <p className="font-noto-sans text-botai-text">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-botai-white">
      {/* Header Spacer */}
      <div className="h-24"></div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="font-space-grotesk font-bold text-5xl lg:text-6xl text-botai-dark uppercase tracking-wide mb-4">
            Bot Marketplace
          </h1>
          <p className="font-noto-sans text-lg text-botai-text leading-relaxed max-w-2xl mx-auto">
            Discover our curated collection of premium AI bots, from intelligent assistants to specialized tools.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handleCartClick}
            className="flex items-center gap-3 bg-botai-black text-white px-6 py-3 rounded-xl font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Shopping Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-botai-accent-green text-botai-dark text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={handleLoginClick}
            className="flex items-center gap-3 bg-white text-botai-dark px-6 py-3 rounded-xl font-space-grotesk font-bold uppercase tracking-wide border-2 border-botai-grey-line hover:border-botai-black transition-colors"
          >
            {user ? (
              <>
                <User className="w-5 h-5" />
                <span>My Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </div>

        {/* Order Flow Test Component */}
        <OrderFlowTest />

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-botai-text" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-space-grotesk font-medium text-sm uppercase tracking-wide transition-colors ${
                    selectedCategory === category
                      ? 'bg-botai-black text-white'
                      : 'bg-botai-grey-light text-botai-dark hover:bg-botai-grey-line'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Sort and View Options */}
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              <div className="flex border border-botai-grey-line rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-botai-black text-white'
                      : 'bg-white text-botai-dark hover:bg-botai-grey-light'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-botai-black text-white'
                      : 'bg-white text-botai-dark hover:bg-botai-grey-light'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="font-noto-sans text-botai-text">
            Showing {filteredProducts.length} of {products.length} products
            {searchQuery && (
              <span> for "<strong>{searchQuery}</strong>"</span>
            )}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-botai-grey-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-botai-text" />
            </div>
            <h3 className="font-space-grotesk font-bold text-2xl text-botai-dark mb-2">
              No products found
            </h3>
            <p className="font-noto-sans text-botai-text mb-6">
              {searchQuery
                ? `No products match "${searchQuery}". Try adjusting your search.`
                : `No products found in the ${selectedCategory} category.`
              }
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
            >
              View All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

