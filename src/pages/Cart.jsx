import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft, Shield } from 'lucide-react';

const Cart = () => {
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  });

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    const cart = [...cartItems];
    const itemIndex = cart.findIndex(item => item.id === id);

    if (itemIndex > -1) {
      cart[itemIndex].quantity = newQuantity;
      localStorage.setItem('cart', JSON.stringify(cart));
      setCartItems(cart);
    }
  };

  const removeItem = (id) => {
    const cart = cartItems.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartItems(cart);
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      localStorage.removeItem('cart');
      setCartItems([]);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <Shield size={32} className="text-primary-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Fire Safety TN</h1>
                </div>
              </Link>
              <Link to="/" className="text-slate-600 hover:text-primary-600 transition">
                <ArrowLeft size={20} className="inline mr-2" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingCart size={64} className="mx-auto text-slate-400 mb-6" />
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Your Cart is Empty</h1>
            <p className="text-slate-600 mb-8">Add some fire safety equipment to get started!</p>
            <Link
              to="/"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition"
            >
              Browse Products
            </Link>
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
            <Link to="/" className="flex items-center space-x-3">
              <Shield size={32} className="text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Fire Safety TN</h1>
              </div>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-slate-600 hover:text-primary-600 transition">
                <ArrowLeft size={20} className="inline mr-2" />
                Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-primary-600 hover:text-primary-700 font-medium transition"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.id} className="p-6 border-b last:border-b-0">
                  <div className="flex items-start space-x-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Shield size={32} className="text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                          <p className="text-primary-600 font-bold text-lg mt-1">₹{item.price}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-slate-400 hover:text-primary-600 transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                            -
                          </button>
                          <span className="text-lg font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
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
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium">₹0 (COD)</span>
                </div>
                <div className="flex justify-between border-t pt-4">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 text-green-600 mb-2">
                  <Shield size={20} />
                  <span className="font-medium">Cash on Delivery Available</span>
                </div>
                <p className="text-sm text-slate-600">
                  Pay when your fire safety equipment is delivered
                </p>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-3 rounded-lg font-semibold text-lg transition"
              >
                Proceed to Checkout
              </Link>

              <p className="text-sm text-slate-500 text-center mt-4">
                By proceeding, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;