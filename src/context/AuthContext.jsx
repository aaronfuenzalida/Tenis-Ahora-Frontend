import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken
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
    memberNumber: `TA-${String(data.id).padStart(4, '0')}`
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

  // POST /api/auth/login — lanza el error de axios para que la página muestre el mensaje
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
   * Solo para la demo: alterna la vista socio/admin sin volver a pedir token.
   * El rol real viaja firmado dentro del JWT, así que cuando los endpoints de
   * administración estén protegidos con [Authorize(Roles = "Empleado")] esto
   * deja de servir y hay que borrarlo.
   */
  const switchRole = (newRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    setStoredUser(updatedUser);
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
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
