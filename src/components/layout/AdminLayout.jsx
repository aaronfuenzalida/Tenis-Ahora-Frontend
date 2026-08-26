import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Menu, Search, Bell, Shield, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        
        {/* Top Header in Admin */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sistema Operativo
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Demo Switcher */}
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 text-xs font-bold border border-tennis-200 transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-tennis-600" />
              <span className="hidden sm:inline">Ver como</span> Socio
            </Link>

            {/* Admin User Info */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-tennis-400 flex items-center justify-center font-bold text-xs shadow-sm">
                AD
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900">{user?.name || 'Administración'}</div>
                <div className="text-[10px] text-slate-500">Mando Central</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
