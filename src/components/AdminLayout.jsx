import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell, Search, User } from 'lucide-react';
import { auth } from '../firebase';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = auth.currentUser;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 z-10">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                <Menu size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                    {user?.displayName || 'Admin User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-[150px]">
                    {user?.email}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold border border-primary-200">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="h-9 w-9 rounded-full" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;