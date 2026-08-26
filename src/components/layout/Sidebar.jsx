import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { 
  LayoutDashboard, 
  Layers, 
  Calendar, 
  Package, 
  Trophy, 
  GraduationCap, 
  DollarSign, 
  Users, 
  BarChart3, 
  ArrowLeft,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navSections = [
    {
      group: 'Principal',
      items: [
        { name: 'Dashboard General', to: '/admin', icon: LayoutDashboard, exact: true }
      ]
    },
    {
      group: 'Canchas & Reservas',
      items: [
        { name: 'Gestión de Canchas', to: '/admin/canchas', icon: Layers },
        { name: 'Control de Reservas', to: '/admin/reservas', icon: Calendar }
      ]
    },
    {
      group: 'Inventario & Equipamiento',
      items: [
        { name: 'Stock de Materiales', to: '/admin/stock', icon: Package }
      ]
    },
    {
      group: 'Competición & Enseñanza',
      items: [
        { name: 'Torneos & Fixtures', to: '/admin/torneos', icon: Trophy },
        { name: 'Profesores & Clases', to: '/admin/profesores-clases', icon: GraduationCap}
      ]
    },
    {
      group: 'Caja & Administración',
      items: [
        { name: 'Caja & Recibos (QR)', to: '/admin/caja', icon: DollarSign },
        { name: 'Padrón de Usuarios', to: '/admin/usuarios', icon: Users },
        { name: 'Reportes & Estadísticas', to: '/admin/reportes', icon: BarChart3 }
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
                            ? 'bg-tennis-600 text-white shadow-sm shadow-tennis-600/30'
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
                          
                          {item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                              isActive ? 'bg-tennis-700 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {item.alertBadge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {item.alertBadge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Return to Client View Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <Link
            to="/app/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-tennis-400" />
            Volver a Vista Socio
          </Link>
        </div>

      </aside>
    </>
  );
}
