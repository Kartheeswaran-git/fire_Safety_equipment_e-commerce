import React, { useState, useEffect } from "react";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  User,
  Store,
  Lock,
  Save,
  Loader2,
  ShieldCheck,
  CreditCard
} from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [storeData, setStoreData] = useState({
    storeName: "Fire Safety Tamil Nadu",
    phone: "",
    address: "",
    gstNumber: "",
    codEnabled: true
  });

  useEffect(() => {
    if (auth.currentUser) {
      setProfileData({
        displayName: auth.currentUser.displayName || "",
        email: auth.currentUser.email || "",
        newPassword: "",
        confirmPassword: ""
      });
    }
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "store"));
      if (snap.exists()) setStoreData(snap.data());
    } catch (error) {
      console.error("Error fetching store settings:", error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (profileData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profileData.displayName });
      }

      if (profileData.email !== user.email) {
        await updateEmail(user, profileData.email);
      }

      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          showMessage('error', "Passwords do not match");
          return;
        }
        await updatePassword(user, profileData.newPassword);
      }

      showMessage('success', "Profile updated successfully!");
    } catch (e) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveStore = async () => {
    try {
      setLoading(true);
      await setDoc(doc(db, "settings", "store"), storeData, { merge: true });
      showMessage('success', "Store settings saved!");
    } catch (e) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'store', label: 'Store Settings', icon: Store },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation for Settings */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <nav className="flex flex-col p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                {message.text}
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
                  <p className="text-sm text-slate-500 mt-1">Update your personal details</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Store Settings */}
            {activeTab === "store" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Store Configuration</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage store details and preferences</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Store Name</label>
                    <input
                      type="text"
                      value={storeData.storeName}
                      onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Phone</label>
                      <input
                        type="tel"
                        value={storeData.phone}
                        onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">GST Number</label>
                      <input
                        type="text"
                        value={storeData.gstNumber}
                        onChange={(e) => setStoreData({ ...storeData, gstNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Store Address</label>
                    <textarea
                      rows={3}
                      value={storeData.address}
                      onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={saveStore}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Store Settings
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Security</h2>
                  <p className="text-sm text-slate-500 mt-1">Update your password and security preferences</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Update Password
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
