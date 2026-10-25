/**
 * Utilidades de JWT y Sesión de Supabase Auth para Tenis Ahora (IEEE SRS-830).
 * Soporta tanto tokens emitidos por Supabase Auth (`access_token` + `refresh_token`)
 * como tokens emitidos directamente por TenisAhora.Api.
 */

// Base64Url decoding helper
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return decodeURIComponent(escape(atob(str)));
}

/**
 * Decodes a JWT token without verification (la firma la valida el backend C# / Supabase)
 */
export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
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

// Storage keys
const TOKEN_KEY = 'tenis_ahora_jwt_token';
const REFRESH_TOKEN_KEY = 'tenis_ahora_refresh_token';
const SUPABASE_SESSION_KEY = 'tenis_ahora_supabase_session';
const USER_KEY = 'tenis_ahora_user_data';

/**
 * Busca una sesión nativa de Supabase (`sb-<project-ref>-auth-token`) o la sesión
 * guardada en `tenis_ahora_supabase_session`.
 */
export function getSupabaseSession() {
  try {
    const customSessionRaw = localStorage.getItem(SUPABASE_SESSION_KEY);
    if (customSessionRaw) {
      const parsed = JSON.parse(customSessionRaw);
      if (parsed?.access_token) return parsed;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.access_token) return parsed;
      }
    }
  } catch (err) {
    console.warn('Error leyendo sesión de Supabase en localStorage:', err);
  }
  return null;
}

/**
 * Guarda la sesión completa de Supabase Auth (`access_token`, `refresh_token`, `user`)
 * y sincroniza `tenis_ahora_jwt_token`.
 */
export function setSupabaseSession(session) {
  if (!session) return;
  try {
    localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
    if (session.access_token) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
    }
    if (session.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
    }
  } catch (err) {
    console.error('Error guardando sesión de Supabase:', err);
  }
}

/**
 * Extrae los claims de negocio (`sub`, `email`, `role`, `dni`, `coachId`) desde un JWT
 * o sesión de Supabase Auth.
 */
export function extractSupabaseUserClaims(tokenOrSession) {
  const token =
    typeof tokenOrSession === 'string'
      ? tokenOrSession
      : tokenOrSession?.access_token || tokenOrSession?.token || getStoredToken();

  const payload = decodeToken(token) || {};
  const appMeta = payload.app_metadata || tokenOrSession?.user?.app_metadata || {};
  const userMeta = payload.user_metadata || tokenOrSession?.user?.user_metadata || {};

  return {
    sub: payload.sub || tokenOrSession?.user?.id || null,
    email: payload.email || tokenOrSession?.user?.email || null,
    role:
      appMeta.role ||
      userMeta.role ||
      payload.tenis_role ||
      payload.role ||
      'client',
    dni: userMeta.dni || appMeta.dni || payload.dni || '',
    coachId: appMeta.coach_id || userMeta.coachId || payload.coachId || null
  };
}

/**
 * Obtiene el JWT vigente (priorizando el `access_token` de Supabase Auth)
 * para ser inyectado como `Authorization: Bearer <token>` en Axios.
 */
export function getStoredToken() {
  const sbSession = getSupabaseSession();
  if (sbSession?.access_token && !isTokenExpired(sbSession.access_token)) {
    return sbSession.access_token;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || isTokenExpired(token)) {
    if (!getStoredRefreshToken()) {
      removeStoredToken();
    }
    return null;
  }
  return token;
}

export function getStoredRefreshToken() {
  const sbSession = getSupabaseSession();
  if (sbSession?.refresh_token) {
    return sbSession.refresh_token;
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredToken(token, refreshToken = null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SUPABASE_SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Persiste el perfil de usuario enriquecido en localStorage.
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
    if (raw) {
      return JSON.parse(raw);
    }
    const sbSession = getSupabaseSession();
    if (sbSession?.access_token) {
      const claims = extractSupabaseUserClaims(sbSession);
      return {
        id: String(claims.sub || 'usr-01'),
        name: sbSession.user?.user_metadata?.full_name || claims.email || 'Socio Tenis Ahora',
        email: claims.email || '',
        role: claims.role === 'admin' ? 'admin' : claims.role === 'coach' ? 'coach' : 'client',
        dni: claims.dni || '',
        coachId: claims.coachId || undefined,
        isDemo: false
      };
    }
    return null;
  } catch (err) {
    console.error('Error leyendo el usuario guardado:', err);
    return null;
  }
}

// ---- Sesión de la demo (URL/demo/...): vive en sessionStorage, separada de la sesión real ----
const DEMO_USER_KEY = 'tenis_ahora_demo_user';

export function getDemoUser() {
  try {
    const raw = sessionStorage.getItem(DEMO_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function setDemoUser(user) {
  if (user) {
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify({ ...user, isDemo: true }));
  }
}

export function removeDemoUser() {
  sessionStorage.removeItem(DEMO_USER_KEY);
}
