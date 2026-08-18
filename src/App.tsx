import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getSession, canAccess, initAuth } from './auth'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import ScannerPage from './pages/ScannerPage'
import StatsPage from './pages/StatsPage'
import ParticipantsPage from './pages/ParticipantsPage'
import LoginPage from './pages/LoginPage'
import BulkCardPage from './pages/BulkCardPage'
import StaffPage from './pages/StaffPage'

initAuth()

function ProtectedRoute({ page, children }: { page: string; children: React.ReactNode }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  if (!canAccess(page)) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const session = getSession()
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

function PageTitle() {
  const location = useLocation()
  const titles: Record<string, string> = {
    '/': 'Home',
    '/register': 'Register',
    '/scan': 'Scan',
    '/stats': 'Stats',
    '/participants': 'Participants',
    '/cards': 'Bulk Cards',
  }
  const title = titles[location.pathname] || ''
  return title ? <title>{title} — HKC</title> : null
}

export default function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute page="/">
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute page="/register">
                <RegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register/:id"
            element={
              <ProtectedRoute page="/register">
                <RegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute page="/scan">
                <ScannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute page="/stats">
                <StatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participants"
            element={
              <ProtectedRoute page="/participants">
                <ParticipantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cards"
            element={
              <ProtectedRoute page="/cards">
                <BulkCardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute page="/staff">
                <StaffPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
