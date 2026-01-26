import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
}

interface Variation {
  id: string;
  type: 'size' | 'color' | 'material';
  value: string;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: 'Apparel',
    stock: 0,
    image_url: '',
  });

  const [variations, setVariations] = useState<Variation[]>([]);
  const [newVariation, setNewVariation] = useState<{
    type: 'size' | 'color' | 'material';
    value: string;
  }>({ type: 'size', value: '' });

  const categories = ['Apparel', 'Accessories', 'Footwear', 'Jewelry', 'Bags', 'Other'];

  useEffect(() => {
    if (isEdit && id) {
      fetchProduct(parseInt(id));
    }
  }, [id, isEdit]);

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setFormData({
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        stock: data.stock,
        image_url: data.image_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    if (formData.stock < 0) {
      setError('Stock cannot be negative');
      return;
    }
    if (!formData.image_url.trim()) {
      setError('Image URL is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('auth_token');

      const url = isEdit
        ? `/api/admin/products/${id}`
        : '/api/admin/products';

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save product');
      }

      // Success - redirect to product list
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const addVariation = () => {
    if (newVariation.value.trim()) {
      setVariations(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: newVariation.type,
          value: newVariation.value.trim()
        }
      ]);
      setNewVariation({ type: 'size', value: '' });
    }
  };

  const removeVariation = (id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id));
  };

  const sampleImages = [
    'https://api.builder.io/api/v1/image/assets/TEMP/4cf61aee-1dfa-4bc4-9237-a1c976b04c17?width=800',
    'https://api.builder.io/api/v1/image/assets/TEMP/70f3a01b15a364552b6c677266c5eacdbadd60e1?width=800',
    'https://api.builder.io/api/v1/image/assets/TEMP/92c8eb31f87ab3bbc98cba7d2c7c85b79e2f8a5d?width=800',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-botai-black"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-botai-grey-bg rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="font-noto-sans text-botai-text">
            {isEdit ? 'Update product information' : 'Create a new product listing'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl p-6 border border-botai-grey-line">
            <h2 className="font-space-grotesk font-bold text-xl text-botai-dark mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green resize-none"
                  placeholder="Describe your product"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green appearance-none bg-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Product Variations */}
          <div className="bg-white rounded-xl p-6 border border-botai-grey-line">
            <h2 className="font-space-grotesk font-bold text-xl text-botai-dark mb-4">
              Product Variations
            </h2>
            <p className="font-noto-sans text-sm text-botai-text mb-4">
              Add size, color, or material options for this product
            </p>

            <div className="space-y-4">
              {/* Add Variation */}
              <div className="flex gap-2">
                <select
                  value={newVariation.type}
                  onChange={(e) => setNewVariation(prev => ({
                    ...prev,
                    type: e.target.value as 'size' | 'color' | 'material'
                  }))}
                  className="px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
                >
                  <option value="size">Size</option>
                  <option value="color">Color</option>
                  <option value="material">Material</option>
                </select>

                <input
                  type="text"
                  value={newVariation.value}
                  onChange={(e) => setNewVariation(prev => ({
                    ...prev,
                    value: e.target.value
                  }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariation())}
                  className="flex-1 px-4 py-2 border border-botai-grey-line rounded-lg font-noto-sans focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
                  placeholder="Enter value (e.g., XL, Red, Cotton)"
                />

                <button
                  type="button"
                  onClick={addVariation}
                  className="px-4 py-2 bg-botai-accent-green text-botai-dark rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Variations List */}
              {variations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {variations.map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center gap-2 px-3 py-2 bg-botai-grey-bg rounded-lg"
                    >
                      <span className="text-xs font-semibold text-botai-text uppercase">
                        {variation.type}:
                      </span>
                      <span className="font-noto-sans text-botai-dark">
                        {variation.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVariation(variation.id)}
                        className="text-botai-text hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {variations.length === 0 && (
                <p className="text-sm text-botai-text italic">
                  No variations added yet. Add sizes, colors, or materials above.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image */}
          <div className="bg-white rounded-xl p-6 border border-botai-grey-line">
            <h2 className="font-space-grotesk font-bold text-xl text-botai-dark mb-4">
              Product Image
            </h2>

            {formData.image_url && (
              <div className="mb-4">
                <img
                  src={formData.image_url}
                  alt="Product preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/local-assets/placeholder.svg';
                  }}
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="block font-noto-sans font-semibold text-botai-dark mb-2">
                Image URL *
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans text-sm focus:outline-none focus:ring-2 focus:ring-botai-accent-green"
                placeholder="https://example.com/image.jpg"
              />

              <div className="pt-2">
                <p className="text-sm font-noto-sans text-botai-text mb-2">
                  Or use a sample image:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {sampleImages.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: url }))}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-botai-grey-line hover:border-botai-accent-green transition-colors"
                    >
                      <img
                        src={url}
                        alt={`Sample ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl p-6 border border-botai-grey-line">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEdit ? 'Update Product' : 'Create Product'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="w-full mt-3 px-6 py-3 border border-botai-grey-line rounded-lg font-noto-sans hover:bg-botai-grey-bg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

