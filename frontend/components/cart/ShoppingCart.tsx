import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-botai-dark" />
              <h2 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide">
                Shopping Cart ({totalItems})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-botai-text" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-16 h-16 text-botai-grey-line mb-4" />
                <h3 className="font-space-grotesk font-bold text-xl text-botai-dark mb-2">
                  Your cart is empty
                </h3>
                <p className="font-noto-sans text-botai-text mb-6">
                  Add some items to get started
                </p>
                <Link
                  to="/shop"
                  onClick={onClose}
                  className="bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="flex gap-4 pb-6 border-b border-botai-grey-light last:border-b-0">
                    <div className="w-20 h-20 bg-botai-grey-bg rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide text-sm mb-1 truncate">
                        {item.product.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.size && (
                          <span className="text-xs bg-botai-grey-light px-2 py-1 rounded font-noto-sans text-botai-text">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-xs bg-botai-grey-light px-2 py-1 rounded font-noto-sans text-botai-text">
                            Color: {item.color}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-botai-grey-line hover:bg-botai-grey-light transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-space-grotesk font-bold text-botai-dark min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-botai-grey-line hover:bg-botai-grey-light transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-space-grotesk font-bold text-botai-dark">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-botai-text font-noto-sans">
                        ${item.product.price.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t bg-white">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide">
                    Total
                  </span>
                  <span className="font-space-grotesk font-bold text-2xl text-botai-dark">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    onClick={onClose}
                    className="w-full bg-botai-black text-white py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors text-center block"
                  >
                    Checkout
                  </Link>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="w-full border border-botai-black text-botai-black py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-black hover:text-white transition-colors text-center block"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

