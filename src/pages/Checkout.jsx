import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, getDocs, query, where, getDoc, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Shield, CheckCircle, ArrowLeft, CreditCard, Smartphone, Landmark, Banknote, QrCode, CreditCard as CardIcon } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [user, setUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    bankName: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch saved user details
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData(prev => ({
              ...prev,
              customerName: userData.name || currentUser.displayName || '',
              email: userData.email || currentUser.email || '',
              phone: userData.phone || '',
              address: userData.address || '',
              city: userData.city || '',
              pincode: userData.pincode || ''
            }));
          } else {
            // Fallback if doc doesn't exist yet
            setFormData(prev => ({
              ...prev,
              customerName: currentUser.displayName || '',
              email: currentUser.email || ''
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    instructions: ''
  });

  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Load cart items
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalAmount(total);

    // If direct buy from product page
    if (location.state?.product) {
      setCartItems([location.state.product]);
      setTotalAmount(location.state.product.price * location.state.product.quantity);
    }
  }, [location]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentDetailsChange = (e) => {
    setPaymentDetails({
      ...paymentDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Basic validation
    if (!formData.customerName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      alert('Please fill in all shipping details');
      return;
    }

    setLoading(true);

    try {
      // Save/Update User Profile with latest address
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Create order object
      const orderData = {
        userId: user ? user.uid : null,
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city} - ${formData.pincode}`,
        instructions: formData.instructions,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        total: totalAmount,
        status: 'Pending',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Completed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add payment-specific details (obfuscated for cards)
      if (paymentMethod === 'Card') {
        orderData.paymentDetails = {
          cardLast4: paymentDetails.cardNumber.slice(-4),
        };
      } else if (paymentMethod === 'UPI') {
        orderData.paymentDetails = {
          upiId: paymentDetails.upiId
        };
      } else if (paymentMethod === 'Net Banking') {
        orderData.paymentDetails = {
          bank: paymentDetails.bankName
        };
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id);

      // Clear cart
      localStorage.removeItem('cart');

      // Show success
      setOrderPlaced(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !location.state?.product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Your cart is empty</h1>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <Shield size={32} className="text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Fire Safety TN</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-slate-800 mb-4">Order Placed Successfully!</h1>
              <p className="text-slate-600 mb-6">
                Thank you for your purchase. Your fire safety equipment will be delivered soon.
              </p>

              <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Order ID</p>
                    <p className="text-lg font-bold text-slate-800 font-mono">{orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Payment Method</p>
                    <p className="text-lg font-bold text-slate-800">{paymentMethod}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  We will contact you at {formData.phone} for delivery confirmation
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  Continue Shopping
                </button>
                <a
                  href={`tel:+919876543210`}
                  className="inline-block w-full border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-semibold transition"
                >
                  Need Help? Call Support
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const PaymentOption = ({ id, label, icon: Icon, description }) => (
    <div 
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
        paymentMethod === id 
          ? 'border-primary-600 bg-primary-50 shadow-md ring-1 ring-primary-600' 
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
      onClick={() => setPaymentMethod(id)}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg ${paymentMethod === id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="font-bold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield size={32} className="text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Fire Safety TN</h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="text-slate-600 hover:text-primary-600 transition"
            >
              <ArrowLeft size={20} className="inline mr-2" />
              Back to Cart
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 font-outfit">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information Form */}
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                Shipping Information
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Complete Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Selection */}
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Payment Method
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <PaymentOption 
                  id="UPI" 
                  label="UPI / QR Code" 
                  icon={Smartphone} 
                  description="Google Pay, PhonePe, Paytm"
                />
                <PaymentOption 
                  id="Card" 
                  label="Debit / Credit Card" 
                  icon={CardIcon} 
                  description="Visa, Mastercard, RuPay"
                />
                <PaymentOption 
                  id="Net Banking" 
                  label="Net Banking" 
                  icon={Landmark} 
                  description="All major Indian banks"
                />
                <PaymentOption 
                  id="Cash on Delivery" 
                  label="Cash on Delivery" 
                  icon={Banknote} 
                  description="Pay when you receive"
                />
              </div>

              {/* Payment Method Details */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                {paymentMethod === 'UPI' && (
                  <div className="space-y-6 text-center">
                    <div className="mx-auto w-48 h-48 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-center">
                      <div className="text-slate-300 flex flex-col items-center">
                        <QrCode size={120} />
                        <span className="text-[10px] font-bold text-slate-400 mt-2">SCAN TO PAY</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 text-left">Or Enter UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        placeholder="username@bank"
                        value={paymentDetails.upiId}
                        onChange={handlePaymentDetailsChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          value={paymentDetails.cardNumber}
                          onChange={handlePaymentDetailsChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <CardIcon className="absolute right-4 top-3.5 text-slate-400" size={20} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
                        <input
                          type="text"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={paymentDetails.expiryDate}
                          onChange={handlePaymentDetailsChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">CVV</label>
                        <input
                          type="password"
                          name="cvv"
                          placeholder="***"
                          maxLength="3"
                          value={paymentDetails.cvv}
                          onChange={handlePaymentDetailsChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Net Banking' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Your Bank</label>
                    <select
                      name="bankName"
                      value={paymentDetails.bankName}
                      onChange={handlePaymentDetailsChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white"
                    >
                      <option value="">Choose a bank...</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="HDFC">HDFC Bank</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="Axis">Axis Bank</option>
                      <option value="Kotak">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'Cash on Delivery' && (
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-yellow-100 text-yellow-700 rounded-full">
                      <Banknote size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">No Advance Payment Needed</p>
                      <p className="text-sm text-slate-600">Please keep ₹{totalAmount.toFixed(2)} ready at the time of delivery.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Shield size={24} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary-50 p-8 sticky top-24">
              <h2 className="text-xl font-bold text-slate-800 mb-6 font-outfit">Total Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-800">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                {paymentMethod === 'Cash on Delivery' && (
                  <div className="flex justify-between text-slate-600 border-t pt-4">
                    <span>COD Fee</span>
                    <span className="font-medium text-slate-800">₹0.00</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-6">
                  <span className="text-lg font-bold text-slate-800">Payable Total</span>
                  <span className="text-2xl font-black text-primary-600">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
              </button>

              <div className="mt-6 flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Shield size={14} />
                  <span>Secure 256-bit SSL encrypted payment</span>
                </div>
                <div className="flex space-x-4 opacity-30 grayscale">
                  <CreditCard size={20} />
                  <Landmark size={20} />
                  <Smartphone size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;