import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import RequestForm from './pages/public/RequestForm'
import LoginPage from './pages/public/LoginPage'

// Admin Layout & Pages
import AdminLayout from './components/layout/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Requests from './pages/admin/Requests'
import RequestDetail from './pages/admin/RequestDetail'
import Inventory from './pages/admin/Inventory'
import Quotations from './pages/admin/Quotations'
import AdminKYC from './pages/admin/AdminKYC'
import Logistics from './pages/admin/Logistics'
import Returns from './pages/admin/Returns'
import Billing from './pages/admin/Billing'
import AdminSupport from './pages/admin/AdminSupport'

// Client Layout & Pages
import ClientLayout from './components/layout/ClientLayout'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientRequests from './pages/client/ClientRequests'
import ClientRequestDetail from './pages/client/ClientRequestDetail'
import ClientKYC from './pages/client/ClientKYC'
import ClientBilling from './pages/client/ClientBilling'
import ClientSupport from './pages/client/ClientSupport'

// Loading spinner
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

// Smart redirect based on role
function RoleRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/client/dashboard" replace />
}

// Admin-only guard
function AdminGuard({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/client/dashboard" replace />
  return children
}

// Client-only guard (authenticated but not admin)
function ClientGuard({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return children
}

// Redirect logged-in users away from login
function LoginGuard({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (user) {
    if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (profile) return <Navigate to="/client/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/request" element={<RequestForm />} />
      <Route path="/login" element={
        <LoginGuard><LoginPage /></LoginGuard>
      } />

      {/* Smart role redirect */}
      <Route path="/redirect" element={<RoleRedirect />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <AdminGuard><AdminLayout /></AdminGuard>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="requests" element={<Requests />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="kyc" element={<AdminKYC />} />
        <Route path="logistics" element={<Logistics />} />
        <Route path="returns" element={<Returns />} />
        <Route path="billing" element={<Billing />} />
        <Route path="support" element={<AdminSupport />} />
      </Route>

      {/* Client routes */}
      <Route path="/client" element={
        <ClientGuard><ClientLayout /></ClientGuard>
      }>
        <Route index element={<Navigate to="/client/dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="requests" element={<ClientRequests />} />
        <Route path="requests/:id" element={<ClientRequestDetail />} />
        <Route path="kyc" element={<ClientKYC />} />
        <Route path="billing" element={<ClientBilling />} />
        <Route path="support" element={<ClientSupport />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

