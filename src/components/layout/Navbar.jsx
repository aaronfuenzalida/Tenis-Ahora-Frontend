import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { 
  CircleDot, 
  Shield, 
  User, 
  LogOut, 
  Calendar, 
  Trophy, 
  BookOpen, 
  Receipt, 
  ChevronDown, 
  Bell, 
  ArrowRightLeft,
  LayoutDashboard,
  ExternalLink
} from 'lucide-react';

export default function Navbar({ isAdminLayout = false, onToggleSidebar }) {
  const { user, logout, switchRole, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleRole = () => {
    if (isAdmin) {
      switchRole('client');
      navigate('/app/dashboard');
    } else {
      switchRole('admin');
      navigate('/admin');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <Link to={isAdmin ? '/admin' : '/app/dashboard'} className="flex items-center group">
              <Logo variant="horizontal" theme="light" size="md" showSubtitle={true} />
            </Link>

            {/* Portal Indicator Badge */}
            <div className="hidden sm:flex items-center ml-4 pl-4 border-l border-slate-200">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isAdminLayout 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-tennis-50 text-tennis-800 border border-tennis-200'
              }`}>
                {isAdminLayout ? <Shield className="w-3.5 h-3.5 text-tennis-400" /> : <User className="w-3.5 h-3.5 text-tennis-600" />}
                {isAdminLayout ? 'Panel de Administración' : 'Portal del Socio'}
              </span>
            </div>
          </div>

          {/* Center (Client nav links if in client view) */}
          {!isAdminLayout && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/app/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname === '/app/dashboard'
                    ? 'text-tennis-700 bg-tennis-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Inicio
              </Link>
              <Link
                to="/app/reservas"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/app/reservas')
                    ? 'text-tennis-700 bg-tennis-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Reservar Cancha
              </Link>
              <Link
                to="/app/torneos"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/app/torneos')
                    ? 'text-tennis-700 bg-tennis-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Torneos y Fixtures
              </Link>
              <Link
                to="/app/clases"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/app/clases')
                    ? 'text-tennis-700 bg-tennis-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Clases y Profesores
              </Link>
              <Link
                to="/app/mis-pagos"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/app/mis-pagos')
                    ? 'text-tennis-700 bg-tennis-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Mis Pagos y Recibos
              </Link>
            </nav>
          )}

          {/* Right: Quick Role Switcher, Notifications & User Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Pill */}
            <button
              type="button"
              onClick={handleToggleRole}
              title="Alternar entre vista de Socio y Administrador"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-tennis-600" />
              <span className="hidden sm:inline">Ir a:</span>
              <strong className="text-slate-900">
                {isAdmin ? 'Portal Socio' : 'Panel Admin (/admin)'}
              </strong>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-tennis-600 to-tennis-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user?.name || 'Usuario'}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {user?.role === 'admin' ? 'Administrador' : 'Socio Activo'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-500 font-medium">Sesión iniciada como:</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-tennis-700 bg-tennis-100/60 px-2 py-0.5 rounded-full">
                      N° Socio: {user?.memberNumber || 'TA-8821'}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/app/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-tennis-50 hover:text-tennis-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" /> Mi Perfil de Socio
                    </Link>
                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" /> Panel Administrador (/admin)
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
