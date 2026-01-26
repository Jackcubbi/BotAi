import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { getProductFromApi, convertApiProductToCartProduct } from '../data/products';
import { Product } from '../contexts/CartContext';
import { Heart, ShoppingCart, ArrowLeft, Star, Truck, Shield, RotateCcw, Eye } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      setLoading(true);
      const apiProduct = await getProductFromApi(parseInt(id));
      if (apiProduct) {
        const cartProduct = convertApiProductToCartProduct(apiProduct);
        setProduct(cartProduct);
        setSelectedSize(cartProduct.sizes[0]);
        setSelectedColor(cartProduct.colors[0]);
      } else {
        navigate('/shop');
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-botai-grey-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-botai-black mx-auto mb-4"></div>
          <p className="font-noto-sans text-botai-text">Loading product...</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const inCart = isInCart(product.id, selectedSize, selectedColor);

  // Generate multiple images for gallery (using the same image for demo)
  const productImages = [
    product.image,
    product.image,
    product.image
  ];

  return (
    <div className="min-h-screen bg-botai-grey-bg">
      {/* Navigation */}
      <div className="bg-white border-b border-botai-grey-line">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-2 text-botai-text hover:text-botai-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-noto-sans">Back to Shop</span>
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <img
                src={productImages[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image Thumbnails */}
            <div className="flex gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`aspect-square w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImageIndex === index
                      ? 'border-botai-black'
                      : 'border-botai-grey-line hover:border-botai-black'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm font-noto-sans text-botai-text">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span>Shop</span>
              <span className="mx-2">/</span>
              <span>{product.category}</span>
              <span className="mx-2">/</span>
              <span className="text-botai-black">{product.name}</span>
            </div>

            {/* Product Title & Price */}
            <div>
              <h1 className="font-space-grotesk font-bold text-3xl text-botai-dark uppercase tracking-wide mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-space-grotesk font-bold text-3xl text-botai-black">
                  ${product.price}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-botai-grey-line'}`}
                    />
                  ))}
                  <span className="text-sm text-botai-text ml-1">(4.0)</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="font-noto-sans text-botai-text leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-3">
                Size
              </h3>
              <div className="flex gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 font-bold rounded border-2 transition-colors ${
                      selectedSize === size
                        ? 'bg-botai-black text-white border-botai-black'
                        : 'bg-white text-botai-dark border-botai-grey-line hover:border-botai-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-3">
                Color: {selectedColor}
              </h3>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-botai-black scale-110'
                        : 'border-botai-grey-line hover:border-botai-black'
                    }`}
                    style={{
                      backgroundColor: color.toLowerCase() === 'white' ? '#fff' :
                                      color.toLowerCase() === 'black' ? '#000' :
                                      color.toLowerCase() === 'red' ? '#ef4444' :
                                      color.toLowerCase() === 'blue' ? '#3b82f6' :
                                      color.toLowerCase() === 'green' ? '#10b981' :
                                      color.toLowerCase() === 'pink' ? '#ec4899' :
                                      color.toLowerCase() === 'gray' || color.toLowerCase() === 'grey' ? '#6b7280' :
                                      color.toLowerCase() === 'navy' ? '#1e40af' :
                                      color.toLowerCase() === 'brown' ? '#92400e' :
                                      color.toLowerCase() === 'tan' ? '#d2b48c' :
                                      '#8b5cf6'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-3">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-botai-grey-line rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-botai-grey-bg transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-noto-sans">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.inStock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-botai-grey-bg transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-botai-text">
                  {product.inStock} in stock
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 px-6 rounded-lg font-space-grotesk font-bold uppercase tracking-wide transition-colors ${
                  inCart
                    ? 'bg-botai-accent-green text-botai-dark'
                    : 'bg-botai-black text-white hover:bg-botai-dark'
                }`}
              >
                {inCart ? 'In Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={handleWishlist}
                className={`w-14 h-14 rounded-lg flex items-center justify-center border-2 transition-colors ${
                  isWishlisted
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-botai-grey-line text-botai-dark hover:border-red-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4 pt-8 border-t border-botai-grey-line">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-botai-accent-green" />
                <span className="font-noto-sans text-botai-text">Free shipping on orders over $100</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-botai-accent-green" />
                <span className="font-noto-sans text-botai-text">30-day return policy</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-botai-accent-green" />
                <span className="font-noto-sans text-botai-text">1-year warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

