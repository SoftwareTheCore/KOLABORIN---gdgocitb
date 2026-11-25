import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { strings } from '../strings';

export default function Navbar() {
  const { user, extra, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;
    navigate(`/party?search=${encodeURIComponent(query)}`);
    setSearchTerm('');
  };

  const primaryOrg = extra?.ownedOrgs?.[0];
  const isPublicPage = ['/login', '/register'].includes(location.pathname);
  if (isPublicPage || (!user && location.pathname === '/')) return null;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-mark" aria-hidden="true">K</span>
          <span>KOLABORIN</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            {strings.nav.home}
          </NavLink>
          {user?.role === 'student' && (
            <>
              <NavLink to="/map" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.map}
              </NavLink>
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
              {primaryOrg ? (
                <>
                  <NavLink to={`/orgs/${primaryOrg.id}/events`} className={({ isActive }) => (isActive ? 'active' : '')}>
                    Event &amp; Workshop
                  </NavLink>
                  <NavLink to={`/orgs/${primaryOrg.id}/recruitment`} className={({ isActive }) => (isActive ? 'active' : '')}>
                    Rekrutmen
                  </NavLink>
                  <NavLink to={`/orgs/${primaryOrg.id}/live-spot`} className={({ isActive }) => (isActive ? 'active' : '')}>
                    Live Spot
                  </NavLink>
                  <NavLink to={`/orgs/${primaryOrg.id}/settings`} className={({ isActive }) => (isActive ? 'active' : '')}>
                    Pengaturan Organisasi
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/orgs/new" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Daftarkan Organisasi
                  </NavLink>
                  <NavLink to="/map" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Live Spot
                  </NavLink>
                </>
              )}
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <NavLink to="/map" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.map}
              </NavLink>
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
                {strings.nav.admin}
              </NavLink>
            </>
          )}
        </div>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            {user.role === 'student' && (
              <form className="nav-search" role="search" onSubmit={handleSearch}>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  aria-label="Cari study group"
                  placeholder="Cari topik atau teman..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <kbd>⌘K</kbd>
              </form>
            )}
            {user.role === 'student' && (
              <div className="points-pill" title="Total Points">
                ⭐ {user.total_points ?? 0} pts
              </div>
            )}
            <Link to="/profile" className="profile-link">
              <span className="nav-avatar" aria-hidden="true">
                {user.name?.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <span className="nav-profile-copy">
                <strong>{user.name}</strong>
                <small>{user.faculty || user.role}</small>
              </span>
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
