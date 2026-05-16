/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { Withdrawals } from './components/Withdrawals';
import { AdminDashboard } from './components/AdminDashboard';
import { Offerwall } from './components/Offerwall';
import { Referrals } from './components/Referrals';
import { ProtectedRoute } from './components/ProtectedRoute';
import History from './pages/History';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/withdraw" 
              element={
                <ProtectedRoute>
                  <Withdrawals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/offerwall" 
              element={
                <ProtectedRoute>
                  <Offerwall />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referrals" 
              element={
                <ProtectedRoute>
                  <Referrals />
                </ProtectedRoute>
              } 
            />
            <Route
  path="/history"
  element={
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  }
/>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
