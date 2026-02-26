import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalUsers: 0,
    lowStockProducts: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const lowStockProducts = productsSnapshot.docs.filter(
          doc => doc.data().stock < 10
        ).length;

        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const pendingOrders = ordersSnapshot.docs.filter(
          doc => doc.data().status === 'Pending'
        ).length;
        const usersSnapshot = await getDocs(collection(db, 'users'));

        setStats({
          totalProducts: productsSnapshot.size,
          totalCategories: categoriesSnapshot.size,
          totalOrders: ordersSnapshot.size,
          totalUsers: usersSnapshot.size,
          lowStockProducts,
          pendingOrders
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      () => fetchStats()
    );
    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      () => fetchStats()
    );

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: <Package className="text-blue-600" size={24} />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: <FolderTree className="text-emerald-600" size={24} />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingCart className="text-violet-600" size={24} />,
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
    },
    {
      title: 'Registered Users',
      value: stats.totalUsers,
      icon: <Users className="text-orange-600" size={24} />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockProducts,
      icon: <AlertTriangle className="text-red-600" size={24} />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      urgent: true
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: <TrendingUp className="text-amber-600" size={24} />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      urgent: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your store's performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`
              bg-white p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg
              ${stat.urgent ? 'border-l-4 border-l-red-500' : 'border-slate-100'}
            `}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                {stat.icon}
              </div>
              {stat.urgent && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>

            <div>
              <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-xs font-medium text-slate-400">{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-primary-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/products')}
              className="w-full group flex items-center justify-between p-4 bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded-xl transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Package size={16} />
                </div>
                <span className="font-medium">Add New Product</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate('/admin/orders')}
              className="w-full group flex items-center justify-between p-4 bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded-xl transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                  <ShoppingCart size={16} />
                </div>
                <span className="font-medium">Process Orders</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate('/admin/analytics')}
              className="w-full group flex items-center justify-between p-4 bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded-xl transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Activity size={16} />
                </div>
                <span className="font-medium">View Analytics</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Placeholder for Recent Activity/Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <TrendingUp className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Analytics Overview</h3>
        
          <button
            onClick={() => navigate('/admin/analytics')}
            className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            Go to Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;