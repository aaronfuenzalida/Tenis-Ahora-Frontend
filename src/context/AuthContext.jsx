import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken,
  createMockToken
} from '../utils/jwt';
import { authService } from '../services/api';

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
    role: ROL_BACKEND_A_FRONT[data.rol] ?? 'client',
    rolBackend: data.rol,
    coachId: data.coachId || undefined,
    dni: data.dni ?? '',
    memberNumber: data.memberNumber ?? '',
    isDemo: false
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    } else {
      // Sesión vencida o inexistente: arrancamos como invitado y se muestra el login
      removeStoredToken();
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const guardarSesion = (data) => {
    const usuario = mapearUsuario(data);
    setStoredToken(data.token);
    setStoredUser(usuario);
    setToken(data.token);
    setUser(usuario);
    return usuario;
  };

  /**
   * Inicio de sesión directo en Modo Demo (sin necesidad de backend levantado)
   */
  const loginDemo = (role = 'client') => {
    let demoUser;
    if (role === 'admin') {
      demoUser = {
        id: 'usr-02',
        name: 'Administrador General',
        nombre: 'Administrador',
        apellido: 'General',
        email: 'admin@tenisahora.com',
        phone: '+54 11 9988-1122',
        address: 'Sede Central Club Tenis Ahora, Buenos Aires',
        role: 'admin',
        rolBackend: 'Empleado',
        dni: '30.123.456',
        memberNumber: 'ADM-001',
        isDemo: true
      };
    } else if (role === 'coach') {
      demoUser = {
        id: 'coach-01',
        coachId: 'coach-01',
        name: 'Prof. Santiago Álvarez',
        nombre: 'Santiago',
        apellido: 'Álvarez',
        email: 'profesor@tenisahora.com',
        phone: '+54 11 5566-7788',
        address: 'Av. Libertador 2200, Buenos Aires',
        role: 'coach',
        rolBackend: 'Profesor',
        dni: '27.890.123',
        memberNumber: 'DOC-77492',
        isDemo: true
      };
    } else {
      demoUser = {
        id: 'usr-01',
        name: 'Federico Gómez',
        nombre: 'Federico',
        apellido: 'Gómez',
        email: 'socio@tenisahora.com',
        phone: '+54 11 4892-1234',
        address: 'Av. San Martín 1420, Quilmes, Buenos Aires',
        role: 'client',
        rolBackend: 'Socio',
        dni: '38.452.129',
        memberNumber: 'TA-8821',
        isDemo: true
      };
    }

    const mockToken = createMockToken(demoUser);
    setStoredToken(mockToken);
    setStoredUser(demoUser);
    setToken(mockToken);
    setUser(demoUser);
    return demoUser;
  };

  // POST /api/auth/login — con credenciales nunca se cae a la demo: si la API no responde, es un error
  // (la demo deja cambiar de rol, así que un socio terminaría viendo el panel de admin).
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
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  /**
   * Alterna la vista socio/docente/admin. Solo en Modo Demo: el rol de un usuario real lo
   * define el backend y no se puede cambiar desde el front.
   */
  const switchRole = (newRole) => {
    if (!user?.isDemo) return;
    const updatedUser = newRole === 'admin'
      ? {
          ...user,
          role: 'admin',
          rolBackend: 'Empleado',
          name: 'Administrador General',
          email: 'admin@tenisahora.com',
          isDemo: true
        }
      : newRole === 'coach'
      ? {
          ...user,
          role: 'coach',
          coachId: 'coach-01',
          rolBackend: 'Profesor',
          name: 'Prof. Santiago Álvarez',
          email: 'profesor@tenisahora.com',
          dni: '27.890.123',
          memberNumber: 'DOC-77492',
          isDemo: true
        }
      : {
          ...user,
          role: 'client',
          rolBackend: 'Socio',
          name: 'Federico Gómez',
          email: 'socio@tenisahora.com',
          isDemo: true
        };

    const mockToken = createMockToken(updatedUser);
    setStoredToken(mockToken);
    setToken(mockToken);
    setStoredUser(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isCoach: user?.role === 'coach',
    isDemo: !!user?.isDemo,
    login,
    loginDemo,
    register,
    logout,
    switchRole
  };

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
