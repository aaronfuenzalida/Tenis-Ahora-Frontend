import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getStoredToken, 
  getStoredUser, 
  setStoredToken, 
  removeStoredToken, 
  createMockToken 
} from '../utils/jwt';
import { INITIAL_USERS } from '../utils/mockData';

const AuthContext = createContext(null);

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
      // Default to guest/unauthenticated on first load so welcome login is displayed
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, roleHint = null) => {
    // Look up user in mock users or construct a profile
    let matchedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!matchedUser) {
      // Fallback dynamic user
      matchedUser = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email,
        role: roleHint || (email.includes('admin') ? 'admin' : 'client'),
        dni: '38.452.129',
        phone: '+54 11 4892-1234',
        address: 'Buenos Aires, Argentina',
        memberNumber: 'TA-8821'
      };
    }

    if (roleHint) {
      matchedUser = { ...matchedUser, role: roleHint };
    }

    const generatedJwt = createMockToken(matchedUser);
    setStoredToken(generatedJwt);
    setToken(generatedJwt);
    setUser(matchedUser);
    return matchedUser;
  };

  const register = async (formData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      dni: formData.dni,
      phone: formData.phone,
      address: formData.address,
      role: 'client',
      memberNumber: `TA-${Math.floor(1000 + Math.random() * 9000)}`,
      memberSince: new Date().toISOString().split('T')[0],
      activeDiscounts: []
    };

    const generatedJwt = createMockToken(newUser);
    setStoredToken(generatedJwt);
    setToken(generatedJwt);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      role: newRole,
      name: newRole === 'admin' ? 'Administrador General' : (user.name === 'Administrador General' ? 'Federico Gómez' : user.name),
      email: newRole === 'admin' ? 'admin@tenisahora.com' : 'socio@tenisahora.com'
    };
    const newToken = createMockToken(updatedUser);
    setStoredToken(newToken);
    setToken(newToken);
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
