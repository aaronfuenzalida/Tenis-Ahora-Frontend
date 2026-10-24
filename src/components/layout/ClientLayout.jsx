import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import ClientSidebar from './ClientSidebar';
import { Menu, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import usePortalPaths from '../../hooks/usePortalPaths';
import Logo from '../common/Logo';
import Avatar from '../common/Avatar';
import ProfileModal from '../common/ProfileModal';

export default function ClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, isDemo, switchRole } = useAuth();
  const paths = usePortalPaths();
  const navigate = useNavigate();

  const handleToggleRole = () => {
    switchRole('admin');
    navigate(paths.admin);
  };

  const handleGoToCoach = () => {
    switchRole('coach');
    navigate(paths.coach);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Lateral Sidebar (Navbar al costado) */}
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onEditProfile={() => setShowProfile(true)} />

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
              <span className="text-xs font-bold text-slate-600">Abierto</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400">08:00 a 22:00 hs</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">Demo</span>
            )}

            <Link
              to={paths.appReservas}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              Reservar Cancha
            </Link>

            {isDemo && (
              <>
                <button
                  type="button"
                  onClick={handleGoToCoach}
                  title="Cambiar a vista de profesor o entrenador"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-900 text-xs font-bold border border-tennis-200 transition-all shadow-sm"
                >
                  <span className="hidden sm:inline">Panel</span> Docente
                </button>

                <button
                  type="button"
                  onClick={handleToggleRole}
                  title="Cambiar a vista de administración"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all shadow-sm"
                >
                  <span className="hidden sm:inline">Modo</span> Admin
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowProfile(true)}
              title="Editar mi perfil"
              className="flex items-center gap-2 pl-2 border-l border-slate-200 group"
            >
              <Avatar user={user} />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight group-hover:text-tennis-700">{user?.name}</div>
                <div className="text-[10px] text-tennis-700 font-semibold">Socio N° {user?.memberNumber || '—'}</div>
              </div>
              <UserCog className="w-4 h-4 text-slate-400 group-hover:text-tennis-700 hidden md:block" />
            </button>
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

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
