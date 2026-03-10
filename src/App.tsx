import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { Home } from './pages/Home';
import { MatchDetail } from './pages/MatchDetail';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SettingsEditor } from './pages/admin/SettingsEditor';
import { MatchEditor } from './pages/admin/MatchEditor';
import { MatchEvents } from './pages/admin/matches/MatchEvents';

// Route Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isOwner } = useAuth();
  if (!isOwner) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="match/:id" element={<MatchDetail />} />
        <Route path="login" element={<Login />} />

        {/* Protected Owner Routes */}
        <Route path="admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="admin/settings" element={
          <ProtectedRoute>
            <SettingsEditor />
          </ProtectedRoute>
        } />

        <Route path="admin/matches/new" element={
          <ProtectedRoute>
            <MatchEditor />
          </ProtectedRoute>
        } />

        <Route path="admin/matches/:id/events" element={
          <ProtectedRoute>
            <MatchEvents />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
