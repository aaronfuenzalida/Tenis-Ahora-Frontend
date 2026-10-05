/**
 * JWT Token Utilities for Tenis Ahora
 * El token lo emite el backend (TenisAhora.API). Acá solo lo guardamos,
 * lo decodificamos para leer su vencimiento y lo borramos al salir.
 */

// Base64Url encoding helper
function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Base64Url decoding helper
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return decodeURIComponent(escape(atob(str)));
}

/**
 * Creates a valid-formatted mock JWT token for demo mode & tests
 */
export function createMockToken(user = {}) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user.id || 'usr-demo'),
    email: user.email || 'demo@tenisahora.com',
    role: user.role === 'admin' ? 'Empleado' : 'Socio',
    isDemo: true,
    iat: now,
    exp: now + 30 * 24 * 60 * 60 // 30 days valid
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(`sig_demo_${user.id || 'demo'}_${now}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Decodes a JWT token without verification (la firma la valida el backend)
 */
export function decodeToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload;
  } catch (err) {
    console.error('Error decoding JWT:', err);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

// Storage helpers
const TOKEN_KEY = 'tenis_ahora_jwt_token';
const USER_KEY = 'tenis_ahora_user_data';

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || isTokenExpired(token)) {
    removeStoredToken();
    return null;
  }
  return token;
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * El perfil viene en la respuesta del login (AuthResponseDto), no dentro del token:
 * el JWT del backend solo trae sub, email y role.
 */
export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getStoredUser() {
  if (!getStoredToken()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error leyendo el usuario guardado:', err);
    return null;
  }
}
