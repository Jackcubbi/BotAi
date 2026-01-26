import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Heart,
  ShoppingCart,
  Tag,
  Gift,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const { user } = useAuth();

  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState('');
  const [showPromoSuccess, setShowPromoSuccess] = useState(false);

  // Shipping calculation
  const shippingThreshold = 100;
  const shippingCost = totalPrice >= shippingThreshold ? 0 : 15.00;
  const tax = totalPrice * 0.08; // 8% tax
  const finalTotal = totalPrice + shippingCost + tax - promoDiscount;

  // Promo codes
  const promoCodes: Record<string, { discount: number; type: 'percentage' | 'fixed' }> = {
    'SAVE10': { discount: 10, type: 'percentage' },
    'WELCOME20': { discount: 20, type: 'fixed' },
    'BOTAI15': { discount: 15, type: 'percentage' },
    'FIRST25': { discount: 25, type: 'fixed' }
  };

  const handleQuantityChange = (productId: string, newQuantity: number, size?: string, color?: string) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size, color);
    } else {
      updateQuantity(productId, newQuantity, size, color);
    }
  };

  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase();
    if (promoCodes[code] && code !== promoApplied) {
      const { discount, type } = promoCodes[code];
      const discountAmount = type === 'percentage'
        ? (totalPrice * discount) / 100
        : discount;

      setPromoDiscount(discountAmount);
      setPromoApplied(code);
      setShowPromoSuccess(true);
      setPromoCode('');

      setTimeout(() => setShowPromoSuccess(false), 3000);
    }
  };

  const handleRemovePromo = () => {
    setPromoDiscount(0);
    setPromoApplied('');
    setPromoCode('');
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  const saveForLater = (productId: string, size?: string, color?: string) => {
    // In a real app, this would save to a wishlist or saved items
    removeFromCart(productId, size, color);
    // Show success message
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-botai-grey-bg">
        {/* Header Spacer */}
        <div className="h-24"></div>

        <div className="max-w-4xl mx-auto px-5 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-botai-grey-light rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-botai-text" />
            </div>

            <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark uppercase tracking-wide mb-4">
              Your Cart is Empty
            </h1>

            <p className="font-noto-sans text-lg text-botai-text leading-relaxed mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet. Start shopping to find amazing products!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleContinueShopping}
                className="flex items-center gap-3 bg-botai-black text-white px-8 py-4 rounded-xl font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Start Shopping</span>
              </button>

              <button
                onClick={() => navigate('/account')}
                className="flex items-center gap-3 bg-white text-botai-dark px-8 py-4 rounded-xl font-space-grotesk font-bold uppercase tracking-wide border-2 border-botai-grey-line hover:border-botai-black transition-colors"
              >
                <span>View Orders</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-botai-grey-bg">
      {/* Header Spacer */}
      <div className="h-24"></div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark uppercase tracking-wide mb-2">
              Shopping Cart
            </h1>
            <p className="font-noto-sans text-botai-text">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          <button
            onClick={handleContinueShopping}
            className="flex items-center gap-2 text-botai-text hover:text-botai-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-noto-sans">Continue Shopping</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide">
                Cart Items
              </h2>

              <button
                onClick={clearCart}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-sm font-space-grotesk font-medium uppercase tracking-wide"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-botai-grey-bg rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-space-grotesk font-bold text-lg text-botai-dark uppercase tracking-wide mb-1">
                              {item.product.name}
                            </h3>

                            <p className="font-noto-sans text-sm text-botai-text mb-3 line-clamp-2">
                              {item.product.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-botai-text mb-4">
                              {item.size && <span>Size: <strong>{item.size}</strong></span>}
                              {item.color && <span>Color: <strong>{item.color}</strong></span>}
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-botai-grey-line rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, item.size, item.color)}
                                  className="w-10 h-10 flex items-center justify-center hover:bg-botai-grey-bg transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-noto-sans font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, item.size, item.color)}
                                  className="w-10 h-10 flex items-center justify-center hover:bg-botai-grey-bg transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Action Buttons */}
                              <button
                                onClick={() => saveForLater(item.product.id, item.size, item.color)}
                                className="flex items-center gap-2 text-botai-text hover:text-botai-dark transition-colors text-sm"
                              >
                                <Heart className="w-4 h-4" />
                                <span>Save for Later</span>
                              </button>

                              <button
                                onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right ml-4">
                            <div className="font-space-grotesk font-bold text-xl text-botai-dark">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-sm text-botai-text">
                              ${item.product.price} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                Order Summary
              </h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim()}
                    className="px-4 py-2 bg-botai-black text-white rounded-lg font-space-grotesk font-bold text-sm uppercase tracking-wide hover:bg-botai-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>

                {promoApplied && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-green-600 font-medium">Code "{promoApplied}" applied</span>
                    <button
                      onClick={handleRemovePromo}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {showPromoSuccess && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                    Promo code applied successfully!
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between font-noto-sans">
                  <span className="text-botai-text">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between font-noto-sans text-green-600">
                    <span>Discount ({promoApplied})</span>
                    <span>-${promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-noto-sans">
                  <span className="text-botai-text">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                {totalPrice < shippingThreshold && (
                  <div className="text-sm text-botai-text bg-botai-grey-bg p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">Free shipping on orders over ${shippingThreshold}</span>
                    </div>
                    <span>Add ${(shippingThreshold - totalPrice).toFixed(2)} more to qualify!</span>
                  </div>
                )}

                <div className="flex justify-between font-noto-sans">
                  <span className="text-botai-text">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-botai-grey-line pt-3">
                  <div className="flex justify-between font-space-grotesk font-bold text-xl">
                    <span className="text-botai-dark">Total</span>
                    <span className="text-botai-dark">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-botai-black text-white py-4 rounded-xl font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors mb-4"
              >
                <div className="flex items-center justify-center gap-3">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </button>

              {!user && (
                <p className="text-sm text-botai-text text-center mb-4">
                  You'll be redirected to login before checkout
                </p>
              )}

              {/* Features */}
              <div className="space-y-3 text-sm text-botai-text">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-botai-accent-green" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-botai-accent-green" />
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-botai-accent-green" />
                  <span>Free shipping over ${shippingThreshold}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

