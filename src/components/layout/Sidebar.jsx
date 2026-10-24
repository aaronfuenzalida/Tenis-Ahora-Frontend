import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { LayoutDashboard, Layers, Calendar, Package, Trophy, GraduationCap, DollarSign, Users, BarChart3 } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { switchRole, isDemo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReturnToClient = () => {
    switchRole('client');
    navigate('/app/dashboard');
  };

  const handleGoToCoach = () => {
    switchRole('coach');
    navigate('/coach');
  };

  const navSections = [
    {
      group: 'Principal',
      items: [
        { name: 'Dashboard General', to: '/admin', icon: LayoutDashboard, exact: true }
      ]
    },
    {
      group: 'Canchas y Reservas',
      items: [
        { name: 'Canchas, Tipos y Horarios', to: '/admin/canchas', icon: Layers },
        { name: 'Control de Reservas', to: '/admin/reservas', icon: Calendar }
      ]
    },
    {
      group: 'Inventario y Equipamiento',
      items: [
        { name: 'Gestión de Stock', to: '/admin/stock', icon: Package }
      ]
    },
    {
      group: 'Competición y Enseñanza',
      items: [
        { name: 'Torneos, Ligas y Competencias', to: '/admin/torneos', icon: Trophy },
        { name: 'Docentes, Clases y Entrenamientos', to: '/admin/profesores-clases', icon: GraduationCap}
      ]
    },
    {
      group: 'Caja y Administración',
      items: [
        { name: 'Caja, Facturas y Reembolsos', to: '/admin/caja', icon: DollarSign },
        { name: 'Padrón de Usuarios', to: '/admin/usuarios', icon: Users },
        { name: 'Reportes y Estadísticas', to: '/admin/reportes', icon: BarChart3 }
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } border-r border-slate-800`}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <Link to="/admin" className="flex items-center">
            <Logo variant="horizontal" theme="dark" size="sm" showSubtitle={true} />
          </Link>
        </div>

        {/* Navigation Items (Mosaic Style) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={idx}
                      to={item.to}
                      end={item.exact}
                      onClick={() => onClose && onClose()}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-tennis-600 text-white'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span>{item.name}</span>
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Return to Client or Coach View Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          {isDemo && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleReturnToClient}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
              >
                <span>Socio</span>
              </button>
              <button
                type="button"
                onClick={handleGoToCoach}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-tennis-950/80 hover:bg-tennis-900 text-tennis-300 text-xs font-semibold transition-colors border border-tennis-800/60 cursor-pointer"
              >
                <span>Docente</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

      </aside>
    </>
  );
}
