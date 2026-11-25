import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import PlaceMap from '../components/PlaceMap';

const OrganizationTrendChart = lazy(() => import('../components/OrganizationTrendChart'));
const OrganizationEventChart = lazy(() => import('../components/OrganizationEventChart'));

function exportOrganizationReport(analytics) {
  const rows = [['Tanggal', 'Menunggu', 'Diterima', 'Ditolak']];
  const totalsByDate = new Map();
  analytics.forEach((organization) => {
    (organization.daily || []).forEach((row) => {
      const totals = totalsByDate.get(row.date) || { pending: 0, accepted: 0, rejected: 0 };
      totals.pending += row.pending;
      totals.accepted += row.accepted;
      totals.rejected += row.rejected;
      totalsByDate.set(row.date, totals);
    });
  });
  [...totalsByDate.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).forEach(([date, counts]) => {
    rows.push([date, counts.pending, counts.accepted, counts.rejected]);
  });

  const csv = `\uFEFF${rows.map((row) => row.join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kolaborin-organization-report.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [homeData, setHomeData] = useState(null);
  const [livePlaces, setLivePlaces] = useState([]);
  const [organizationAnalytics, setOrganizationAnalytics] = useState([]);
  const [organizationDataUpdatedAt, setOrganizationDataUpdatedAt] = useState(null);
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHomeData = async () => {
    try {
      const [resHome, resLive] = await Promise.all([
        api.get('/home'),
        api.get('/locations/live')
      ]);
      const orgAnalytics = user?.role === 'organization'
        ? await Promise.all((resHome.data.orgs || []).map(async (org) => {
          const resAnalytics = await api.get(`/orgs/${org.id}/analytics?days=${rangeDays}`);
          return {
            ...resAnalytics.data,
            orgId: org.id,
            orgName: org.name,
            orgStatus: org.status
          };
        }))
        : [];
      setHomeData(resHome.data);
      setLivePlaces(resLive.data);
      setOrganizationAnalytics(orgAnalytics);
      if (user?.role === 'organization') setOrganizationDataUpdatedAt(new Date());
    } catch (err) {
      console.error('Failed to load home data:', err);
      setError(err.response?.data?.error || 'Data Home tidak dapat dimuat. Silakan coba lagi.');
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
  }, [user?.role, rangeDays]);

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
    const orgs = homeData?.orgs || [];
    const organizationSummary = organizationAnalytics.reduce((summary, organization) => ({
      events: summary.events + organization.summary.publishedEvents,
      applications: summary.applications + organization.summary.applications,
      pending: summary.pending + organization.summary.pendingApplications,
      accepted: summary.accepted + organization.summary.acceptedApplications,
      rejected: summary.rejected + organization.summary.rejectedApplications
    }), { events: 0, applications: 0, pending: 0, accepted: 0, rejected: 0 });
    const applicationsByDate = new Map();
    organizationAnalytics.forEach((organization) => {
      (organization.daily || []).forEach((row) => {
        const total = applicationsByDate.get(row.date) || 0;
        applicationsByDate.set(row.date, total + row.pending + row.accepted + row.rejected);
      });
    });
    const dateAnchor = organizationAnalytics[0]?.today || new Date().toISOString().slice(0, 10);
    const trendData = Array.from({ length: rangeDays }, (_, index) => {
      const date = new Date(`${dateAnchor}T12:00:00`);
      date.setDate(date.getDate() - rangeDays + 1 + index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return {
        label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        applications: applicationsByDate.get(key) || 0
      };
    });
    const eventApplications = new Map();
    organizationAnalytics.forEach((organization) => {
      (organization.events || []).forEach((event) => {
        if (event.status !== 'published') return;
        const current = eventApplications.get(event.id) || {
          title: event.title,
          applications: 0
        };
        current.applications += event.application_count;
        eventApplications.set(event.id, current);
      });
    });
    const eventDistribution = [...eventApplications.entries()]
      .map(([id, event]) => ({
        id,
        label: event.title.length > 20 ? `${event.title.slice(0, 18)}…` : event.title,
        applications: event.applications
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 6);
    const recentApplications = organizationAnalytics
      .flatMap((organization) => (organization.recentApplications || []).map((application) => ({
        ...application,
        orgName: organization.orgName
      })))
      .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
      .slice(0, 6);
    const upcomingEvents = organizationAnalytics
      .flatMap((organization) => (organization.upcomingEvents || []).map((event) => ({
        ...event,
        orgName: organization.orgName
      })))
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
      .slice(0, 5);
    const hasVerifiedOrganization = orgs.some((org) => org.status === 'verified');
    const acceptanceRate = organizationSummary.applications
      ? Math.round((organizationSummary.accepted / organizationSummary.applications) * 100)
      : 0;
    const statusStages = [
      { label: 'Menunggu review', value: organizationSummary.pending, color: 'pending' },
      { label: 'Diterima', value: organizationSummary.accepted, color: 'accepted' },
      { label: 'Ditolak', value: organizationSummary.rejected, color: 'rejected' }
    ];

    return (
      <main className="container org-home-page org-executive-home" id="org-dashboard">
        <div className="org-home-status-banner">
          <span className={`org-home-status-pulse ${hasVerifiedOrganization ? '' : 'is-pending'}`} />
          <div>
            <strong>{hasVerifiedOrganization ? 'Workspace organisasi aktif' : 'Menunggu verifikasi organisasi'}</strong>
            <span>{orgs.length ? `${orgs.length} organisasi · ${organizationSummary.events} event dipublikasikan` : 'Daftarkan organisasi untuk mulai mengelola kegiatan kampus.'}</span>
          </div>
          <span className="org-home-auto-refresh">● Sinkron otomatis · 30 dtk</span>
          {orgs[0] && <Link to={`/orgs/${orgs[0].id}`}>Lihat profil publik ↗</Link>}
        </div>

        <nav className="org-home-tabs" aria-label="Navigasi workspace organisasi">
          <NavLink to="/" end>Home</NavLink>
          {orgs[0] && (
            <>
              <NavLink to={`/orgs/${orgs[0].id}/events`}>Event &amp; Workshop</NavLink>
              <NavLink to={`/orgs/${orgs[0].id}/recruitment`}>Rekrutmen</NavLink>
              <NavLink to={`/orgs/${orgs[0].id}/live-spot`}>Live Spot</NavLink>
              <NavLink to={`/orgs/${orgs[0].id}/settings`}>Pengaturan Organisasi</NavLink>
            </>
          )}
        </nav>

        <header className="org-executive-header">
          <div>
            <span className="eyebrow">Analisis eksekutif · {orgs[0]?.name || 'Organisasi kampus'}</span>
            <h1>Dashboard pertumbuhan &amp; analitik organisasi</h1>
            <p>Pantau tren pendaftaran event, respons aplikasi, dan aktivitas organisasi dari data aktual.</p>
          </div>
          <div className="org-executive-actions">
            <button type="button" className="btn-secondary" onClick={() => exportOrganizationReport(organizationAnalytics)} disabled={!organizationAnalytics.length}>
              ↓ Ekspor laporan
            </button>
            <button type="button" className="btn-secondary" onClick={fetchHomeData}>
              ↻ Perbarui data
            </button>
            {orgs[0] ? (
              <Link to={`/orgs/${orgs[0].id}/manage`} className="btn-primary">＋ Publikasikan event</Link>
            ) : (
              <Link to="/orgs/new" className="btn-primary">＋ Daftarkan organisasi</Link>
            )}
          </div>
        </header>

        {orgs.length === 0 ? (
          <div className="org-home-empty">
            <strong>Belum ada organisasi terhubung</strong>
            <p>Daftarkan organisasi kampus agar bisa mengelola event dan melihat analitik pendaftar.</p>
            <Link to="/orgs/new" className="btn-primary">Mulai pendaftaran</Link>
          </div>
        ) : (
          <>
            <section className="org-executive-kpis" aria-label="Metrik organisasi">
              <article className="org-executive-kpi">
                <div><span>Total pendaftar</span><i className="primary">↗</i></div>
                <strong>{organizationSummary.applications}</strong>
                <small>Akumulasi aplikasi event</small>
              </article>
              <article className="org-executive-kpi">
                <div><span>Menunggu review</span><i className="amber">◷</i></div>
                <strong>{organizationSummary.pending}</strong>
                <small>Perlu tindak lanjut</small>
              </article>
              <article className="org-executive-kpi">
                <div><span>Peserta diterima</span><i className="green">✓</i></div>
                <strong>{organizationSummary.accepted}</strong>
                <small>{acceptanceRate}% dari seluruh pendaftar</small>
              </article>
              <article className="org-executive-kpi">
                <div><span>Event dipublikasi</span><i className="lavender">▣</i></div>
                <strong>{organizationSummary.events}</strong>
                <small>{upcomingEvents.length} event mendatang</small>
              </article>
            </section>

            <section className="org-executive-analytics-grid">
              <article className="org-executive-card org-trend-card">
                <div className="org-executive-card-heading">
                  <div><h2>Tren pendaftaran peserta</h2><p>Jumlah aplikasi masuk per hari</p></div>
                  <div className="org-range-tabs" role="group" aria-label="Rentang waktu grafik">
                    {[7, 14, 30].map((days) => (
                      <button type="button" key={days} className={rangeDays === days ? 'active' : ''} onClick={() => setRangeDays(days)}>
                        {days}H
                      </button>
                    ))}
                  </div>
                </div>
                <div className="org-executive-chart">
                  <Suspense fallback={<div className="org-chart-placeholder">Memuat grafik...</div>}>
                    <OrganizationTrendChart data={trendData} />
                  </Suspense>
                </div>
                <div className="org-trend-footnote">
                  <span>{organizationSummary.applications} total pendaftar di semua organisasi</span>
                  <span>Periode {rangeDays} hari</span>
                </div>
              </article>

              <article className="org-executive-card org-application-status-card">
                <div className="org-executive-card-heading">
                  <div><h2>Status aplikasi</h2><p>Distribusi status pendaftar event</p></div>
                  <span className="org-neutral-chip">Semua event</span>
                </div>
                <div className="org-status-summary">
                  <strong>{organizationSummary.applications}</strong>
                  <span>Total pendaftar</span>
                </div>
                <div className="org-status-stages">
                  {statusStages.map((stage) => {
                    const percent = organizationSummary.applications
                      ? Math.round((stage.value / organizationSummary.applications) * 100)
                      : 0;
                    return (
                      <div className="org-status-stage" key={stage.label}>
                        <div><span><i className={stage.color} />{stage.label}</span><strong>{stage.value} <small>{percent}%</small></strong></div>
                        <div className="org-status-track"><span className={stage.color} style={{ width: `${percent}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
                <div className="org-acceptance-summary">
                  <span>Tingkat penerimaan</span><strong>{acceptanceRate}%</strong>
                </div>
              </article>
            </section>

            <section className="org-executive-lower-grid">
              <article className="org-executive-card org-distribution-card">
                <div className="org-executive-card-heading">
                  <div><h2>Pendaftar per event</h2><p>Event dengan aplikasi terbanyak</p></div>
                  <Link to="/events">Semua event →</Link>
                </div>
                {eventDistribution.length ? (
                  <div className="org-distribution-chart">
                    <Suspense fallback={<div className="org-chart-placeholder">Memuat grafik...</div>}>
                      <OrganizationEventChart data={eventDistribution} />
                    </Suspense>
                  </div>
                ) : (
                  <p className="org-executive-empty">Belum ada data pendaftar event.</p>
                )}
              </article>

              <div className="org-executive-activity-column">
                <article className="org-executive-card" id="recentApplications">
                  <div className="org-executive-card-heading">
                    <div><h2>Aktivitas pendaftar</h2><p>Aplikasi terbaru yang masuk</p></div>
                    <span className="org-neutral-chip">{recentApplications.length} terbaru</span>
                  </div>
                  {recentApplications.length ? (
                    <div className="org-recent-applications">
                      {recentApplications.map((application) => (
                        <Link to={`/events/${application.event_id}`} className="org-recent-application" key={`${application.orgName}-${application.id}`}>
                          <span className="org-applicant-avatar">{application.applicant_name?.trim().charAt(0).toUpperCase() || '?'}</span>
                          <span className="org-applicant-copy">
                            <strong>{application.applicant_name}</strong>
                            <small>{application.major || application.faculty || application.orgName} · {application.event_title}</small>
                          </span>
                          <span className={`org-application-badge ${application.status}`}>{application.status === 'pending' ? 'Menunggu' : application.status === 'accepted' ? 'Diterima' : 'Ditolak'}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="org-executive-empty">Aktivitas pendaftar akan tampil di sini setelah ada aplikasi.</p>
                  )}
                </article>

                <article className="org-executive-card org-upcoming-card">
                  <div className="org-executive-card-heading">
                    <div><h2>Agenda mendatang</h2><p>Event organisasi berikutnya</p></div>
                    <Link to="/events">Kalender →</Link>
                  </div>
                  {upcomingEvents.length ? (
                    <div className="org-upcoming-list">
                      {upcomingEvents.map((event) => (
                        <Link to={`/events/${event.id}`} className="org-upcoming-event" key={event.id}>
                          <span className="org-upcoming-date">
                            <strong>{new Date(event.start_at).toLocaleDateString('id-ID', { day: '2-digit' })}</strong>
                            <small>{new Date(event.start_at).toLocaleDateString('id-ID', { month: 'short' })}</small>
                          </span>
                          <span className="org-upcoming-copy">
                            <strong>{event.title}</strong>
                            <small>{event.orgName} · {event.location_name || 'Lokasi belum ditentukan'}</small>
                          </span>
                          <span className="org-event-arrow">→</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="org-executive-empty">Belum ada event mendatang yang dipublikasikan.</p>
                  )}
                </article>
              </div>
            </section>

            <footer className="org-executive-footer">
              <span><i />Data dari aplikasi event organisasi · pembaruan otomatis setiap 30 detik.</span>
              <span>{organizationDataUpdatedAt ? `Terakhir diperbarui ${organizationDataUpdatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Menunggu sinkronisasi data'}</span>
            </footer>
          </>
        )}
      </main>
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
    <div className="container home-page">
      <section className="home-context-card">
        <div className="home-context-copy">
          <div className="home-greeting-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="home-greeting-tags">
              <span className="eyebrow">{homeData?.me?.faculty || user?.faculty || 'Kampus ITB'}</span>
              <span className="home-live-pill"><span aria-hidden="true">●</span> Data kampus live</span>
            </div>
            <h1>Selamat datang, {firstName} 👋</h1>
            <p>{homeData?.summary?.peopleStudying || 0} mahasiswa sedang belajar di {livePlaces.length} lokasi kampus.</p>
          </div>
        </div>
        <div className="home-quick-actions">
          <Link to="/groups/new" className="btn-primary">＋ Buka study group</Link>
          <Link to="/map" className="btn-secondary">Cari spot belajar</Link>
          <Link to="/map?request=1" className="home-request-link">Ajukan lokasi →</Link>
        </div>
      </section>

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

      <section className="home-pulse-banner">
        <div>
          <span className="home-pulse-indicator" aria-hidden="true" />
          <div>
            <strong>{homeData?.summary?.peopleStudying || 0} mahasiswa aktif di kampus</strong>
            <span>{homeData?.summary?.placesActive || 0} lokasi dengan aktivitas belajar</span>
          </div>
        </div>
        <Link to="/map">Lihat radar kampus →</Link>
      </section>

      <div className="stats-grid home-stats-grid">
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

      <div className="home-radar-grid">
      <div className="map-preview-card home-map-preview">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3>Live Campus Radar</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Pantau aktivitas belajar di sekitar kampus
            </p>
          </div>
          <Link to="/map" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Peta penuh ↗
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
            Pilih penanda untuk melihat detail dan study group
          </span>
          <Link to="/map" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            Buka peta →
          </Link>
        </div>
      </div>
      <section className="home-chat-hub">
        <div className="home-section-heading">
          <div>
            <span className="eyebrow">Percakapan kampus</span>
            <h2>Chat Hub</h2>
          </div>
          <Link to="/communities">Semua →</Link>
        </div>
        {!homeData?.myCommunities?.length ? (
          <div className="home-chat-empty">
            <span aria-hidden="true">💬</span>
            <p>Kamu belum bergabung dengan komunitas.</p>
            <Link to="/communities" className="btn-secondary">Jelajahi komunitas</Link>
          </div>
        ) : (
          <div className="home-chat-list">
            {homeData.myCommunities.slice(0, 4).map((community) => (
              <Link to={`/communities/${community.id}`} className="home-chat-item" key={community.id}>
                <span className="home-chat-avatar">{community.name.charAt(0).toUpperCase()}</span>
                <span className="home-chat-copy">
                  <strong>{community.name}</strong>
                  <small>
                    {community.lastMessage
                      ? `${community.lastMessage.author}: ${community.lastMessage.content}`
                      : 'Belum ada pesan'}
                  </small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
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
