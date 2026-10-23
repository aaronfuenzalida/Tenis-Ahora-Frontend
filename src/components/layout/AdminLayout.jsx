import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleToggleRole = () => {
    switchRole('client');
    navigate('/app/dashboard');
  };

  const handleGoToCoach = () => {
    switchRole('coach');
    navigate('/coach');
  };

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
          </div>

          <div className="flex items-center gap-3">
            {user?.isDemo && (
              <span className="text-xs text-slate-400">Modo demo</span>
            )}

            {/* Quick Demo Switchers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGoToCoach}
                title="Cambiar a vista de docente"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-900 text-xs font-bold border border-tennis-200 transition-all shadow-sm"
              >
                <span className="hidden sm:inline">Ver como</span> Docente
              </button>

              <button
                type="button"
                onClick={handleToggleRole}
                title="Cambiar a vista de socio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all shadow-sm"
              >
                <span className="hidden sm:inline">Ver como</span> Socio
              </button>
            </div>

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
