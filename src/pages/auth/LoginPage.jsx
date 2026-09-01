import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mensajeDeError } from '../../services/api';
import Logo from '../../components/common/Logo';
import { 
  User, 
  Lock, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Layers, 
  Trophy 
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // El rol lo decide el backend (Rol.Socio / Rol.Empleado), no la pantalla.
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo iniciar sesión.'));
    } finally {
      setLoading(false);
    }
  };

  // Los accesos rápidos solo completan el formulario: las credenciales tienen
  // que existir en la base (registralas una vez desde /register).
  const completarCredenciales = (demoEmail, demoPassword) => {
    setError('');
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-tennis-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Tennis Circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-tennis-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-tennis-400 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-white/10">
        
        {/* Left Side: Brand Showcase & Value Props (Verde y Blanco) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-tennis-700 via-tennis-800 to-tennis-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle court pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10">
            {/* Logo Oficial */}
            <Logo variant="horizontal" theme="white" size="lg" showSubtitle={true} />

            <div className="mt-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
                Tu cancha favorita reservada en segundos.
              </h2>
              <p className="text-sm text-tennis-100/90 leading-relaxed">
                Gestión integral de turnos en polvo de ladrillo, cemento y césped natural, torneos oficiales, clases con profesores certificados y control de caja en tiempo real.
              </p>
            </div>
          </div>

          

          {/* Bottom badge */}
          <div className="relative z-10 mt-8 pt-4 text-[11px] text-tennis-300/80">
            Universidad Nacional Arturo Jauretche — Ingeniería de Software
          </div>
        </div>

        {/* Right Side: Interactive Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 bg-white flex flex-col justify-center">
          
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-slate-500 mt-1">
              Ingresá con tus credenciales. Los accesos rápidos completan el formulario con las cuentas de prueba:
            </p>
          </div>

          {/* Quick Demo Selector Buttons */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => completarCredenciales('socio@tenisahora.com', 'Tenis1234')}
              className="p-3 bg-white hover:bg-tennis-50 border border-slate-200 hover:border-tennis-300 rounded-xl text-left transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-tennis-700 uppercase tracking-wide">DEMO</span>
              </div>
              <div className="font-bold text-sm text-slate-900 mt-1">Completar como Socio</div>
            </button>

            <button
              type="button"
              onClick={() => completarCredenciales('admin@tenisahora.com', 'Tenis1234')}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-left transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-tennis-400 uppercase tracking-wide">DEMO</span>
              </div>
              <div className="font-bold text-sm text-white mt-1">Completar como Empleado</div>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase">o</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-tennis-600 focus:ring-2 focus:ring-tennis-500/20 text-sm outline-none transition-all"
                  placeholder="ejemplo@tenisahora.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Contraseña
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Recuperación de clave no implementada todavía.'); }} className="text-xs text-tennis-600 hover:underline">
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-tennis-600 focus:ring-2 focus:ring-tennis-500/20 text-sm outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md hover:shadow-glow-green flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 text-center text-xs text-slate-600 pt-4 border-t border-slate-100">
            ¿No tenés una cuenta registrada?{' '}
            <Link to="/register" className="font-bold text-tennis-700 hover:text-tennis-800 hover:underline">
              Registrate como nuevo socio aquí
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
