import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { portalPaths } from '../../hooks/usePortalPaths';

const ROLES = [
  { role: 'client', title: 'Socio', description: 'Reservas, torneos, ligas, clases y recibos.' },
  { role: 'coach', title: 'Profesor', description: 'Clases, asistencia, turnos particulares y certificación.' },
  { role: 'admin', title: 'Administración', description: 'Canchas, reservas, stock, competencias, caja, padrón y reportes.' }
];

/**
 * Entrada a la demo (URL/demo). Funciona sin backend y con datos de ejemplo; no toca la sesión real.
 */
export default function DemoLandingPage() {
  const { loginDemo } = useAuth();
  const navigate = useNavigate();
  const paths = portalPaths(true);

  const enter = (role) => {
    const demoUser = loginDemo(role);
    navigate(paths.homeFor(demoUser.role));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-tennis-950 to-slate-900 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-8 sm:p-12 space-y-8">
        <Logo variant="horizontal" theme="light" size="lg" showSubtitle={true} />

        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Demo</h1>
          <p className="text-sm text-slate-500 mt-2">
            Datos de ejemplo, sin servidor. Lo que cargues se reinicia al recargar la página. Elegí con qué rol entrar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map(r => (
            <button
              key={r.role}
              type="button"
              onClick={() => enter(r.role)}
              className="text-left p-5 rounded-2xl border border-slate-200 hover:border-tennis-500 hover:bg-tennis-50/40 transition-colors"
            >
              <h2 className="font-extrabold text-slate-900 text-sm">{r.title}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs">
          <Link to="/login" className="font-bold text-slate-700 hover:text-tennis-700 hover:underline">
            Ir a la aplicación
          </Link>
        </div>
      </div>
    </div>
  );
}
