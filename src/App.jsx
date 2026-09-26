import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

import { OverviewPage } from './pages/dashboard/OverviewPage';
import { ProductsPage } from './pages/dashboard/ProductsPage';
import { ReceiptsPage } from './pages/dashboard/ReceiptsPage';
import { DeliveriesPage } from './pages/dashboard/DeliveriesPage';
import { InternalTransfersPage } from './pages/dashboard/InternalTransfersPage';
import { AdjustmentsPage } from './pages/dashboard/AdjustmentsPage';
import { MoveHistoryPage } from './pages/dashboard/MoveHistoryPage';
import { WarehousesPage } from './pages/dashboard/WarehousesPage';
import { AlertsPage } from './pages/dashboard/AlertsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { NotFoundPage } from './pages/dashboard/NotFoundPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { SmartReorderPage } from './pages/dashboard/SmartReorderPage';
import { AccessDeniedPage } from './pages/dashboard/AccessDeniedPage';

// Protected Route Wrapper for Authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Role-Based Protected Route Wrapper for Management Features
const RoleProtectedRoute = ({ children, allowedRoles = ['manager'] }) => {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(userRole)) {
    return <AccessDeniedPage requiredRole="Inventory Manager" />;
  }
  return children;
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <InventoryProvider>
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Dashboard Layout Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Common Routes for Manager & Warehouse Staff */}
                  <Route index element={<OverviewPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="receipts" element={<ReceiptsPage />} />
                  <Route path="deliveries" element={<DeliveriesPage />} />
                  <Route path="transfers" element={<InternalTransfersPage />} />
                  <Route path="adjustments" element={<AdjustmentsPage />} />
                  <Route path="ledger" element={<MoveHistoryPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="profile" element={<ProfilePage />} />

                  {/* Management Only Routes (Protected for Manager) */}
                  <Route
                    path="analytics"
                    element={
                      <RoleProtectedRoute allowedRoles={['manager']}>
                        <AnalyticsPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="reorder"
                    element={
                      <RoleProtectedRoute allowedRoles={['manager']}>
                        <SmartReorderPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="warehouses"
                    element={
                      <RoleProtectedRoute allowedRoles={['manager']}>
                        <WarehousesPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <RoleProtectedRoute allowedRoles={['manager']}>
                        <SettingsPage />
                      </RoleProtectedRoute>
                    }
                  />

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </InventoryProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

