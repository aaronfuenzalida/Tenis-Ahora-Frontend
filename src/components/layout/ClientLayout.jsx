import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import ClientSidebar from './ClientSidebar';
import { Menu, ArrowRightLeft, Shield, Calendar, User, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

export default function ClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleToggleRole = () => {
    switchRole('admin');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Lateral Sidebar (Navbar al costado) */}
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
          
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="lg:hidden flex items-center">
              <Logo variant="horizontal" theme="light" size="sm" />
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600">Abierto</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400">08:00 a 22:00 hs</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {user?.isDemo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-tennis-50 text-tennis-800 border border-tennis-200 shadow-sm">
                <Sparkles className="w-3 h-3 text-tennis-600" />
                Modo Demo
              </span>
            )}

            <Link
              to="/app/reservas"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white text-xs font-extrabold shadow-sm hover:shadow-glow-green transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              Reservar Cancha
            </Link>

            <button
              type="button"
              onClick={handleToggleRole}
              title="Cambiar a vista de administración"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-tennis-600" />
              <span className="hidden sm:inline">Modo</span> Admin
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-tennis-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.name ? user.name.charAt(0) : 'S'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</div>
                <div className="text-[10px] text-tennis-700 font-semibold">Socio N° {user?.memberNumber || 'TA-8821'}</div>
              </div>
            </div>
          </div>

        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-tennis-700 font-extrabold">TENIS AHORA</span>
              <span>— Alquiler de canchas, torneos y clases</span>
            </div>
            <div className="text-slate-400">
              © {new Date().getFullYear()} Club Tenis Ahora
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
