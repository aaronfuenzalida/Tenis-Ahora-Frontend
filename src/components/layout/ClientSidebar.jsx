import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { 
  Home, 
  Calendar, 
  Trophy, 
  GraduationCap, 
  Receipt, 
  User, 
  LogOut, 
  ArrowRightLeft, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function ClientSidebar({ isOpen, onClose }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      name: 'Inicio / Mi Club',
      to: '/app/dashboard',
      icon: Home,
      exact: true
    },
    {
      name: 'Reservar Cancha',
      to: '/app/reservas',
      icon: Calendar
    },
    {
      name: 'Torneos & Fixtures',
      to: '/app/torneos',
      icon: Trophy
    },
    {
      name: 'Clases & Profesores',
      to: '/app/clases',
      icon: GraduationCap,
    },
    {
      name: 'Mis Pagos & Recibos',
      to: '/app/mis-pagos',
      icon: Receipt
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToAdmin = () => {
    switchRole('admin');
    navigate('/admin');
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
          <Link to="/app/dashboard" className="flex items-center">
            <Logo variant="horizontal" theme="light" size="md" showSubtitle={true} />
          </Link>
        </div>

        {/* Socio Profile Card / Member Pill */}
        <div className="p-4 mx-4 my-3 bg-tennis-50/70 rounded-2xl border border-tennis-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tennis-600 text-white flex items-center justify-center font-extrabold text-sm shadow-glow-green">
              {user?.name ? user.name.charAt(0) : 'S'}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-tennis-800 block">
                Socio Activo
              </span>
              <div className="font-bold text-xs text-slate-900 truncate">
                {user?.name || 'Federico Gómez'}
              </div>
              <span className="text-[10px] text-slate-500 block font-medium">
                N° {user?.memberNumber || 'TA-8821'}
              </span>
            </div>
          </div>
        </div>

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
                      ? 'bg-tennis-600 text-white shadow-md shadow-tennis-600/20'
                      : 'text-slate-600 hover:text-tennis-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-tennis-600'}`} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-tennis-700 text-white' : 'bg-tennis-100 text-tennis-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Switch to Admin Mode Box */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <button
            type="button"
            onClick={handleGoToAdmin}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-tennis-400" />
              <span>Panel Admin</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>

      </aside>
    </>
  );
}
