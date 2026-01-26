import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { getProductsFromApi, convertApiProductToCartProduct } from '../data/products';

export default function OrderFlowTest() {
  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const apiProducts = await getProductsFromApi();
      const cartProducts = apiProducts.map(convertApiProductToCartProduct);
      setProducts(cartProducts);
    }
    fetchProducts();
  }, []);

  const addSampleItemsToCart = () => {
    // Add some sample products to cart for testing
    const sampleProducts = products.slice(0, 3);

    sampleProducts.forEach(product => {
      addToCart(product, 1, product.sizes[0], product.colors[0]);
    });
  };

  const goToCheckout = () => {
    if (items.length > 0) {
      navigate('/checkout');
    } else {
      alert('Please add items to cart first!');
    }
  };

  return (
    <div className="bg-botai-accent-green p-6 rounded-2xl mb-8">
      <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-4">
        Test Order Flow
      </h3>
      <p className="font-noto-sans text-botai-text mb-4">
        Test the complete order process: Cart → Checkout → Order Success → Order Details
      </p>
      <div className="flex gap-4">
        <button
          onClick={addSampleItemsToCart}
          className="bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
        >
          Add Sample Items to Cart
        </button>
        <button
          onClick={goToCheckout}
          className="bg-white text-botai-dark px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-grey-light transition-colors"
        >
          Go to Checkout ({items.length} items)
        </button>
      </div>
    </div>
  );
}

