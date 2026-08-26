/**
 * JWT Token Utilities for Tenis Ahora
 * Provides token creation, decoding, storage and expiration checks.
 */

// Base64Url encoding/decoding helper
function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return decodeURIComponent(escape(atob(str)));
}

/**
 * Creates a valid-formatted mock JWT token for testing
 */
export function createMockToken(user) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id || 'usr_1',
    id: user.id || 'usr_1',
    name: user.name || 'Usuario Tenis Ahora',
    email: user.email || 'socio@tenisahora.com',
    role: user.role || 'client', // 'admin' or 'client'
    dni: user.dni || '38.452.129',
    phone: user.phone || '+54 11 4892-1234',
    address: user.address || 'Av. San Martín 1420, Buenos Aires',
    memberNumber: user.memberNumber || 'TA-8821',
    iat: now,
    exp: now + 7 * 24 * 60 * 60 // 7 days valid
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const mockSignature = base64UrlEncode(`sig_tenis_ahora_${user.id}_${now}`);

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Decodes a JWT token without verification
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

export function getStoredUser() {
  const token = getStoredToken();
  if (!token) return null;
  return decodeToken(token);
}
