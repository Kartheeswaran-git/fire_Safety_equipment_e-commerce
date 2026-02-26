import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, Truck, Shield, ArrowLeft } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  }, [id]);

  const addToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.length);

    alert(`${quantity} ${product.name}(s) added to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h1>
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
                Back to Shop
              </Link>
              <Link to="/cart" className="relative">
                <ShoppingCart size={24} className="text-slate-600 hover:text-primary-600 transition" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center justify-center h-96 bg-slate-100 rounded-lg">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <Shield size={128} className="text-slate-400" />
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <span className="px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {product.category}
              </span>
              <h1 className="text-4xl font-bold text-slate-800 mt-4">{product.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-3xl font-bold text-primary-600">₹{product.price}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.stock > 10
                  ? 'bg-green-100 text-green-800'
                  : 'bg-primary-100 text-primary-800'
                  }`}>
                  {product.stock > 10 ? 'In Stock' : `${product.stock} Left`}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Description</h2>
              <p className="text-slate-600 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Truck size={24} className="text-primary-600" />
                <div>
                  <h3 className="font-bold text-slate-800">Delivery Information</h3>
                  <p className="text-sm text-slate-600">Across Tamil Nadu | Cash on Delivery</p>
                </div>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li>• Free delivery within Chennai city limits</li>
                <li>• 2-3 days delivery across Tamil Nadu</li>
                <li>• Installation support available</li>
                <li>• Certification included with products</li>
              </ul>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    +
                  </button>
                  <span className="text-slate-600">
                    {product.stock} units available
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={addToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 transition disabled:opacity-50"
                >
                  <ShoppingCart size={24} />
                  <span>Add to Cart</span>
                </button>
                <Link
                  to="/checkout"
                  state={{ product: { ...product, quantity } }}
                  className="flex-1 bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg font-semibold text-lg text-center transition"
                >
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Features */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Safety Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-4">
              <Shield size={24} className="text-primary-600 mt-1" />
              <div>
                <h3 className="font-bold text-slate-800">Tamil Nadu Certified</h3>
                <p className="text-slate-600">Meets all TN fire safety regulations</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Shield size={24} className="text-primary-600 mt-1" />
              <div>
                <h3 className="font-bold text-slate-800">Annual Maintenance</h3>
                <p className="text-slate-600">Free first year maintenance included</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Shield size={24} className="text-primary-600 mt-1" />
              <div>
                <h3 className="font-bold text-slate-800">Expert Support</h3>
                <p className="text-slate-600">24/7 technical support available</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;