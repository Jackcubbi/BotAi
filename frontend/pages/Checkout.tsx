import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getProductImage } from '../data/products';
import { CreditCard, Lock, MapPin, User, Mail, Phone, ArrowLeft, Check } from 'lucide-react';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'USA'
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const shippingCost = 15;
  const tax = totalPrice * 0.08;
  const finalTotal = totalPrice + shippingCost + tax;

  const validateShipping = () => {
    const newErrors: Record<string, string> = {};

    if (!shippingInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!shippingInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!shippingInfo.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) newErrors.email = 'Email is invalid';
    if (!shippingInfo.phone.trim()) newErrors.phone = 'Phone is required';
    if (!shippingInfo.address.trim()) newErrors.address = 'Address is required';
    if (!shippingInfo.city.trim()) newErrors.city = 'City is required';
    if (!shippingInfo.state.trim()) newErrors.state = 'State is required';
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = 'Zip code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: Record<string, string> = {};

    if (!paymentInfo.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
    else if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(paymentInfo.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!paymentInfo.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
    else if (!/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
    }

    if (!paymentInfo.cvv.trim()) newErrors.cvv = 'CVV is required';
    else if (!/^\d{3,4}$/.test(paymentInfo.cvv)) newErrors.cvv = 'Invalid CVV';

    if (!paymentInfo.cardName.trim()) newErrors.cardName = 'Card name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateShipping()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validatePayment()) {
      setCurrentStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create order data
    const orderData = {
      items: items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: getProductImage(item.product.name)
      })),
      subtotal: totalPrice,
      shipping: totalPrice > 100 ? 0 : 15.00,
      tax: totalPrice * 0.08,
      total: totalPrice + (totalPrice > 100 ? 0 : 15.00) + (totalPrice * 0.08),
      shippingInfo,
      paymentInfo: {
        type: 'Credit Card',
        last4: paymentInfo.cardNumber.slice(-4)
      }
    };

    // Save order data to localStorage for OrderSuccess page to access
    localStorage.setItem('botai_pending_order', JSON.stringify(orderData));

    // Clear cart and redirect to success
    clearCart();
    navigate('/order-success');
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\s/g, '');
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-botai-grey-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="font-space-grotesk font-bold text-3xl text-botai-dark mb-4">
            Your cart is empty
          </h2>
          <p className="font-noto-sans text-botai-text mb-6">
            Add some items to your cart to proceed with checkout
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-botai-black text-white px-6 py-3 rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-botai-grey-bg">
      <div className="h-24"></div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/shop')}
            className="text-botai-dark hover:text-botai-accent-green transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark uppercase tracking-wide">
            Checkout
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step
                    ? 'bg-botai-accent-green text-botai-dark'
                    : 'bg-botai-grey-light text-botai-text'
                }`}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 ${
                    currentStep > step ? 'bg-botai-accent-green' : 'bg-botai-grey-light'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-botai-accent-green" />
                  <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark uppercase tracking-wide">
                    Shipping Information
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.firstName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.firstName ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.lastName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.lastName ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter email"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.address ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter street address"
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.city ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.state ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter state"
                    />
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.zipCode}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.zipCode ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter zip code"
                    />
                    {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Country
                    </label>
                    <select
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 border border-botai-grey-line rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent"
                    >
                      <option value="USA">United States</option>
                      <option value="CAN">Canada</option>
                      <option value="GBR">United Kingdom</option>
                      <option value="FRA">France</option>
                      <option value="DEU">Germany</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-botai-accent-green" />
                  <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark uppercase tracking-wide">
                    Payment Information
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => {
                        const formatted = formatCardNumber(e.target.value);
                        if (formatted.replace(/\s/g, '').length <= 16) {
                          setPaymentInfo(prev => ({ ...prev, cardNumber: formatted }));
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.cardNumber ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                    {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4);
                          }
                          setPaymentInfo(prev => ({ ...prev, expiryDate: value }));
                        }}
                        className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                          errors.expiryDate ? 'border-red-300' : 'border-botai-grey-line'
                        }`}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                      {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                    </div>

                    <div>
                      <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 4) {
                            setPaymentInfo(prev => ({ ...prev, cvv: value }));
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                          errors.cvv ? 'border-red-300' : 'border-botai-grey-line'
                        }`}
                        placeholder="123"
                        maxLength={4}
                      />
                      {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block font-space-grotesk font-medium text-botai-dark uppercase tracking-wide text-sm mb-2">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cardName}
                      onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardName: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg font-noto-sans focus:ring-2 focus:ring-botai-accent-green focus:border-transparent ${
                        errors.cardName ? 'border-red-300' : 'border-botai-grey-line'
                      }`}
                      placeholder="Enter name as it appears on card"
                    />
                    {errors.cardName && <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>}
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-botai-grey-bg rounded-lg">
                    <Lock className="w-5 h-5 text-botai-accent-green" />
                    <span className="font-noto-sans text-sm text-botai-text">
                      Your payment information is encrypted and secure
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark uppercase tracking-wide mb-6">
                  Order Review
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-space-grotesk font-bold text-lg text-botai-dark mb-3">Shipping Address</h3>
                    <div className="p-4 bg-botai-grey-bg rounded-lg">
                      <p className="font-noto-sans text-botai-dark">
                        {shippingInfo.firstName} {shippingInfo.lastName}<br />
                        {shippingInfo.address}<br />
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                        {shippingInfo.country}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-space-grotesk font-bold text-lg text-botai-dark mb-3">Payment Method</h3>
                    <div className="p-4 bg-botai-grey-bg rounded-lg flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-botai-dark" />
                      <span className="font-noto-sans text-botai-dark">
                        •••• •••• •••• {paymentInfo.cardNumber.slice(-4)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full bg-botai-black text-white py-4 rounded-lg font-space-grotesk font-bold text-lg uppercase tracking-wide hover:bg-botai-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing Payment...' : `Place Order - $${finalTotal.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 3 && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="px-6 py-3 border border-botai-grey-line text-botai-dark rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-grey-light transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-botai-black text-white rounded-lg font-space-grotesk font-bold uppercase tracking-wide hover:bg-botai-dark transition-colors"
                >
                  {currentStep === 1 ? 'Continue to Payment' : 'Review Order'}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="font-space-grotesk font-bold text-xl text-botai-dark uppercase tracking-wide mb-6">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                {items.map((item, index) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="flex gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 bg-botai-grey-bg rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-space-grotesk font-bold text-sm text-botai-dark uppercase truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-botai-text">
                        {item.size && `Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                      </p>
                      <p className="font-noto-sans text-sm text-botai-dark">
                        Qty: {item.quantity} × ${item.product.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-space-grotesk font-bold text-botai-dark">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-noto-sans text-botai-text">Subtotal</span>
                  <span className="font-space-grotesk font-bold text-botai-dark">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-noto-sans text-botai-text">Shipping</span>
                  <span className="font-space-grotesk font-bold text-botai-dark">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-noto-sans text-botai-text">Tax</span>
                  <span className="font-space-grotesk font-bold text-botai-dark">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-3">
                  <span className="font-space-grotesk font-bold text-botai-dark uppercase">Total</span>
                  <span className="font-space-grotesk font-bold text-botai-dark">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

