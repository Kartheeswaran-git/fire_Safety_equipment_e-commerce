import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, getDocs, query, where, getDoc, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Shield, CheckCircle, ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [user, setUser] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      } else {
        // Legacy flow for guest checkout (if enabled later) or fallback
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", formData.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(usersRef, {
            name: formData.customerName,
            email: formData.email,
            phone: formData.phone,
            address: `${formData.address}, ${formData.city} - ${formData.pincode}`,
            createdAt: serverTimestamp(),
            role: 'customer'
          });
        }
      }

      // Create order object
      const orderData = {
        userId: user ? user.uid : null, // Link order to user ID
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
        paymentMethod: 'Cash on Delivery',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

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

              <div className="bg-slate-50 rounded-xl p-6 mb-8">
                <p className="text-sm text-slate-600 mb-2">Order ID</p>
                <p className="text-xl font-bold text-slate-800 font-mono">{orderId}</p>
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
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Customer Information</h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Complete Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Call before delivery, Leave at security, etc."
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Shield size={24} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Payment Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium">₹0 (COD)</span>
                </div>
                <div className="flex justify-between border-t pt-4">
                  <span className="text-lg font-bold text-slate-800">Total Amount</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 text-green-600 mb-2">
                  <Shield size={20} />
                  <span className="font-medium">Cash on Delivery</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Pay when your fire safety equipment is delivered
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Please keep cash ready at the time of delivery.
                    Our delivery executive will provide installation guidance if needed.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold text-lg transition disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Order (COD)'}
              </button>

              <p className="text-sm text-slate-500 text-center mt-4">
                By placing order, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;