import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Calendar,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    conversionRate: 0,
    topProducts: [],
    recentOrders: []
  });

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalCustomers = usersSnapshot.size;

      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Mocking some sales data for top products since we don't have a real transactions subcollection yet
      const topProducts = products.slice(0, 5).map(p => ({
        ...p,
        sales: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 50000) + 10000
      })).sort((a, b) => b.revenue - a.revenue);

      setAnalyticsData({
        totalRevenue,
        averageOrderValue,
        totalOrders,
        totalCustomers,
        conversionRate: totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(2) : 0,
        topProducts,
        recentOrders: orders.slice(0, 5)
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock Data for Charts
  const revenueData = [
    { name: 'Jan', revenue: 40000, orders: 24 },
    { name: 'Feb', revenue: 30000, orders: 18 },
    { name: 'Mar', revenue: 20000, orders: 12 },
    { name: 'Apr', revenue: 27800, orders: 20 },
    { name: 'May', revenue: 18900, orders: 15 },
    { name: 'Jun', revenue: 23900, orders: 19 },
    { name: 'Jul', revenue: 34900, orders: 25 },
  ];

  const categoryData = [
    { name: 'Extinguishers', value: 400 },
    { name: 'Alarms', value: 300 },
    { name: 'Hydrants', value: 300 },
    { name: 'Safety Gear', value: 200 },
  ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${analyticsData.totalRevenue.toLocaleString()}`,
      trend: '+12.5%',
      trendUp: true,
      icon: DollarSign,
      color: 'bg-red-50 text-red-600',
    },
    {
      title: 'Total Orders',
      value: analyticsData.totalOrders,
      trend: '+8.2%',
      trendUp: true,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Total Customers',
      value: analyticsData.totalCustomers,
      trend: '-2.4%',
      trendUp: false,
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Avg Order Value',
      value: `₹${analyticsData.averageOrderValue.toFixed(0)}`,
      trend: '+4.1%',
      trendUp: true,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1> 
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Calendar size={16} className="text-slate-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-sm border-none focus:ring-0 text-slate-700 font-medium bg-transparent cursor-pointer"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${stat.trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Revenue Overview</h3>
            <p className="text-sm text-slate-500">Monthly revenue breakdown</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Sales by Category</h3>
            <p className="text-sm text-slate-500">Product category distribution</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Top Products</h3>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {analyticsData.topProducts.map((product) => (
              <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package size={20} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">₹{product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 font-medium">{product.sales} sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {analyticsData.recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {order.customerName ? order.customerName.charAt(0) : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.customerName || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">#{order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">₹{order.total}</p>
                  <p className={`text-xs font-medium ${order.status === 'Completed' ? 'text-emerald-600' :
                      order.status === 'Pending' ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                    {order.status || 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;