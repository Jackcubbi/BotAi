import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';

export default function OrderSuccess() {
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    // Get order data from checkout process
    const pendingOrderData = localStorage.getItem('botai_pending_order');

    if (pendingOrderData) {
      const orderData = JSON.parse(pendingOrderData);

      // Create complete order
      const order = {
        id: orderNumber,
        date: new Date().toISOString(),
        status: 'confirmed',
        total: orderData.total || 0,
        subtotal: orderData.subtotal || 0,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        items: orderData.items || [],
        shippingAddress: {
          name: `${orderData.shippingInfo?.firstName || ''} ${orderData.shippingInfo?.lastName || ''}`,
          street: orderData.shippingInfo?.address || '',
          city: orderData.shippingInfo?.city || '',
          state: orderData.shippingInfo?.state || '',
          zipCode: orderData.shippingInfo?.zipCode || '',
          country: orderData.shippingInfo?.country || 'USA'
        },
        billingAddress: {
          name: `${orderData.shippingInfo?.firstName || ''} ${orderData.shippingInfo?.lastName || ''}`,
          street: orderData.shippingInfo?.address || '',
          city: orderData.shippingInfo?.city || '',
          state: orderData.shippingInfo?.state || '',
          zipCode: orderData.shippingInfo?.zipCode || '',
          country: orderData.shippingInfo?.country || 'USA'
        },
        paymentMethod: orderData.paymentInfo || { type: 'Credit Card', last4: '****' }
      };

      // Add to order history
      const existingOrders = JSON.parse(localStorage.getItem('botai_orders') || '[]');
      localStorage.setItem('botai_orders', JSON.stringify([order, ...existingOrders]));

      // Set order data for display
      setOrderTotal(orderData.total);
      setOrderItems(orderData.items);

      // Clean up pending order data
      localStorage.removeItem('botai_pending_order');
    }
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-botai-grey-bg flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-botai-accent-green rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-botai-dark" />
          </div>

          {/* Success Message */}
          <h1 className="font-space-grotesk font-bold text-4xl lg:text-5xl text-botai-dark uppercase tracking-wide mb-4">
            Order Confirmed!
          </h1>
          <p className="font-noto-sans text-lg text-botai-text leading-relaxed mb-8">
            Thank you for your purchase! Your order has been successfully placed and is being processed.
          </p>

          {/* Order Details */}
          <div className="bg-botai-grey-bg rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-left">
                <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-2">
                  Order Number
                </h3>
                <p className="font-noto-sans text-lg text-botai-dark font-medium">
                  {orderNumber}
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-2">
                  Order Total
                </h3>
                <p className="font-noto-sans text-lg text-botai-dark font-medium">
                  ${orderTotal.toFixed(2)}
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-2">
                  Estimated Delivery
                </h3>
                <p className="font-noto-sans text-lg text-botai-dark font-medium">
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Order Items */}
            {orderItems.length > 0 && (
              <div className="border-t border-botai-grey-line pt-6">
                <h3 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-4">
                  Items Ordered
                </h3>
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-space-grotesk font-bold text-botai-dark">{item.name}</p>
                        <p className="font-noto-sans text-sm text-botai-text">
                          Qty: {item.quantity} {item.size && `• Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                        </p>
                      </div>
                      <p className="font-space-grotesk font-bold text-botai-dark">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* What's Next */}
          <div className="space-y-4 mb-8">
            <h3 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide">
              What's Next?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-left">
                <Mail className="w-5 h-5 text-botai-accent-green flex-shrink-0" />
                <span className="font-noto-sans text-botai-text">
                  You'll receive an order confirmation email shortly
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Package className="w-5 h-5 text-botai-accent-green flex-shrink-0" />
                <span className="font-noto-sans text-botai-text">
                  We'll send tracking information once your order ships
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-botai-accent-green flex-shrink-0" />
                <span className="font-noto-sans text-botai-text">
                  Track your order status in your account dashboard
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/account"
              className="bg-botai-black text-white px-8 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors inline-flex items-center justify-center gap-2"
            >
              View Order Details
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/shop"
              className="border border-botai-black text-botai-black px-8 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-black hover:text-white transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="font-noto-sans text-botai-text">
            Need help? Contact our{' '}
            <Link to="/contact" className="text-botai-accent-green hover:text-botai-dark font-medium">
              customer support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

