import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from './Logo';
import Avatar from './Avatar';
import usePortalPaths from '../utils/portalPaths';
import { Home, Calendar, Trophy, ListOrdered, GraduationCap, UserRound, Receipt } from 'lucide-react';

export default function ClientSidebar({ isOpen, onClose, onEditProfile }) {
  const { user, isDemo, logout, switchRole } = useAuth();
  const paths = usePortalPaths();
  const navigate = useNavigate();

  const navItems = [
    {
      name: 'Inicio',
      to: paths.appDashboard,
      icon: Home,
      exact: true
    },
    {
      name: 'Reservar Cancha',
      to: paths.appReservas,
      icon: Calendar
    },
    {
      name: 'Torneos',
      to: paths.appTorneos,
      icon: Trophy
    },
    {
      name: 'Ligas',
      to: paths.appLigas,
      icon: ListOrdered
    },
    {
      name: 'Clases y Entrenamientos',
      to: paths.appClases,
      icon: GraduationCap
    },
    {
      name: 'Clases Particulares',
      to: paths.appParticulares,
      icon: UserRound
    },
    {
      name: 'Mis Pagos y Recibos',
      to: paths.appPagos,
      icon: Receipt
    }
  ];

  const handleLogout = () => {
    logout();
    navigate(paths.login);
  };

  const handleGoToAdmin = () => {
    switchRole('admin');
    navigate(paths.admin);
  };

  const handleGoToCoach = () => {
    switchRole('coach');
    navigate(paths.coach);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Lateral Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white text-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } border-r border-slate-200 shadow-sm`}>
        
        {/* Top Logo Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-white">
          <Link to={paths.appDashboard} className="flex items-center">
            <Logo variant="horizontal" theme="light" size="md" showSubtitle={true} />
          </Link>
        </div>

        {/* Socio Profile Card / Member Pill */}
        <button
          type="button"
          onClick={() => { onEditProfile && onEditProfile(); onClose && onClose(); }}
          title="Editar mi perfil"
          className="p-4 mx-4 my-3 bg-tennis-50/70 hover:bg-tennis-100/80 rounded-2xl border border-tennis-200/80 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar user={user} size="w-10 h-10" rounded="rounded-xl" textClass="text-sm" />
            <div className="overflow-hidden">
              <div className="font-bold text-xs text-slate-900 truncate">
                {user?.name || 'Socio'}
              </div>
              <span className="text-[10px] text-slate-500 block font-medium">
                N° {user?.memberNumber || '—'} • Editar perfil
              </span>
            </div>
          </div>
        </button>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
          <div className="px-2 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Menú Principal
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
                  `flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-tennis-600 text-white'
                      : 'text-slate-600 hover:text-tennis-900 hover:bg-slate-50'
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

        {/* Switch to Profesor or Admin Mode Box */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          {isDemo && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleGoToCoach}
                className="py-2 px-2.5 rounded-xl border border-tennis-200 bg-tennis-50 hover:bg-tennis-100 text-tennis-900 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>Profesor</span>
              </button>
              <button
                type="button"
                onClick={handleGoToAdmin}
                className="py-2 px-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>Admin</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

      </aside>
    </>
  );
}
