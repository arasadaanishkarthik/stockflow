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

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
                  <Route index element={<OverviewPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="receipts" element={<ReceiptsPage />} />
                  <Route path="dashboard/receipts" element={<Navigate to="/receipts" replace />} />
                  <Route path="deliveries" element={<DeliveriesPage />} />
                  <Route path="dashboard/deliveries" element={<Navigate to="/deliveries" replace />} />
                  <Route path="transfers" element={<InternalTransfersPage />} />
                  <Route path="adjustments" element={<AdjustmentsPage />} />
                  <Route path="ledger" element={<MoveHistoryPage />} />
                  <Route path="warehouses" element={<WarehousesPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
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
