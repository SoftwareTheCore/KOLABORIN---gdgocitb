import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { strings } from '../strings';

export default function Navbar({ sidebarCollapsed = false, onToggleSidebar = () => {} }) {
  const { user, extra, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
    setMobileOpen(false);
  };

  const primaryOrg = extra?.ownedOrgs?.[0];
  const isPublicPage = ['/login', '/register'].includes(location.pathname);
  if (isPublicPage || (!user && location.pathname === '/')) return null;

  const closeMenu = () => setMobileOpen(false);
  const navLink = (to, label, icon, end = false) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
      onClick={closeMenu}
      title={sidebarCollapsed ? label : undefined}
    >
      <span className="material-symbols-outlined sidebar-link-icon" aria-hidden="true">{icon}</span>
      <span className="sidebar-link-label">{label}</span>
    </NavLink>
  );

  return (
    <>
      <aside
        className={`app-sidebar${mobileOpen ? ' is-open' : ''}${sidebarCollapsed ? ' is-collapsed' : ''}`}
        aria-label="Navigasi dashboard"
        data-collapsed={sidebarCollapsed}
      >
        <div className="app-sidebar-header">
          <Link to="/" className="nav-brand" onClick={closeMenu}>
            <span className="nav-brand-mark" aria-hidden="true">K</span>
            <span className="nav-brand-copy">KOLABORIN</span>
          </Link>
          <button
            type="button"
            className="sidebar-toggle desktop-sidebar-toggle"
            aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-sidebar-menu"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {sidebarCollapsed ? 'left_panel_open' : 'left_panel_close'}
            </span>
          </button>
          <button
            type="button"
            className="sidebar-toggle mobile-sidebar-toggle"
            aria-label={mobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar-menu"
            onClick={() => setMobileOpen((open) => !open)}
            title={mobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        <div className="app-sidebar-menu" id="app-sidebar-menu">
          <nav className="sidebar-links" aria-label="Menu utama">
            {user?.role === 'student' && (
              <section className="sidebar-section" role="group" aria-label="Workspace">
                <div className="sidebar-section-heading" aria-hidden="true">Workspace</div>
                {navLink('/', strings.nav.home, 'home', true)}
                {navLink('/map', strings.nav.map, 'radar')}
                {navLink('/party', strings.nav.party, 'group_add')}
                {navLink('/communities', strings.nav.communities, 'forum')}
                {navLink('/events', strings.nav.events, 'event')}
                {navLink('/leaderboard', strings.nav.leaderboard, 'leaderboard')}
              </section>
            )}
            {user?.role === 'organization' && (
              <>
                <section className="sidebar-section" role="group" aria-label="Workspace">
                  <div className="sidebar-section-heading" aria-hidden="true">Workspace</div>
                  {navLink('/', strings.nav.home, 'home', true)}
                </section>
                <section className="sidebar-section" role="group" aria-label="Organisasi">
                  <div className="sidebar-section-heading" aria-hidden="true">Organisasi</div>
                  {primaryOrg ? (
                    <>
                      {navLink(`/orgs/${primaryOrg.id}/events`, 'Event & Workshop', 'event')}
                      {navLink(`/orgs/${primaryOrg.id}/recruitment`, 'Rekrutmen', 'group_add')}
                      {navLink(`/orgs/${primaryOrg.id}/live-spot`, 'Ruang & Venue', 'meeting_room')}
                      {navLink(`/orgs/${primaryOrg.id}/settings`, 'Pengaturan Organisasi', 'settings')}
                    </>
                  ) : (
                    <>
                      {navLink('/orgs/new', 'Daftarkan Organisasi', 'domain_add')}
                      {navLink('/map', strings.nav.map, 'radar')}
                    </>
                  )}
                </section>
              </>
            )}
            {user?.role === 'admin' && (
              <section className="sidebar-section" role="group" aria-label="Platform">
                <div className="sidebar-section-heading" aria-hidden="true">Platform</div>
                {navLink('/', strings.nav.home, 'home', true)}
                {navLink('/map', strings.nav.map, 'radar')}
                {navLink('/admin', strings.nav.admin, 'admin_panel_settings')}
              </section>
            )}
          </nav>

          <div className="app-sidebar-footer">
            {user?.role === 'student' && (
              <>
                <form className="nav-search" role="search" onSubmit={handleSearch}>
                  <span className="material-symbols-outlined" aria-hidden="true">search</span>
                  <input
                    type="search"
                    aria-label="Cari study group"
                    placeholder="Cari study group..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </form>
                <div className="points-pill" title={`${user.total_points ?? 0} poin`}>
                  <span className="material-symbols-outlined sidebar-link-icon" aria-hidden="true">stars</span>
                  <span className="sidebar-link-label">{user.total_points ?? 0} pts</span>
                </div>
              </>
            )}
            <Link
              to="/profile"
              className="profile-link"
              onClick={closeMenu}
              title={sidebarCollapsed ? user?.name : undefined}
            >
              <span className="nav-avatar" aria-hidden="true">
                {user?.avatar_data ? <img src={user.avatar_data} alt="" /> : user?.name?.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <span className="nav-profile-copy">
                <strong>{user?.name}</strong>
                <small>{user?.email || user?.faculty || user?.role}</small>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-logout"
              aria-label={strings.nav.logout}
              title={sidebarCollapsed ? strings.nav.logout : undefined}
            >
              <span className="material-symbols-outlined sidebar-link-icon" aria-hidden="true">logout</span>
              <span className="sidebar-link-label">{strings.nav.logout}</span>
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          type="button"
          className="app-sidebar-scrim"
          aria-label="Tutup navigasi"
          onClick={closeMenu}
        />
      )}
    </>
  );
}
