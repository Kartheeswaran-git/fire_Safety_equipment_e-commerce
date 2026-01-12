import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Admin Pages
import './index.css';
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

// User Pages
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from './pages/MyOrders';

// Components
import AdminLayout from "./components/AdminLayout";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/my-orders" element={<MyOrders />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute user={user}>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/products"
        element={
          <PrivateRoute user={user}>
            <AdminLayout>
              <Products />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/categories"
        element={
          <PrivateRoute user={user}>
            <AdminLayout>
              <Categories />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/orders"
        element={
          <PrivateRoute user={user}>
            <AdminLayout>
              <Orders />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/customers"
        element={
          <PrivateRoute user={user}>
            <AdminLayout>
              <Customers />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <PrivateRoute user={user}>
            <AdminLayout>
              <Analytics />
            </AdminLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <PrivateRoute user={user}>
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

const PrivateRoute = ({ children, user }) => {
  return user ? children : <Navigate to="/login" />;
};

export default App;