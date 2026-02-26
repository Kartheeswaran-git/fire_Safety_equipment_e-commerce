import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from '../firebase';
import { ShoppingCart, Search, Filter, Shield, Truck, Award, Phone, Loader2, Menu, X, User, LogOut, LogIn } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const navigate = useNavigate();

  // Auth State
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Load cart from localStorage
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, 'products'));
    const productsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProducts(productsList);
  };

  const fetchCategories = async () => {
    const snapshot = await getDocs(collection(db, 'categories'));
    const categoriesList = snapshot.docs.map(doc => doc.data().name);
    setCategories(['all', ...categoriesList]);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.length);
    alert(`${product.name} added to cart!`);
  };

  const handleBuyNow = (product) => {
    navigate('/checkout', {
      state: {
        product: {
          ...product,
          quantity: 1
        }
      }
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        const user = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: loginName,
          email: loginEmail,
          role: 'customer',
          createdAt: serverTimestamp()
        });

        alert("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      }
      setShowLoginModal(false);
      setLoginName('');
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error("Auth error:", error);
      setLoginError(error.message.replace('Firebase: ', ''));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        role: 'customer',
        lastLogin: serverTimestamp()
      }, { merge: true });

      setShowLoginModal(false);
    } catch (error) {
      console.error("Google Auth error:", error);
      setLoginError(error.message.replace('Firebase: ', ''));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCartCount(0); // Optional: clear cart view or keep it? User might want to keep cart. 
      // Actually local storage cart is independent of auth in this app so far.
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const features = [
    {
      icon: <Shield className="text-primary-600" size={32} />,
      title: 'Certified Quality',
      description: 'All products meet Tamil Nadu fire safety standards'
    },
    {
      icon: <Truck className="text-primary-600" size={32} />,
      title: 'Across Tamil Nadu',
      description: 'Delivery to all districts in Tamil Nadu'
    },
    {
      icon: <Award className="text-primary-600" size={32} />,
      title: 'Expert Support',
      description: '24/7 technical support from fire safety experts'
    },
    {
      icon: <Phone className="text-primary-600" size={32} />,
      title: 'Emergency Orders',
      description: 'Priority delivery for emergency requirements'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-primary-50 p-2 rounded-lg group-hover:bg-primary-100 transition-colors">
                <Shield size={24} className="text-primary-600" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-900 leading-none">TAMIL NADU FIRE EQUIPMENTS</h1>
              </div>
            </Link>

            {/* Desktop Navigation & Search */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div className="relative w-full group focus-within:ring-2 focus-within:ring-primary-100 rounded-xl transition-all">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent focus:bg-white border focus:border-primary-200 rounded-xl outline-none transition-all placeholder:text-slate-400 text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                Admin Login
              </Link>

              {user && (
                <Link to="/my-orders" className="text-sm font-medium text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors">
                  My Orders
                </Link>
              )}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm font-medium text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </button>
              )}
              <Link to="/cart" className="relative p-2.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all group">
                <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/cart" className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg text-slate-700">
                <ShoppingCart size={20} />
                <span className="font-medium">Cart ({cartCount})</span>
              </Link>
              {user && (
                <Link to="/my-orders" className="px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">
                  My Orders
                </Link>
              )}
              <Link to="/admin" className="px-4 py-3 text-slate-600 font-medium">
                Admin Portal
              </Link>
              {user ? (
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-600 font-medium">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-3 px-4 py-3 text-primary-600 font-medium">
                  <LogIn size={20} />
                  <span>Login / Sign Up</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599298926955-46f903517838?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-medium mb-6 backdrop-blur-sm">
            <Shield size={12} />
            <span>Certified Fire Safety Equipment</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Safety First, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-500">Tamil Nadu Secured.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Premium fire extinguishers, hydrants, and safety gear for homes, offices, and industries. Delivered across all 38 districts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#products" className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-900/20">
              Shop Equipment
            </a>
            <a href="tel:+919876543210" className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 flex items-center justify-center gap-2">
              <Phone size={18} />
              Emergency Call
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="p-3 bg-primary-50 rounded-xl shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 md:py-24 max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Equipment</h2>
            <p className="text-slate-500">Professional grade safety gear for every need</p>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === category
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {category === 'all' ? 'All Products' : category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={40} className="animate-spin text-primary-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="bg-white p-4 rounded-full inline-block mb-3 shadow-sm">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No products found</h3>
            <p className="text-slate-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-primary-100 transition-all duration-300">
                  <Link to={`/product/${product.id}`} className="block relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Shield size={48} />
                      </div>
                    )}
                    {/* Stock Badge */}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${product.stock > 10 ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
                      }`}>
                      {product.stock > 10 ? 'In Stock' : 'Low Stock'}
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">{product.category}</span>
                      <span className="text-lg font-bold text-slate-900">₹{product.price}</span>
                    </div>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</h3>
                    </Link>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{product.description}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={16} />
                        Add
                      </button>
                      <button
                        onClick={() => handleBuyNow(product)}
                        disabled={product.stock === 0}
                        className="py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary-600/20"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show first page, last page, current page, and pages around current
                    const showPage = pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

                    if (!showPage) {
                      // Show ellipsis
                      if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                        return <span key={pageNumber} className="px-2 text-slate-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === pageNumber
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 text-white mb-4">
              <Shield className="text-primary-500" />
              <span className="text-xl font-bold">TAMIL NADU FIRE EQUIPMENTS</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">Your trusted partner for fire safety equipment across Tamil Nadu. Certified products, expert support.</p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
              <li><a href="#products" className="hover:text-primary-400 transition-colors">Products</a></li>
              <li><Link to="/cart" className="hover:text-primary-400 transition-colors">My Cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>1/957, kodangi Palayam, Trichy Main Road, Karnampettai,Palladam-641662</li>
              <li>tamilnadufiresafty@gmail.com</li>
              <li>+91 8608605264</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Emergency</h3>
            <p className="text-sm mb-4">Need equipment continually? Call our emergency hotline.</p>
            <a href="tel:+919876543210" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors">
              <Phone size={16} />
              Call Now
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
          © {new Date().getFullYear()} Tamil Nadu Fire Safety Equipment Marketplace.
        </div>
      </footer>

      {/* Login Modal */}
      {
        showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all relative">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User size={24} className="text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {isSignUp ? 'Sign up to track your orders' : 'Sign in to access your account'}
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loginLoading}
                    className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span>Sign in with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center p-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <span className="relative bg-white px-4 text-xs text-slate-400 font-bold uppercase">Or continue with email</span>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>

                    {loginError && (
                      <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex items-start gap-2">
                        <div className="mt-0.5"><X size={14} /></div>
                        <span>{loginError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loginLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                      {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button
                        onClick={() => {
                          setIsSignUp(!isSignUp);
                          setLoginError('');
                        }}
                        className="text-primary-600 font-bold hover:underline"
                      >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Home;