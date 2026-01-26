import React from 'react';
import { X, Download, Calendar, Package, MapPin, CreditCard } from 'lucide-react';
import { getProductImage } from '../../data/products';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface Order {
  id: string;
  date: string;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4: string;
  };
}

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetails({ order, onClose }: OrderDetailsProps) {
  // Ensure all numeric values have defaults to prevent errors
  const safeOrder = {
    ...order,
    total: order.total || 0,
    subtotal: order.subtotal || 0,
    shipping: order.shipping || 0,
    tax: order.tax || 0,
    items: (order.items || []).map(item => ({
      ...item,
      price: item.price || 0,
      quantity: item.quantity || 1
    }))
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrintInvoice = () => {
    // Get the modal content
    const modalContent = document.querySelector('.order-details-print');
    if (!modalContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Write the HTML content with proper styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - Order ${safeOrder.id}</title>
          <style>
            @page { margin: 0.5in; size: A4; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 20px;
            }
            .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .order-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; }
            .order-total { padding: 15px; border: 1px solid #ccc; text-align: center; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            .items-table th { font-weight: bold; }
            .summary-section { display: flex; justify-content: space-between; margin-top: 20px; }
            .address-section, .price-section {
              width: 48%;
              border: 1px solid #ccc;
              padding: 15px;
            }
            .price-breakdown { margin-top: 10px; }
            .price-line { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-line { border-top: 2px solid #000; font-weight: bold; padding-top: 5px; }
            h1, h2, h3 { margin: 0 0 10px 0; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="uppercase">Order Invoice</h1>
            <p>Order #${safeOrder.id}</p>
          </div>

          <div class="order-header">
            <div>
              <h3>Order #${safeOrder.id}</h3>
              <p>Placed on ${new Date(safeOrder.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p>Status: <span class="uppercase">${safeOrder.status}</span></p>
            </div>
            <div class="order-total">
              <h4>Order Total</h4>
              <h2>$${safeOrder.total.toFixed(2)}</h2>
            </div>
          </div>

          <h3>Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${safeOrder.items.map(item => `
                <tr>
                  <td>
                    <strong>${item.name}</strong><br>
                    ${item.size ? `Size: ${item.size}` : ''}
                    ${item.color ? `Color: ${item.color}` : ''}
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">$${item.price.toFixed(2)}</td>
                  <td class="text-center">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="address-section">
              <h4>Shipping Address</h4>
              <p><strong>${safeOrder.shippingAddress?.name || 'N/A'}</strong></p>
              <p>${safeOrder.shippingAddress?.street || ''}</p>
              <p>${safeOrder.shippingAddress?.city || ''}, ${safeOrder.shippingAddress?.state || ''} ${safeOrder.shippingAddress?.zipCode || ''}</p>
              <p>${safeOrder.shippingAddress?.country || ''}</p>

              <h4 style="margin-top: 20px;">Payment Method</h4>
              <p><strong>${safeOrder.paymentMethod?.type || 'N/A'}</strong></p>
              <p>**** **** **** ${safeOrder.paymentMethod?.last4 || 'N/A'}</p>
            </div>

            <div class="price-section">
              <h4>Price Breakdown</h4>
              <div class="price-breakdown">
                <div class="price-line">
                  <span>Subtotal</span>
                  <span>$${safeOrder.subtotal.toFixed(2)}</span>
                </div>
                <div class="price-line">
                  <span>Shipping</span>
                  <span>$${safeOrder.shipping.toFixed(2)}</span>
                </div>
                <div class="price-line">
                  <span>Tax</span>
                  <span>$${safeOrder.tax.toFixed(2)}</span>
                </div>
                <div class="price-line total-line">
                  <span class="font-bold uppercase">Total</span>
                  <span class="font-bold">$${safeOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Print the window
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm print:hidden"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="order-details-print relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-botai-grey-light px-8 py-6 rounded-t-2xl flex items-center justify-between print:static print:px-0 print:py-4 print:rounded-none print:border-b-2 print:border-black">
          <div>
            <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark uppercase tracking-wide">
              Order Details
            </h2>
            <p className="font-noto-sans text-botai-text">Order #{safeOrder.id}</p>
          </div>
          <div className="flex items-center gap-4 print:hidden">
            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-botai-black text-white rounded-lg font-space-grotesk font-medium text-sm uppercase tracking-wide hover:bg-botai-dark transition-colors"
            >
              <Download className="w-4 h-4" />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-2 text-botai-text hover:text-botai-dark transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 print:p-0 print:pt-4">
          {/* Order Header */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-botai-accent-green rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-botai-dark" />
                </div>
                <div>
                  <h3 className="font-space-grotesk font-bold text-botai-dark">
                    Order #{safeOrder.id}
                  </h3>
                  <p className="font-noto-sans text-sm text-botai-text">
                    Placed on {new Date(safeOrder.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(safeOrder.status)}`}>
                {safeOrder.status}
              </span>
            </div>

            <div className="text-right">
              <div className="bg-botai-grey-bg rounded-lg p-4">
                <h4 className="font-space-grotesk font-bold text-botai-dark uppercase text-sm mb-2">
                  Order Total
                </h4>
                <p className="font-space-grotesk font-bold text-3xl text-botai-dark">
                  ${safeOrder.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8 print:mb-4">
            <h3 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6 print:text-lg print:mb-3">
              Order Items
            </h3>
            <div className="border border-botai-grey-line rounded-lg overflow-hidden print:rounded-none print:border-2 print:border-black">
              <div className="bg-botai-grey-bg px-6 py-4 border-b border-botai-grey-line print:bg-gray-100 print:px-3 print:py-2 print:border-b-2 print:border-black">
                <div className="grid grid-cols-12 gap-4 font-space-grotesk font-bold text-sm text-botai-dark uppercase tracking-wide print:text-xs">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
              </div>
              {safeOrder.items.map((item) => (
                <div key={item.id} className="px-6 py-4 border-b border-botai-grey-line last:border-b-0 print:px-3 print:py-2 print:border-b print:border-gray-300">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 flex items-center gap-4 print:gap-2">
                      <img
                        src={getProductImage(item.name)}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg print:w-8 print:h-8 print:rounded print:hidden"
                      />
                      <div>
                        <h4 className="font-space-grotesk font-bold text-botai-dark print:text-sm">
                          {item.name}
                        </h4>
                        <div className="flex gap-4 text-sm text-botai-text print:text-xs print:gap-2">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-noto-sans print:text-sm">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-center font-space-grotesk font-bold print:text-sm">
                      ${item.price.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-space-grotesk font-bold print:text-sm">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="grid md:grid-cols-2 gap-8 print:gap-4 print:grid-cols-1">
            {/* Addresses */}
            <div className="space-y-6 print:space-y-3">
              <div>
                <h4 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-4 flex items-center gap-2 print:text-sm print:mb-2">
                  <MapPin className="w-5 h-5 print:w-4 print:h-4" />
                  Shipping Address
                </h4>
                <div className="bg-botai-grey-bg rounded-lg p-4 font-noto-sans text-botai-text print:bg-transparent print:border print:border-gray-300 print:rounded-none print:p-2 print:text-sm">
                  <p className="font-bold text-botai-dark">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              <div>
                <h4 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-4 flex items-center gap-2 print:text-sm print:mb-2">
                  <CreditCard className="w-5 h-5 print:w-4 print:h-4" />
                  Payment Method
                </h4>
                <div className="bg-botai-grey-bg rounded-lg p-4 font-noto-sans text-botai-text print:bg-transparent print:border print:border-gray-300 print:rounded-none print:p-2 print:text-sm">
                  <p className="font-bold text-botai-dark">{order.paymentMethod.type}</p>
                  <p>**** **** **** {order.paymentMethod.last4}</p>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="print:mt-0">
              <h4 className="font-space-grotesk font-bold text-botai-dark uppercase tracking-wide mb-4 print:text-sm print:mb-2">
                Price Breakdown
              </h4>
              <div className="bg-botai-grey-bg rounded-lg p-4 space-y-3 print:bg-transparent print:border print:border-gray-300 print:rounded-none print:p-2 print:space-y-1 print:text-sm">
                <div className="flex justify-between font-noto-sans">
                  <span className="text-botai-text">Subtotal</span>
                  <span className="font-bold text-botai-dark">${safeOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-noto-sans">
                  <span className="text-botai-text">Shipping</span>
                  <span className="font-bold text-botai-dark">${safeOrder.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-noto-sans">
                  <span className="text-botai-text">Tax</span>
                  <span className="font-bold text-botai-dark">${safeOrder.tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-botai-grey-line pt-3">
                  <div className="flex justify-between">
                    <span className="font-space-grotesk font-bold text-botai-dark uppercase">Total</span>
                    <span className="font-space-grotesk font-bold text-xl text-botai-dark">${safeOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

