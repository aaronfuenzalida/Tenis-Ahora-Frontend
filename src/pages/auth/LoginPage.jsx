import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mensajeDeError } from '../../services/api';
import Logo from '../../components/common/Logo';

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
      // El backend decide el rol
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'coach') {
        navigate('/coach');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo iniciar sesión.'));
    } finally {
      setLoading(false);
    }
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
              Ingresá con tu cuenta de socio, docente o administración.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-slate-50 text-slate-700 text-xs rounded-xl border border-slate-200 font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-tennis-600 focus:ring-2 focus:ring-tennis-500/20 text-sm outline-none transition-all"
                  placeholder="ejemplo@tenisahora.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-tennis-600 focus:ring-2 focus:ring-tennis-500/20 text-sm outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-5 text-center text-xs text-slate-600 pt-3 border-t border-slate-100">
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
