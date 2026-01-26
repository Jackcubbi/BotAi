import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../contexts/CartContext';
import { useCart } from '../../contexts/CartContext';
import { Heart, ShoppingCart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, selectedSize, selectedColor);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleViewProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const inCart = isInCart(product.id, selectedSize, selectedColor);

  return (
    <div
      className="group block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
        viewMode === 'list' ? 'flex items-center gap-6 p-4' : ''
      }`}>
        {/* Product Image */}
        <div className={`relative bg-botai-grey-bg overflow-hidden ${
          viewMode === 'list'
            ? 'w-[200px] h-[200px] rounded-lg flex-shrink-0'
            : 'aspect-square'
        }`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Overlay Actions */}
          <div className={`absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center gap-3 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={handleWishlist}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isWishlisted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-botai-dark hover:bg-red-500 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleViewProduct}
              className="w-10 h-10 bg-white text-botai-dark rounded-full flex items-center justify-center hover:bg-botai-accent-green transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleAddToCart}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                inCart
                  ? 'bg-botai-accent-green text-botai-dark'
                  : 'bg-white text-botai-dark hover:bg-botai-accent-green'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
          
          {/* Stock Status */}
          {product.inStock < 5 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              Only {product.inStock} left
            </div>
          )}
          
          {/* New Badge */}
          <div className="absolute top-3 right-3 bg-botai-accent-green text-botai-dark px-2 py-1 rounded-full text-xs font-bold uppercase">
            New
          </div>
        </div>
        
        {/* Product Info */}
        <div className={viewMode === 'list' ? 'flex-1 flex items-center justify-between' : 'p-6'}>
          {viewMode === 'list' ? (
            // List View Layout
            <>
              <div className="flex-1">
                <div className="mb-2">
                  <span className="text-xs font-space-grotesk font-medium text-botai-text uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h3 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mt-1 line-clamp-1">
                    {product.name}
                  </h3>
                </div>

                <p className="font-noto-sans text-sm text-botai-text leading-relaxed mb-3 line-clamp-2">
                  {product.description}
                </p>

                {/* Condensed Size and Color Options */}
                <div className="flex items-center gap-6 mb-3">
                  {/* Sizes */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-space-grotesk font-medium text-botai-dark uppercase tracking-wide">
                      Size:
                    </span>
                    <div className="flex gap-1">
                      {product.sizes.slice(0, 3).map((size) => (
                        <button
                          key={size}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedSize(size);
                          }}
                          className={`w-6 h-6 text-xs font-bold rounded border transition-colors ${
                            selectedSize === size
                              ? 'bg-botai-black text-white border-botai-black'
                              : 'bg-white text-botai-dark border-botai-grey-line hover:border-botai-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                      {product.sizes.length > 3 && (
                        <span className="text-xs text-botai-text self-center">+{product.sizes.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-space-grotesk font-medium text-botai-dark uppercase tracking-wide">
                      Color:
                    </span>
                    <div className="flex gap-1">
                      {product.colors.slice(0, 2).map((color) => (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedColor(color);
                          }}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
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
                      {product.colors.length > 2 && (
                        <span className="text-xs text-botai-text self-center">+{product.colors.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price and Action - Right Side */}
              <div className="flex flex-col items-end gap-3 ml-6">
                <div className="font-space-grotesk font-bold text-2xl text-botai-dark">
                  ${product.price}
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`px-4 py-2 rounded-lg font-space-grotesk font-bold text-sm uppercase tracking-wide transition-colors ${
                    inCart
                      ? 'bg-botai-accent-green text-botai-dark'
                      : 'bg-botai-black text-white hover:bg-botai-dark'
                  }`}
                >
                  {inCart ? 'In Cart' : 'Add to Cart'}
                </button>
              </div>
            </>
          ) : (
            // Grid View Layout (Original)
            <>
              <div className="mb-3">
                <span className="text-xs font-space-grotesk font-medium text-botai-text uppercase tracking-wider">
                  {product.category}
                </span>
                <h3 className="font-space-grotesk font-bold text-lg text-botai-dark uppercase tracking-wide mt-1 line-clamp-2">
                  {product.name}
                </h3>
              </div>

              <p className="font-noto-sans text-sm text-botai-text leading-relaxed mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Size and Color Options */}
              <div className="space-y-3 mb-4">
                {/* Sizes */}
                <div>
                  <span className="text-xs font-space-grotesk font-medium text-botai-dark uppercase tracking-wide">
                    Size:
                  </span>
                  <div className="flex gap-2 mt-1">
                    {product.sizes.slice(0, 4).map((size) => (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedSize(size);
                        }}
                        className={`w-8 h-8 text-xs font-bold rounded border transition-colors ${
                          selectedSize === size
                            ? 'bg-botai-black text-white border-botai-black'
                            : 'bg-white text-botai-dark border-botai-grey-line hover:border-botai-black'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                    {product.sizes.length > 4 && (
                      <span className="text-xs text-botai-text self-center">+{product.sizes.length - 4}</span>
                    )}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <span className="text-xs font-space-grotesk font-medium text-botai-dark uppercase tracking-wide">
                    Color:
                  </span>
                  <div className="flex gap-2 mt-1">
                    {product.colors.slice(0, 3).map((color) => (
                      <button
                        key={color}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedColor(color);
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
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
                    {product.colors.length > 3 && (
                      <span className="text-xs text-botai-text self-center">+{product.colors.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <div className="font-space-grotesk font-bold text-2xl text-botai-dark">
                  ${product.price}
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`px-4 py-2 rounded-lg font-space-grotesk font-bold text-sm uppercase tracking-wide transition-colors ${
                    inCart
                      ? 'bg-botai-accent-green text-botai-dark'
                      : 'bg-botai-black text-white hover:bg-botai-dark'
                  }`}
                >
                  {inCart ? 'In Cart' : 'Add to Cart'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

