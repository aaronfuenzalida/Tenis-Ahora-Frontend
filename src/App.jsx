import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import BookCourtPage from './pages/client/BookCourtPage';
import ClientTournamentsPage from './pages/client/ClientTournamentsPage';
import ClientClassesPage from './pages/client/ClientClassesPage';
import ClientPaymentsPage from './pages/client/ClientPaymentsPage';

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

// Protected Route helper (permits exploration or auto-routes)
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default entry: Welcoming login screen */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Client Portal Routes (/app) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="reservas" element={<BookCourtPage />} />
            <Route path="torneos" element={<ClientTournamentsPage />} />
            <Route path="clases" element={<ClientClassesPage />} />
            <Route path="mis-pagos" element={<ClientPaymentsPage />} />
          </Route>

          {/* Administration Portal Routes (/admin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
