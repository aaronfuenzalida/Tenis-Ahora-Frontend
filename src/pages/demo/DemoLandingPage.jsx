import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { portalPaths } from '../../hooks/usePortalPaths';

const ROLES = [
  {
    role: 'client',
    title: 'Portal del Socio',
    description: 'Reservá canchas, inscribite a torneos, ligas y clases y consultá tus recibos.',
    icon: Users,
    accent: 'bg-tennis-600 text-white'
  },
  {
    role: 'coach',
    title: 'Panel Docente',
    description: 'Agenda de clases y entrenamientos, asistencia, turnos particulares y certificación.',
    icon: GraduationCap,
    accent: 'bg-tennis-50 text-tennis-900 border border-tennis-200'
  },
  {
    role: 'admin',
    title: 'Panel de Administración',
    description: 'Canchas, reservas, stock, competencias, docentes, caja, padrón y reportes.',
    icon: ShieldCheck,
    accent: 'bg-slate-900 text-white'
  }
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
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10 p-8 sm:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Logo variant="horizontal" theme="light" size="lg" showSubtitle={true} />
          <span className="inline-flex items-center self-start px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase tracking-wider">
            Entorno de demostración
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Probá el sistema con datos de ejemplo</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            La demo funciona sin servidor y con información ficticia: lo que cargues se guarda solo en esta pestaña y se reinicia al recargar.
            Elegí con qué rol querés recorrerla. Las direcciones son <code className="font-mono text-xs bg-slate-100 px-1 rounded">/demo/app</code>,{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 rounded">/demo/coach</code> y <code className="font-mono text-xs bg-slate-100 px-1 rounded">/demo/admin</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <button
                key={r.role}
                type="button"
                onClick={() => enter(r.role)}
                className="text-left p-5 rounded-2xl border border-slate-200 hover:border-tennis-400 hover:shadow-md transition-all bg-white space-y-3 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${r.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm">{r.title}</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
                </div>
                <span className="text-xs font-bold text-tennis-700 group-hover:underline">Entrar como {r.role === 'client' ? 'socio' : r.role === 'coach' ? 'docente' : 'administrador'} →</span>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-tennis-700">
            <ArrowLeft className="w-3.5 h-3.5" />
            Ir a la aplicación real
          </Link>
          <span>Universidad Nacional Arturo Jauretche — Ingeniería de Software</span>
        </div>
      </div>
    </div>
  );
}
