import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import PlaceMap from '../components/PlaceMap';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [homeData, setHomeData] = useState(null);
  const [livePlaces, setLivePlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHomeData = async () => {
    try {
      const [resHome, resLive] = await Promise.all([
        api.get('/home'),
        api.get('/locations/live')
      ]);
      setHomeData(resHome.data);
      setLivePlaces(resLive.data);
    } catch (err) {
      console.error('Failed to load home data:', err);
      setError('Could not load campus data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    // Auto-refresh every 30 seconds as per Section 5.2 (FR-HOME-2)
    const interval = setInterval(() => {
      fetchHomeData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading live campus dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  if (user?.role === 'organization') {
    return (
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="hero-banner">
          <h1>Organization Workspace</h1>
          <p style={{ marginTop: '0.4rem', opacity: 0.9 }}>
            Manage events, applicants, communities, venues, and campus collaborations.
          </p>
          <div className="hero-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {homeData?.orgs?.[0] && (
              <Link to={`/orgs/${homeData.orgs[0].id}/manage`} className="btn-hero">Manage Organization</Link>
            )}
            <Link to="/collab" className="btn-hero-outline">Find Collaborators</Link>
            <Link to="/map" className="btn-hero-outline">Find Venue</Link>
          </div>
        </div>

        <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
          {(homeData?.orgs || []).map((org) => (
            <div key={org.id} className="dash-card">
              <div className="dash-card-header">
                <h3>{org.name}</h3>
                <span className={`status-badge status-${org.status}`}>{org.status.toUpperCase()}</span>
              </div>
              {org.status === 'pending' ? (
                <p className="empty-state">Pending admin verification. Event publishing is not available yet.</p>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Verified organization. Publishing and collaboration tools are available.
                </p>
              )}
              <div className="org-stats-row" style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                <span>📅 <strong>{org.publishedEvents}</strong> Published Events</span>
                <span>📥 <strong>{org.pendingApplicants}</strong> Pending Applicants</span>
                <span>🤝 <strong>{org.pendingCollab}</strong> Collaboration Requests</span>
              </div>
              <Link
                to={`/orgs/${org.id}/manage`}
                className="btn-primary"
                style={{ marginTop: '1rem', textAlign: 'center' }}
              >
                Open Organization
              </Link>
            </div>
          ))}
        </div>

        <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
          <div className="dash-card">
            <div className="dash-card-header"><h3>Upcoming Events</h3><Link to="/events">See all</Link></div>
            {(homeData?.upcomingEvents || []).length === 0 ? (
              <p className="empty-state">No upcoming events yet.</p>
            ) : (
              <div className="dash-list">
                {homeData.upcomingEvents.map((evt) => (
                  <Link key={evt.id} to={`/events/${evt.id}`} className="dash-list-item">
                    <strong>{evt.title}</strong>
                    <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>View</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="dash-card">
            <div className="dash-card-header"><h3>Communities</h3><Link to="/communities">Open hub</Link></div>
            {(homeData?.myCommunities || []).length === 0 ? (
              <p className="empty-state">No joined communities.</p>
            ) : (
              <div className="dash-list">
                {homeData.myCommunities.map((community) => (
                  <Link key={community.id} to={`/communities/${community.id}`} className="dash-list-item">
                    <strong>{community.name}</strong>
                    <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>Open</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (user?.role === 'admin' && homeData?.pending) {
    return (
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="hero-banner">
          <h1>Admin Workspace 🛡️</h1>
          <p>KOLABORIN Moderation & Verification Overview</p>
          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/admin" className="btn-hero">Open Admin Panel</Link>
          </div>
        </div>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Pending Review Queue</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Pending Organizations</span>
            <span className="stat-val">🏛️ {homeData.pending.orgs}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending Place Requests</span>
            <span className="stat-val">📍 {homeData.pending.places}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending Badges</span>
            <span className="stat-val">🏅 {homeData.pending.badges}</span>
          </div>
        </div>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Platform Totals</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Registered Students</span>
            <span className="stat-val">👥 {homeData.totals.users}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Study Groups</span>
            <span className="stat-val">📚 {homeData.totals.groups}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Published Events</span>
            <span className="stat-val">📅 {homeData.totals.events}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- STUDENT / ORG OWNER VIEW ---
  const firstName = homeData?.me?.name ? homeData.me.name.split(' ')[0] : (user?.name?.split(' ')[0] || 'Student');
  const bp = homeData?.me?.badgeProgress || { subject: 'Database Systems', answers: 0, needed: 5 };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Hero Banner */}
      <div className="hero-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Hi, {firstName}! 👋</h1>
            <p style={{ marginTop: '0.4rem', opacity: 0.9 }}>
              🟢 <strong>{homeData?.summary?.peopleStudying || 0} people</strong> are studying right now across{' '}
              {homeData?.summary?.placesActive || 0} active campus places.
            </p>
          </div>
        </div>

        {/* 3 Quick Action Buttons */}
        <div className="hero-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/groups/new" className="btn-hero">➕ Create Study Group</Link>
          <Link to="/map" className="btn-hero-outline">🔍 Find Place</Link>
          <Link to="/map?request=1" className="btn-hero-outline">📍 Request a Place</Link>
        </div>
      </div>

      {/* Org Owner Section (If owns any organizations) */}
      {homeData?.orgs && homeData.orgs.length > 0 && (
        <div className="org-owner-banner" style={{ marginTop: '1.5rem' }}>
          {homeData.orgs.map((org) => (
            <div key={org.id} className="org-owner-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏛️ {org.name}
                    <span className={`status-badge status-${org.status}`}>
                      {org.status.toUpperCase()}
                    </span>
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    {org.status === 'pending'
                      ? '⚠️ Pending admin verification: you cannot publish events yet.'
                      : '✅ Verified Organization: all publishing & collaboration features unlocked.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/orgs/${org.id}/manage`} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    Manage Organization
                  </Link>
                </div>
              </div>
              <div className="org-stats-row" style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                <span>📅 <strong>{org.publishedEvents}</strong> Published Events</span>
                <span>📥 <strong>{org.pendingApplicants}</strong> Pending Applicants</span>
                <span>🤝 <strong>{org.pendingCollab}</strong> Collab Requests</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Stats Row (3 Cards) */}
      <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Points</span>
          <span className="stat-val">⭐ {homeData?.me?.points ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Leaderboard Rank</span>
          <span className="stat-val">#{homeData?.me?.rank > 0 ? homeData.me.rank : '-'}</span>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Badge Progress ({bp.subject})</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{bp.answers} / {bp.needed} answers</span>
          </div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (bp.answers / bp.needed) * 100)}%` }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            {bp.needed - bp.answers > 0
              ? `${bp.needed - bp.answers} more answers to earn expert badge`
              : 'Eligible for Expert Badge approval!'}
          </span>
        </div>
      </div>

      {/* 3. Live Map Preview Card (Full Width) */}
      <div className="map-preview-card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3>🗺️ Live Campus Activity Map</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {homeData?.summary?.peopleStudying || 0} people studying across {livePlaces.length} campus spots
            </p>
          </div>
          <Link to="/map" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Open full map ↗
          </Link>
        </div>

        {/* Mini Map Container */}
        <div
          className="mini-map-box"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            // If click wasn't on a marker pin, navigate to full map
            if (!e.target.closest('.custom-map-marker')) {
              navigate('/map');
            }
          }}
        >
          <PlaceMap
            mini={true}
            places={livePlaces}
            onSelect={(placeId) => {
              navigate(`/map?place=${placeId}`);
            }}
          />
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Hover pins for details • Click any spot to see open study groups
          </span>
          <Link to="/map" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            Open Full Map →
          </Link>
        </div>
      </div>

      {/* 4. Card Grid: Busiest now, Groups, Events, Communities, Top 3 */}
      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        {/* Busiest places now */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>🔥 Busiest Spots Now</h4>
            <Link to="/map">See all</Link>
          </div>
          {homeData?.busiestPlaces?.length === 0 ? (
            <p className="empty-state">No active study places right now.</p>
          ) : (
            <div className="dash-list">
              {homeData?.busiestPlaces?.map((place) => (
                <div
                  key={place.id}
                  className="dash-list-item clickable"
                  onClick={() => navigate(`/map?place=${place.id}`)}
                >
                  <div>
                    <strong>{place.name}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{place.short_description}</p>
                  </div>
                  <span className="live-headcount-badge">
                    🟢 {place.active_people}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Groups for you */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>👥 Groups for You</h4>
            <Link to="/party">See all</Link>
          </div>
          {homeData?.recommendedGroups?.length === 0 ? (
            <p className="empty-state">No upcoming groups. Create one in Open Party!</p>
          ) : (
            <div className="dash-list">
              {homeData?.recommendedGroups?.map((group) => (
                <div key={group.id} className="dash-list-item">
                  <div>
                    <span className="tag-subject">{group.subject}</span>
                    <strong style={{ display: 'block', marginTop: '0.2rem' }}>{group.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      📍 {group.location_name} • {group.members}/{group.max_members} joined
                    </span>
                  </div>
                  <Link to={`/groups/${group.id}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>📅 Upcoming Events</h4>
            <Link to="/events">See all</Link>
          </div>
          {homeData?.upcomingEvents?.length === 0 ? (
            <p className="empty-state">No published upcoming events yet.</p>
          ) : (
            <div className="dash-list">
              {homeData?.upcomingEvents?.map((evt) => (
                <div key={evt.id} className="dash-list-item">
                  <div>
                    <strong>{evt.title}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>By {evt.org_name}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
                      🕒 {new Date(evt.start_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Link to={`/events/${evt.id}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                    {evt.myStatus ? evt.myStatus.toUpperCase() : 'Apply'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My communities */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>💬 My Communities</h4>
            <Link to="/communities">See all</Link>
          </div>
          {homeData?.myCommunities?.length === 0 ? (
            <p className="empty-state">You haven't joined any communities yet.</p>
          ) : (
            <div className="dash-list">
              {homeData?.myCommunities?.map((c) => (
                <div
                  key={c.id}
                  className="dash-list-item clickable"
                  onClick={() => navigate(`/communities/${c.id}`)}
                >
                  <div>
                    <strong>{c.name}</strong>
                    {c.lastMessage ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {c.lastMessage.author}: {c.lastMessage.content}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No messages yet</p>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Chat →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 3 This Week */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h4>🏆 Top Students</h4>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>
          <div className="dash-list">
            {homeData?.top3?.map((st, idx) => (
              <div key={idx} className="dash-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 800, color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : '#b45309' }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <strong>{st.name}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>{st.faculty}</span>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  ⭐ {st.total_points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
