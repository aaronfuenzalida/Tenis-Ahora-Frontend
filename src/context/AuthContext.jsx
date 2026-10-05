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

// El backend define los roles en Domain/Enums/Rol.cs; el front usa 'client' / 'admin'.
const ROL_BACKEND_A_FRONT = {
  Socio: 'client',
  Empleado: 'admin'
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
    // TODO: la entidad Usuario del backend todavía no guarda DNI ni número de socio.
    dni: '',
    memberNumber: `TA-${String(data.id).padStart(4, '0')}`,
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
    const demoUser = role === 'admin'
      ? {
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
        }
      : {
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

    const mockToken = createMockToken(demoUser);
    setStoredToken(mockToken);
    setStoredUser(demoUser);
    setToken(mockToken);
    setUser(demoUser);
    return demoUser;
  };

  // POST /api/auth/login — si el backend no responde pero son credenciales demo, activa demo
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      return guardarSesion(data);
    } catch (err) {
      const isConnectionError = err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || !err?.response;
      const lowerEmail = (email || '').toLowerCase().trim();
      if (isConnectionError && (lowerEmail === 'socio@tenisahora.com' || lowerEmail === 'admin@tenisahora.com')) {
        const role = lowerEmail.includes('admin') ? 'admin' : 'client';
        return loginDemo(role);
      }
      throw err;
    }
  };

  // POST /api/auth/registrar — si no hay backend, crea sesión demo local
  const register = async (formData) => {
    try {
      const data = await authService.registrar({
        nombre: formData.nombre,
        apellido: formData.apellido,
        direccion: formData.address,
        email: formData.email,
        numeroTelefono: formData.phone,
        password: formData.password
      });
      return guardarSesion(data);
    } catch (err) {
      const isConnectionError = err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || !err?.response;
      if (isConnectionError) {
        const localUser = {
          id: `usr-${Date.now()}`,
          name: `${formData.nombre} ${formData.apellido}`.trim() || formData.email,
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          role: 'client',
          rolBackend: 'Socio',
          dni: formData.dni || '00.000.000',
          memberNumber: `TA-${Math.floor(1000 + Math.random() * 9000)}`,
          isDemo: true
        };
        const mockToken = createMockToken(localUser);
        setStoredToken(mockToken);
        setStoredUser(localUser);
        setToken(mockToken);
        setUser(localUser);
        return localUser;
      }
      throw err;
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  /**
   * Alterna la vista socio/admin
   */
  const switchRole = (newRole) => {
    if (!user) return;
    const isDemo = user.isDemo || !user.rolBackend;
    const updatedUser = isDemo
      ? (newRole === 'admin'
          ? {
              ...user,
              role: 'admin',
              rolBackend: 'Empleado',
              name: 'Administrador General',
              email: 'admin@tenisahora.com',
              isDemo: true
            }
          : {
              ...user,
              role: 'client',
              rolBackend: 'Socio',
              name: 'Federico Gómez',
              email: 'socio@tenisahora.com',
              isDemo: true
            })
      : { ...user, role: newRole };

    if (updatedUser.isDemo) {
      const mockToken = createMockToken(updatedUser);
      setStoredToken(mockToken);
      setToken(mockToken);
    }
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
