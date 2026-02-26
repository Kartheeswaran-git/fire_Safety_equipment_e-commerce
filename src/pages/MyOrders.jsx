import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Package, Calendar, MapPin, ChevronRight, ShoppingBag, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/'); // Redirect if not logged in
            } else {
                setUser(currentUser);
                fetchOrders(currentUser.email);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchOrders = async (userEmail) => {
        try {
            let q;
            const ordersRef = collection(db, 'orders');

            if (user?.uid) {
                // Prefer querying by User ID if available
                q = query(ordersRef, where('userId', '==', user.uid));
            } else {
                // Fallback to email
                q = query(ordersRef, where('email', '==', userEmail));
            }

            const querySnapshot = await getDocs(q);
            const ordersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sorting to avoid composite index requirement
            ordersList.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA; // Descending order
            });

            setOrders(ordersList);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header (Simplified) */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <Shield size={24} className="text-primary-600" />
                        <span className="font-bold text-slate-900 text-lg">Fire Safety TN</span>
                    </Link>
                    <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                        Back to Shop
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingBag className="text-primary-600" size={32} />
                    <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h3>
                        <p className="text-slate-500 mb-8">You haven't placed any orders yet. Start shopping to secure your premises.</p>
                        <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Order Header */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <span className="block text-slate-500 text-xs uppercase tracking-wide">Order Placed</span>
                                            <span className="font-medium text-slate-900 flex items-center gap-1">
                                                <Calendar size={14} className="text-slate-400" />
                                                {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
                                        <div>
                                            <span className="block text-slate-500 text-xs uppercase tracking-wide">Order ID</span>
                                            <span className="font-mono font-medium text-slate-900">#{order.id.slice(0, 8)}</span>
                                        </div>
                                        <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
                                        <div>
                                            <span className="block text-slate-500 text-xs uppercase tracking-wide">Total Amount</span>
                                            <span className="font-bold text-primary-600">₹{order.total}</span>
                                        </div>
                                    </div>

                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {order.status || 'Pending'}
                                    </div>
                                </div>

                                {/* Tracking / Address Info */}
                                <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                                    <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        <span className="font-medium text-slate-900">Delivery to:</span> {order.address}
                                    </p>
                                </div>

                                {/* Items */}
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4">
                                                <div className="h-16 w-16 bg-slate-100 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package size={24} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                                                    <p className="text-sm text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyOrders;
