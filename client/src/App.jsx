import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute, { StudentRoute, VerifiedOrgRoute } from './auth/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import MapPage from './pages/MapPage';
import Party from './pages/Party';
import NewGroup from './pages/NewGroup';
import GroupDetail from './pages/GroupDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import OrgNew from './pages/OrgNew';
import OrgDetail from './pages/OrgDetail';
import OrgManage from './pages/OrgManage';
import OrgEventWorkspace from './pages/OrgEventWorkspace';
import Communities from './pages/Communities';
import CommunityRoom from './pages/CommunityRoom';
import Leaderboard from './pages/Leaderboard';
import Collab from './pages/Collab';
import Admin from './pages/Admin';
import Landing from './pages/Landing';
import { useAuth } from './auth/AuthContext';

const OrgLiveSpot = lazy(() => import('./pages/OrgLiveSpot'));

function LandingOrHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={<LandingOrHome />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            }
          />

          {/* M3 Map & Study Groups */}
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/party"
            element={
              <StudentRoute>
                <Party />
              </StudentRoute>
            }
          />
          <Route
            path="/groups/new"
            element={
              <StudentRoute>
                <NewGroup />
              </StudentRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute allowedRoles={['student', 'organization']}>
                <GroupDetail />
              </ProtectedRoute>
            }
          />

          {/* M4 Organizations & Events */}
          <Route
            path="/events"
            element={
              <ProtectedRoute allowedRoles={['student', 'organization']}>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute allowedRoles={['student', 'organization']}>
                <EventDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orgs/new"
            element={
              <ProtectedRoute>
                <OrgNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orgs/:id"
            element={
              <ProtectedRoute>
                <OrgDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orgs/:id/manage"
            element={
              <ProtectedRoute>
                <OrgManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orgs/:id/settings"
            element={
              <ProtectedRoute allowedRoles={['organization']}>
                <OrgManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orgs/:id/events"
            element={
              <ProtectedRoute allowedRoles={['organization']}>
                <OrgEventWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orgs/:id/recruitment"
            element={
              <ProtectedRoute allowedRoles={['organization']}>
                <OrgEventWorkspace mode="recruitment" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orgs/:id/live-spot"
            element={
              <ProtectedRoute allowedRoles={['organization']}>
                <Suspense fallback={<main className="container"><p className="empty-state">Memuat Live Spot organisasi...</p></main>}>
                  <OrgLiveSpot />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* M5 Community Hub & Chat */}
          <Route
            path="/communities"
            element={
              <ProtectedRoute allowedRoles={['student', 'organization']}>
                <Communities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities/:id"
            element={
              <ProtectedRoute allowedRoles={['student', 'organization']}>
                <CommunityRoom />
              </ProtectedRoute>
            }
          />

          {/* M6 Leaderboard */}
          <Route
            path="/leaderboard"
            element={
              <StudentRoute>
                <Leaderboard />
              </StudentRoute>
            }
          />

          {/* M7 Collaboration (P2) */}
          <Route
            path="/collab"
            element={
              <VerifiedOrgRoute>
                <Collab />
              </VerifiedOrgRoute>
            }
          />

          {/* M4 Admin Panel (Admin role only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
