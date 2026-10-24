import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { portalPaths } from './hooks/usePortalPaths';

// Layouts
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';
import CoachLayout from './components/layout/CoachLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DemoLandingPage from './pages/demo/DemoLandingPage';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import BookCourtPage from './pages/client/BookCourtPage';
import ClientTournamentsPage from './pages/client/ClientTournamentsPage';
import ClientClassesPage from './pages/client/ClientClassesPage';
import ClientPaymentsPage from './pages/client/ClientPaymentsPage';

// Coach Pages
import CoachDashboard from './pages/coach/CoachDashboard';
import CoachClassesPage from './pages/coach/CoachClassesPage';
import CoachPrivateLessonsPage from './pages/coach/CoachPrivateLessonsPage';
import CoachProfilePage from './pages/coach/CoachProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CourtsManagementPage from './pages/admin/CourtsManagementPage';
import ReservationsManagementPage from './pages/admin/ReservationsManagementPage';
import StockManagementPage from './pages/admin/StockManagementPage';
import TournamentsManagementPage from './pages/admin/TournamentsManagementPage';
import CoachesAndClassesPage from './pages/admin/CoachesAndClassesPage';
import CashierAndReceiptsPage from './pages/admin/CashierAndReceiptsPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import ReportsPage from './pages/admin/ReportsPage';

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
        <Route path="clases" element={<ClientClassesPage />} />
        <Route path="mis-pagos" element={<ClientPaymentsPage />} />
      </Route>

      {/* Panel de administración */}
      <Route path="admin" element={wrap('admin', <AdminLayout />, { requireAdmin: true })}>
        <Route index element={<AdminDashboard />} />
        <Route path="canchas" element={<CourtsManagementPage />} />
        <Route path="reservas" element={<ReservationsManagementPage />} />
        <Route path="stock" element={<StockManagementPage />} />
        <Route path="torneos" element={<TournamentsManagementPage />} />
        <Route path="profesores-clases" element={<CoachesAndClassesPage />} />
        <Route path="caja" element={<CashierAndReceiptsPage />} />
        <Route path="usuarios" element={<UsersManagementPage />} />
        <Route path="reportes" element={<ReportsPage />} />
      </Route>

      {/* Panel docente */}
      <Route path="coach" element={wrap('coach', <CoachLayout />, { requireCoach: true })}>
        <Route index element={<Navigate to={p.coachDashboard} replace />} />
        <Route path="dashboard" element={<CoachDashboard />} />
        <Route path="clases" element={<CoachClassesPage />} />
        <Route path="particulares" element={<CoachPrivateLessonsPage />} />
        <Route path="perfil" element={<CoachProfilePage />} />
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
