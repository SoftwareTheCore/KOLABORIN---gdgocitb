import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from './Logo';
import { strings } from '../strings';

export default function Navbar() {
  const { user, extra, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasOrgs = user?.role !== 'admin' && extra?.ownedOrgs && extra.ownedOrgs.length > 0;
  const isPublicPage = ['/login', '/register'].includes(location.pathname);
  if (isPublicPage || (!user && location.pathname === '/')) return null;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-brand">
          <Logo height={32} />
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            {strings.nav.home}
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => (isActive ? 'active' : '')}>
            {strings.nav.map}
          </NavLink>
          {user?.role === 'student' && (
            <>
              <NavLink to="/party" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.party}
              </NavLink>
              <NavLink to="/communities" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.communities}
              </NavLink>
              <NavLink to="/events" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.events}
              </NavLink>
              <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.leaderboard}
              </NavLink>
            </>
          )}
          {user?.role === 'organization' && (
            <>
              <NavLink to="/events" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.events}
              </NavLink>
              <NavLink to="/communities" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.communities}
              </NavLink>
            </>
          )}
          {hasOrgs && (
            <NavLink to={`/orgs/${extra.ownedOrgs[0].id}/manage`} className={({ isActive }) => (isActive ? 'active' : '')}>
              {strings.nav.myOrg}
            </NavLink>
          )}
          {hasOrgs && (
            <NavLink to="/collab" className={({ isActive }) => (isActive ? 'active' : '')}>
              {strings.nav.collab}
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              {strings.nav.admin}
            </NavLink>
          )}
        </div>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            {user.role === 'student' && (
              <div className="points-pill" title="Total Points">
                ⭐ {user.total_points ?? 0} pts
              </div>
            )}
            <Link to="/profile" className="profile-link">
              👤 {user.name}
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              {strings.nav.logout}
            </button>
          </>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="btn-secondary">
              {strings.nav.login}
            </Link>
            <Link to="/register" className="btn-primary">
              {strings.nav.register}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
