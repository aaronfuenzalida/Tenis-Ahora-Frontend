import { useLocation } from 'react-router-dom';

export const DEMO_PREFIX = '/demo';

/** true si la URL pertenece a la demo (URL/demo/...), que vive separada de la app real. */
export function isDemoPath(pathname = window.location.pathname) {
  return pathname === DEMO_PREFIX || pathname.startsWith(`${DEMO_PREFIX}/`);
}

/** Rutas del portal según estemos en la app real o en la demo. */
export function portalPaths(demo) {
  const base = demo ? DEMO_PREFIX : '';
  return {
    demo,
    base,
    login: demo ? DEMO_PREFIX : '/login',
    app: `${base}/app`,
    appDashboard: `${base}/app/dashboard`,
    appReservas: `${base}/app/reservas`,
    appTorneos: `${base}/app/torneos`,
    appLigas: `${base}/app/ligas`,
    appClases: `${base}/app/clases`,
    appParticulares: `${base}/app/clases-particulares`,
    appPagos: `${base}/app/mis-pagos`,
    admin: `${base}/admin`,
    coach: `${base}/coach`,
    coachDashboard: `${base}/coach/dashboard`,
    homeFor: (role) => (role === 'admin' ? `${base}/admin` : role === 'coach' ? `${base}/coach/dashboard` : `${base}/app/dashboard`)
  };
}

export default function usePortalPaths() {
  const { pathname } = useLocation();
  return portalPaths(isDemoPath(pathname));
}
