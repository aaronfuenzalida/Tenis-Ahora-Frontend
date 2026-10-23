import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import CoachSidebar from './CoachSidebar';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

export default function CoachLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleToggleToClient = () => {
    switchRole('client');
    navigate('/app/dashboard');
  };

  const handleToggleToAdmin = () => {
    switchRole('admin');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Coach Lateral Sidebar */}
      <CoachSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
          
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
              <span className="text-xs font-semibold text-slate-700">Complejo Deportivo</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">Horario operativo: 08:00 a 22:00 hs</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">

            <Link
              to="/coach/reservas"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Reservar Cancha
            </Link>

            <button
              type="button"
              onClick={handleToggleToClient}
              title="Cambiar a vista de socio"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-sm"
            >
              <span className="hidden sm:inline">Vista</span> Socio
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-tennis-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.name ? user.name.charAt(0) : 'P'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Prof. Santiago Álvarez'}</div>
                <div className="text-[11px] text-slate-500 font-medium">Matrícula AAT-LIC-77492</div>
              </div>
            </div>
          </div>

        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold text-slate-700">Club Tenis Ahora — Portal de Profesores y Entrenadores</span>
            <span className="text-[11px] text-slate-400">Sistema Oficial de Gestión Deportiva y Registro de Asistencias</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
