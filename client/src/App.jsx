import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute, { StudentRoute, VerifiedOrgRoute } from './auth/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import { useAuth } from './auth/AuthContext';
import { PageSkeleton } from './components/LoadingSkeleton';

const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const OrganizationProfile = lazy(() => import('./pages/OrganizationProfile'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Party = lazy(() => import('./pages/Party'));
const NewGroup = lazy(() => import('./pages/NewGroup'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const OrgNew = lazy(() => import('./pages/OrgNew'));
const OrgDetail = lazy(() => import('./pages/OrgDetail'));
const OrgManage = lazy(() => import('./pages/OrgManage'));
const OrgEventWorkspace = lazy(() => import('./pages/OrgEventWorkspace'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityRoom = lazy(() => import('./pages/CommunityRoom'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Collab = lazy(() => import('./pages/Collab'));
const Admin = lazy(() => import('./pages/Admin'));
const OrgLiveSpot = lazy(() => import('./pages/OrgLiveSpot'));

function LandingOrHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  return <Home />;
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isOrganizationProfile = location.pathname === '/organization-profile';
  const hasSidebar = Boolean(user) && !['/login', '/register', '/organization-profile'].includes(location.pathname);

  return (
    <div className={`app-layout${hasSidebar ? ' has-sidebar' : ''}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {!isOrganizationProfile && (
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
      )}
      <div className="app-content">
        <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/organization-profile" element={<OrganizationProfile />} />

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
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
