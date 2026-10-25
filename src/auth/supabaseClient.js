/**
 * Cliente ligero de Supabase Auth (GoTrue REST API v1) para Tenis Ahora (IEEE SRS-830).
 * Gestiona login, registro, refresh de token JWT y cierre de sesión contra Supabase Auth,
 * manteniendo sincronizado el token Bearer que se inyecta hacia la Web API en C# (.NET 8).
 */

import {
  getStoredToken,
  getStoredRefreshToken,
  setSupabaseSession,
  removeStoredToken,
  extractSupabaseUserClaims
} from './jwt';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Indica si las variables de entorno de Supabase Auth están configuradas en el cliente.
 */
export function isSupabaseAuthConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function buildSupabaseHeaders(accessToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (SUPABASE_ANON_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return headers;
}

/**
 * Convierte la sesión devuelta por Supabase Auth (GoTrue) al contrato AuthResponseDto
 * esperado por AuthContext y las pantallas de Tenis Ahora.
 */
export function normalizeSupabaseAuthResponse(sessionData, fallbackProfile = {}) {
  const accessToken = sessionData?.access_token || sessionData?.token || '';
  const refreshToken = sessionData?.refresh_token || sessionData?.refreshToken || '';
  const sbUser = sessionData?.user || {};
  const userMeta = sbUser.user_metadata || {};
  const appMeta = sbUser.app_metadata || {};
  const claims = extractSupabaseUserClaims(accessToken || sessionData);

  const rawRole =
    appMeta.role ||
    userMeta.role ||
    claims.role ||
    fallbackProfile.rol ||
    'Socio';

  const normalizedRolBackend =
    rawRole === 'admin' || rawRole === 'Empleado'
      ? 'Empleado'
      : rawRole === 'coach' || rawRole === 'Profesor' || rawRole === 'Entrenador'
      ? 'Profesor'
      : 'Socio';

  const fullName =
    userMeta.full_name ||
    userMeta.name ||
    `${fallbackProfile.nombre || userMeta.nombre || ''} ${fallbackProfile.apellido || userMeta.apellido || ''}`.trim();

  const [firstPart, ...restParts] = (fullName || '').split(' ');

  return {
    id: sbUser.id || claims.sub || fallbackProfile.id || 'usr-supabase',
    nombre: userMeta.nombre || fallbackProfile.nombre || firstPart || sbUser.email || '',
    apellido: userMeta.apellido || fallbackProfile.apellido || restParts.join(' ') || '',
    email: sbUser.email || claims.email || fallbackProfile.email || '',
    numeroTelefono: userMeta.phone || userMeta.telefono || fallbackProfile.numeroTelefono || '',
    direccion: userMeta.address || userMeta.direccion || fallbackProfile.direccion || '',
    dni: userMeta.dni || appMeta.dni || claims.dni || fallbackProfile.dni || '',
    memberNumber: userMeta.member_number || userMeta.memberNumber || fallbackProfile.memberNumber || '',
    coachId: appMeta.coach_id || userMeta.coachId || claims.coachId || fallbackProfile.coachId || undefined,
    rol: normalizedRolBackend,
    token: accessToken,
    refreshToken,
    supabaseUser: sbUser
  };
}

/**
 * Inicia sesión con email y contraseña contra Supabase Auth (`/auth/v1/token?grant_type=password`).
 */
export async function signInWithSupabasePassword(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: buildSupabaseHeaders(),
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      data?.error_description ||
      data?.msg ||
      data?.error ||
      'Credenciales inválidas en Supabase Auth.';
    const error = new Error(msg);
    error.status = response.status;
    throw error;
  }

  setSupabaseSession(data);
  return normalizeSupabaseAuthResponse(data, { email });
}

/**
 * Registra un nuevo socio en Supabase Auth (`/auth/v1/signup`) adjuntando metadata del club.
 */
export async function signUpWithSupabase({
  nombre,
  apellido,
  direccion,
  email,
  numeroTelefono,
  dni,
  password
}) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: buildSupabaseHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: {
        nombre,
        apellido,
        full_name: `${nombre || ''} ${apellido || ''}`.trim(),
        direccion,
        phone: numeroTelefono,
        dni,
        role: 'client'
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      data?.error_description ||
      data?.msg ||
      data?.error ||
      'No se pudo completar el registro en Supabase Auth.';
    const error = new Error(msg);
    error.status = response.status;
    throw error;
  }

  // En Supabase Auth, si autoconfirm está activo devuelve access_token directamente;
  // de lo contrario devuelve el objeto user y se realiza sign-in inmediato.
  if (data?.access_token) {
    setSupabaseSession(data);
    return normalizeSupabaseAuthResponse(data, {
      nombre,
      apellido,
      direccion,
      email,
      numeroTelefono,
      dni
    });
  }

  return signInWithSupabasePassword(email, password);
}

/**
 * Refresca el JWT de Supabase Auth usando el `refresh_token` almacenado.
 */
export async function refreshSupabaseSession() {
  const refreshToken = getStoredRefreshToken();
  if (!isSupabaseAuthConfigured() || !refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: buildSupabaseHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      removeStoredToken();
      return null;
    }

    const sessionData = await response.json();
    if (sessionData?.access_token) {
      setSupabaseSession(sessionData);
      return sessionData.access_token;
    }
    return null;
  } catch (err) {
    console.warn('Error al refrescar sesión de Supabase Auth:', err);
    return null;
  }
}

/**
 * Cierra la sesión activa en Supabase Auth (`/auth/v1/logout`) y limpia el almacenamiento local.
 */
export async function signOutFromSupabase() {
  const token = getStoredToken();
  removeStoredToken();

  if (!isSupabaseAuthConfigured() || !token) {
    return;
  }

  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: buildSupabaseHeaders(token)
    });
  } catch {
    // Ignorar errores de red al cerrar sesión
  }
}
