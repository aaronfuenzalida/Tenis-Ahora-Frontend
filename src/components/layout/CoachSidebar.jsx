import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { Home, Calendar, Award, UserCheck } from 'lucide-react';

export default function CoachSidebar({ isOpen, onClose }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      name: 'Inicio / Mi Agenda',
      to: '/coach/dashboard',
      icon: Home,
      exact: true
    },
    {
      name: user?.rolBackend === 'Entrenador' ? 'Mis Entrenamientos y Asistencia' : 'Mis Clases y Asistencia',
      to: '/coach/clases',
      icon: UserCheck
    },
    {
      name: 'Turnos Particulares',
      to: '/coach/particulares',
      icon: Calendar
    },
    {
      name: 'Horarios y Certificación',
      to: '/coach/perfil',
      icon: Award
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToClient = () => {
    switchRole('client');
    navigate('/app/dashboard');
  };

  const handleGoToAdmin = () => {
    switchRole('admin');
    navigate('/admin');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Coach Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <Link to="/coach/dashboard" className="flex items-center">
            <Logo variant="horizontal" theme="light" size="sm" />
          </Link>
        </div>

        {/* Coach Profile Card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tennis-700 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {user?.name ? user.name.charAt(0) : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-xs text-slate-900 truncate">{user?.name || 'Prof. Santiago Álvarez'}</h3>
              <p className="text-[11px] text-tennis-700 font-semibold truncate">
                {user?.rolBackend || 'Profesor Oficial'}
              </p>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Docente N° {user?.memberNumber || 'DOC-77492'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Panel del Docente
          </div>

          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.to}
                end={item.exact}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-tennis-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-tennis-600'}`} />
                    <span>{item.name}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Switcher & Logout Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          {user?.isDemo && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleGoToClient}
                className="py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>Socio</span>
              </button>
              <button
                type="button"
                onClick={handleGoToAdmin}
                className="py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>Admin</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

      </aside>
    </>
  );
}
