import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { FeedbackProvider } from './ui/FeedbackContext';
import { portalPaths } from './utils/portalPaths';

// Layouts
import ClientLayout from './layout/ClientLayout';
import AdminLayout from './layout/AdminLayout';
import CoachLayout from './layout/CoachLayout';

// Auth Pages
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import DemoLandingPage from './demo/DemoLandingPage';

// Client Pages
import ClientDashboard from './modulos/inicio/ClientDashboard';
import BookCourtPage from './modulos/reservas/BookCourtPage';
import ClientTournamentsPage from './modulos/competencias/ClientTournamentsPage';
import ClientLeaguesPage from './modulos/competencias/ClientLeaguesPage';
import ClientPrivateLessonsPage from './modulos/clases/ClientPrivateLessonsPage';
import ClientClassesPage from './modulos/clases/ClientClassesPage';
import ClientPaymentsPage from './modulos/caja/ClientPaymentsPage';

// Coach Pages
import CoachDashboard from './modulos/inicio/CoachDashboard';
import CoachClassesPage from './modulos/clases/CoachClassesPage';
import CoachPrivateLessonsPage from './modulos/clases/CoachPrivateLessonsPage';
import CoachProfilePage from './modulos/profesores/CoachProfilePage';
import CoachCertificationPage from './modulos/profesores/CoachCertificationPage';

// Admin Pages
import AdminDashboard from './modulos/inicio/AdminDashboard';
import CourtsManagementPage from './modulos/canchas/CourtsManagementPage';
import CourtTypesPage from './modulos/canchas/CourtTypesPage';
import CourtAvailabilityPage from './modulos/canchas/CourtAvailabilityPage';
import ReservationsManagementPage from './modulos/reservas/ReservationsManagementPage';
import StockManagementPage from './modulos/stock/StockManagementPage';
import TournamentsManagementPage from './modulos/competencias/TournamentsManagementPage';
import LeaguesManagementPage from './modulos/competencias/LeaguesManagementPage';
import MatchesManagementPage from './modulos/competencias/MatchesManagementPage';
import CompetitionTypesPage from './modulos/competencias/CompetitionTypesPage';
import CoachesManagementPage from './modulos/profesores/CoachesManagementPage';
import ClassesManagementPage from './modulos/clases/ClassesManagementPage';
import AttendanceManagementPage from './modulos/clases/AttendanceManagementPage';
import PrivateLessonsManagementPage from './modulos/clases/PrivateLessonsManagementPage';
import CashierAndReceiptsPage from './modulos/caja/CashierAndReceiptsPage';
import InvoicesPage from './modulos/caja/InvoicesPage';
import RefundsPage from './modulos/caja/RefundsPage';
import DiscountsPage from './modulos/caja/DiscountsPage';
import UsersManagementPage from './modulos/usuarios/UsersManagementPage';
import ReportsPage from './modulos/reportes/ReportsPage';

const ROLE_OF_PORTAL = { app: 'client', coach: 'coach', admin: 'admin' };

/**
 * App real: exige sesión contra el backend y el rol correspondiente.
 */
function ProtectedRoute({ children, requireAdmin = false, requireCoach = false }) {
  const { isAuthenticated, isAdmin, isCoach } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if ((requireAdmin && !isAdmin) || (requireCoach && !isCoach)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

/**
 * Demo (URL/demo/app | /demo/coach | /demo/admin): no requiere login. Si no hay una sesión demo
 * con el rol de ese portal, la crea en el momento. Nunca toca la sesión de la app real.
 */
function DemoGate({ portal, children }) {
  const { user, loginDemo } = useAuth();
  const role = ROLE_OF_PORTAL[portal];
  const ready = !!user && user.role === role;

  useEffect(() => {
    if (!ready) loginDemo(role);
  }, [ready, role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  return children;
}

/** Rutas internas de los tres portales; se montan una vez para la app real y otra bajo /demo. */
function portalRoutes(demo) {
  const p = portalPaths(demo);
  const wrap = (portal, layout, opts = {}) =>
    demo ? <DemoGate portal={portal}>{layout}</DemoGate> : <ProtectedRoute {...opts}>{layout}</ProtectedRoute>;

  return (
    <>
      {/* Portal del socio */}
      <Route path="app" element={wrap('app', <ClientLayout />)}>
        <Route index element={<Navigate to={p.appDashboard} replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="reservas" element={<BookCourtPage />} />
        <Route path="torneos" element={<ClientTournamentsPage />} />
        <Route path="ligas" element={<ClientLeaguesPage />} />
        <Route path="clases" element={<ClientClassesPage />} />
        <Route path="clases-particulares" element={<ClientPrivateLessonsPage />} />
        <Route path="mis-pagos" element={<ClientPaymentsPage />} />
      </Route>

      {/* Panel de administración */}
      <Route path="admin" element={wrap('admin', <AdminLayout />, { requireAdmin: true })}>
        <Route index element={<AdminDashboard />} />
        <Route path="canchas" element={<CourtsManagementPage />} />
        <Route path="tipos-cancha" element={<CourtTypesPage />} />
        <Route path="horarios" element={<CourtAvailabilityPage />} />
        <Route path="reservas" element={<ReservationsManagementPage />} />
        <Route path="stock" element={<StockManagementPage />} />
        <Route path="torneos" element={<TournamentsManagementPage />} />
        <Route path="ligas" element={<LeaguesManagementPage />} />
        <Route path="enfrentamientos" element={<MatchesManagementPage />} />
        <Route path="tipos-competencia" element={<CompetitionTypesPage />} />
        <Route path="profesionales" element={<CoachesManagementPage />} />
        <Route path="clases" element={<ClassesManagementPage />} />
        <Route path="asistencia" element={<AttendanceManagementPage />} />
        <Route path="turnos-particulares" element={<PrivateLessonsManagementPage />} />
        <Route path="profesores-clases" element={<Navigate to="../profesionales" replace />} />
        <Route path="caja" element={<CashierAndReceiptsPage />} />
        <Route path="facturas" element={<InvoicesPage />} />
        <Route path="reembolsos" element={<RefundsPage />} />
        <Route path="descuentos" element={<DiscountsPage />} />
        <Route path="usuarios" element={<UsersManagementPage />} />
        <Route path="reportes" element={<ReportsPage />} />
      </Route>

      {/* Panel profesor */}
      <Route path="coach" element={wrap('coach', <CoachLayout />, { requireCoach: true })}>
        <Route index element={<Navigate to={p.coachDashboard} replace />} />
        <Route path="dashboard" element={<CoachDashboard />} />
        <Route path="clases" element={<CoachClassesPage />} />
        <Route path="particulares" element={<CoachPrivateLessonsPage />} />
        <Route path="perfil" element={<CoachProfilePage />} />
        <Route path="certificacion" element={<CoachCertificationPage />} />
      </Route>
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* App real */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {portalRoutes(false)}

      {/* Demo, desacoplada de la app real */}
      <Route path="/demo" element={<DemoLandingPage />} />
      <Route path="/demo">{portalRoutes(true)}</Route>
      <Route path="/demo/*" element={<Navigate to="/demo" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedbackProvider>
          <AppRoutes />
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
