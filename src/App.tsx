import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { Home } from './pages/Home';
import { MatchDetail } from './pages/MatchDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SettingsEditor } from './pages/admin/SettingsEditor';
import { MatchEditor } from './pages/admin/MatchEditor';
import { MatchEvents } from './pages/admin/matches/MatchEvents';
import { MatchEditPage } from './pages/admin/MatchEditPage';
import { PlayerDashboard } from './pages/player/PlayerDashboard';
import { PlayerRateMatch } from './pages/player/PlayerRateMatch';

// Route Guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isOwner } = useAuth();
  if (!isOwner) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PlayerRoute = ({ children }: { children: React.ReactNode }) => {
  const { isPlayer } = useAuth();
  if (!isPlayer) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AnyAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) {
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
        <Route path="register" element={<Register />} />

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

        <Route path="admin/matches/:id/edit" element={
          <ProtectedRoute>
            <MatchEditPage />
          </ProtectedRoute>
        } />

        <Route path="admin/matches/:id/rate" element={
          <AnyAuthRoute>
            <PlayerRateMatch />
          </AnyAuthRoute>
        } />

        {/* Protected Player Routes */}
        <Route path="player" element={
          <PlayerRoute>
            <PlayerDashboard />
          </PlayerRoute>
        } />

        <Route path="player/matches/:id/rate" element={
          <PlayerRoute>
            <PlayerRateMatch />
          </PlayerRoute>
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
