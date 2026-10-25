import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken,
  getDemoUser,
  setDemoUser,
  removeDemoUser
} from './jwt';
import { authService, usersService, coachesAndClassesService } from '../api';
import { isDemoPath } from '../utils/portalPaths';

const AuthContext = createContext(null);

// El front usa 'client' / 'admin' / 'coach'; el tipo de profesional queda en rolBackend.
const ROL_BACKEND_A_FRONT = {
  Socio: 'client',
  Empleado: 'admin',
  Profesor: 'coach',
  Entrenador: 'coach'
};

/**
 * Adapta el AuthResponseDto de la API a la forma de usuario que consumen las páginas.
 */
function mapearUsuario(data) {
  const nombreCompleto = `${data.nombre ?? ''} ${data.apellido ?? ''}`.trim();

  return {
    id: String(data.id),
    name: nombreCompleto || data.email,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    phone: data.numeroTelefono ?? '',
    address: data.direccion ?? '',
    photo: data.photo ?? '',
    role: ROL_BACKEND_A_FRONT[data.rol] ?? 'client',
    rolBackend: data.rol,
    coachId: data.coachId || undefined,
    dni: data.dni ?? '',
    memberNumber: data.memberNumber ?? '',
    isDemo: false
  };
}

/** Usuarios de la demo (coinciden con los datos de ejemplo de src/api/demoData.js). */
const DEMO_USERS = {
  admin: {
    id: 'usr-admin',
    name: 'Carolina Peralta',
    nombre: 'Carolina',
    apellido: 'Peralta',
    email: 'admin@tenisahora.com',
    phone: '+54 11 4253-8800',
    address: 'Sede Club Tenis Ahora, Quilmes',
    photo: '',
    role: 'admin',
    rolBackend: 'Empleado',
    dni: '30.512.774',
    memberNumber: 'ADM-001',
    isDemo: true
  },
  coach: {
    id: 'coach-01',
    coachId: 'coach-01',
    name: 'Gustavo Ferrari',
    nombre: 'Gustavo',
    apellido: 'Ferrari',
    email: 'profesor@tenisahora.com',
    phone: '+54 11 5566-7788',
    address: 'Quilmes, Buenos Aires',
    photo: '',
    role: 'coach',
    rolBackend: 'Profesor',
    dni: '28.334.901',
    memberNumber: 'DOC-01',
    isDemo: true
  },
  client: {
    id: 'usr-01',
    name: 'Juan Sánchez',
    nombre: 'Juan',
    apellido: 'Sánchez',
    email: 'socio@tenisahora.com',
    phone: '+54 11 5234-7781',
    address: 'Mitre 1240, Quilmes',
    photo: '',
    role: 'client',
    rolBackend: 'Socio',
    dni: '35.678.912',
    memberNumber: 'TA-1001',
    isDemo: true
  }
};

export function AuthProvider({ children }) {
  const { pathname } = useLocation();
  const isDemo = isDemoPath(pathname);

  // Sesión real (token del backend, localStorage) y sesión demo (sessionStorage) viven separadas:
  // la demo en URL/demo/... nunca pisa la sesión de un usuario real.
  const [token, setToken] = useState(null);
  const [realUser, setRealUser] = useState(null);
  const [demoUser, setDemoUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setRealUser(savedUser);
    } else {
      removeStoredToken();
      setToken(null);
      setRealUser(null);
    }
    setDemoUserState(getDemoUser());
    setLoading(false);
  }, []);

  const guardarSesion = (data) => {
    const usuario = mapearUsuario(data);
    setStoredToken(data.token);
    setStoredUser(usuario);
    setToken(data.token);
    setRealUser(usuario);
    return usuario;
  };

  const guardarDemo = (usuario) => {
    setDemoUser(usuario);
    setDemoUserState(usuario);
    return usuario;
  };

  /**
   * Inicio de sesión en la demo (sin backend). Solo se usa bajo URL/demo.
   */
  const loginDemo = (role = 'client') => {
    const base = DEMO_USERS[role] || DEMO_USERS.client;
    // Si ya había una demo del mismo rol se conservan los datos editados (nombre, foto, etc.).
    const current = getDemoUser();
    if (current && current.role === base.role) return guardarDemo(current);
    return guardarDemo({ ...base });
  };

  // POST /api/auth/login — con credenciales nunca se cae a la demo: si la API no responde, es un error.
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    return guardarSesion(data);
  };

  // POST /api/auth/registrar
  const register = async (formData) => {
    const data = await authService.registrar({
      nombre: formData.nombre,
      apellido: formData.apellido,
      direccion: formData.address,
      email: formData.email,
      numeroTelefono: formData.phone,
      dni: formData.dni,
      password: formData.password
    });
    return guardarSesion(data);
  };

  const logout = () => {
    if (isDemo) {
      removeDemoUser();
      setDemoUserState(null);
      return;
    }
    removeStoredToken();
    setToken(null);
    setRealUser(null);
  };

  /**
   * Alterna la vista socio/profesor/admin. Solo en la demo: el rol de un usuario real lo
   * define el backend y no se puede cambiar desde el front.
   */
  const switchRole = (newRole) => {
    if (!isDemo) return null;
    return guardarDemo({ ...(DEMO_USERS[newRole] || DEMO_USERS.client) });
  };

  const user = isDemo ? demoUser : realUser;

  /**
   * Actualiza nombre, teléfono y foto del usuario logueado (socio, profesional o empleado).
   * Persiste en el padrón (y en la ficha del profesor si corresponde) y en la sesión local.
   */
  const updateProfile = async ({ name, phone, photo }) => {
    if (!user) throw new Error('No hay una sesión activa.');
    const cleanName = String(name ?? user.name).trim();
    if (!cleanName) throw new Error('El nombre no puede quedar vacío.');

    const changes = {
      name: cleanName,
      phone: String(phone ?? user.phone ?? '').trim(),
      photo: photo ?? user.photo ?? ''
    };
    const [nombre, ...resto] = cleanName.split(' ');
    const apellido = resto.join(' ');

    // Ficha del padrón de usuarios (en la demo el padrón de la administración refleja el cambio).
    if (user.role !== 'coach' || isDemo) {
      try {
        await usersService.update(user.id, { ...changes, nombre, apellido });
      } catch (err) {
        if (!isDemo) throw err;
      }
    }
    // Ficha pública del profesor o entrenador.
    if (user.role === 'coach' && user.coachId) {
      await coachesAndClassesService.updateCoach(user.coachId, changes);
    }

    const updated = { ...user, ...changes, nombre, apellido };
    if (isDemo) {
      guardarDemo(updated);
    } else {
      setStoredUser(updated);
      setRealUser(updated);
    }
    return updated;
  };

  const value = useMemo(() => ({
    user,
    token: isDemo ? null : token,
    loading,
    isDemo,
    isAuthenticated: isDemo ? !!demoUser : !!token && !!realUser,
    isAdmin: user?.role === 'admin',
    isCoach: user?.role === 'coach',
    login,
    loginDemo,
    register,
    logout,
    switchRole,
    updateProfile
  }), [user, token, loading, isDemo, demoUser, realUser]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
