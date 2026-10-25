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
  removeDemoUser,
  extractSupabaseUserClaims
} from '../utils/jwt';
import {
  isSupabaseAuthConfigured,
  refreshSupabaseSession,
  signOutFromSupabase
} from '../auth/supabaseClient';
import { authService, usersService, coachesAndClassesService } from '../services/api';
import { isDemoPath } from '../hooks/usePortalPaths';

const AuthContext = createContext(null);

const ROL_BACKEND_A_FRONT = {
  Socio: 'client',
  client: 'client',
  Empleado: 'admin',
  admin: 'admin',
  Profesor: 'coach',
  Entrenador: 'coach',
  coach: 'coach'
};

function mapearUsuario(data) {
  const token = data.token || data.access_token;
  const claims = extractSupabaseUserClaims(token || data);
  const nombreCompleto = `${data.nombre ?? ''} ${data.apellido ?? ''}`.trim();
  const rawRol = data.rol || claims.role || 'Socio';

  return {
    id: String(data.id || claims.sub || 'usr-01'),
    name: nombreCompleto || data.name || data.email || claims.email || 'Socio Tenis Ahora',
    nombre: data.nombre || '',
    apellido: data.apellido || '',
    email: data.email || claims.email || '',
    phone: data.numeroTelefono ?? data.phone ?? '',
    address: data.direccion ?? data.address ?? '',
    photo: data.photo ?? '',
    role: ROL_BACKEND_A_FRONT[rawRol] ?? 'client',
    rolBackend: rawRol,
    coachId: data.coachId || claims.coachId || undefined,
    dni: data.dni || claims.dni || '',
    memberNumber: data.memberNumber ?? '',
    isDemo: false
  };
}

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

  const [token, setToken] = useState(null);
  const [realUser, setRealUser] = useState(null);
  const [demoUser, setDemoUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function initSession() {
      let savedToken = getStoredToken();
      if (!savedToken && isSupabaseAuthConfigured()) {
        savedToken = await refreshSupabaseSession();
      }
      const savedUser = getStoredUser();

      if (!mounted) return;
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
    }
    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  const guardarSesion = (data) => {
    const resolvedToken = data.token || data.access_token;
    const usuario = mapearUsuario(data);
    setStoredToken(resolvedToken, data.refreshToken || data.refresh_token);
    setStoredUser(usuario);
    setToken(resolvedToken);
    setRealUser(usuario);
    return usuario;
  };

  const guardarDemo = (usuario) => {
    setDemoUser(usuario);
    setDemoUserState(usuario);
    return usuario;
  };

  const loginDemo = (role = 'client') => {
    const base = DEMO_USERS[role] || DEMO_USERS.client;
    const current = getDemoUser();
    if (current && current.role === base.role) return guardarDemo(current);
    return guardarDemo({ ...base });
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    return guardarSesion(data);
  };

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
    signOutFromSupabase();
    removeStoredToken();
    setToken(null);
    setRealUser(null);
  };

  const switchRole = (newRole) => {
    if (!isDemo) return null;
    return guardarDemo({ ...(DEMO_USERS[newRole] || DEMO_USERS.client) });
  };

  const user = isDemo ? demoUser : realUser;

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

    if (user.role !== 'coach' || isDemo) {
      try {
        await usersService.update(user.id, { ...changes, nombre, apellido });
      } catch (err) {
        if (!isDemo) throw err;
      }
    }
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
