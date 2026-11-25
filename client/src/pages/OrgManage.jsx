import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const OrganizationAnalyticsChart = lazy(() => import('../components/OrganizationAnalyticsChart'));

export default function OrgManage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [org, setOrg] = useState(null);
  const [locations, setLocations] = useState([]);
  const [description, setDescription] = useState('');
  const [openCollab, setOpenCollab] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Event creation form
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location_id: '',
    start_at: '',
    end_at: '',
    capacity: ''
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = async () => {
    setLoadError('');
    try {
      const [orgRes, locRes] = await Promise.all([
        api.get(`/orgs/${id}`),
        api.get('/locations')
      ]);
      if (!orgRes.data.isOwner) {
        setLoadError('Hanya pemilik organisasi yang dapat membuka workspace ini.');
        return;
      }
      setOrg(orgRes.data.organization);
      setDescription(orgRes.data.organization.description || '');
      setOpenCollab(orgRes.data.organization.open_for_collab);
      setLocations(locRes.data);
      if (locRes.data.length > 0) {
        setEventForm(prev => ({ ...prev, location_id: locRes.data[0].id }));
      }

      // Default event start: now + 3 days
      const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEventForm(prev => ({ ...prev, start_at: d.toISOString().slice(0, 16) }));
    } catch (err) {
      console.error('Failed to load organization settings:', err);
      setLoadError(err.response?.data?.error || 'Data organisasi tidak dapat dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!loading && window.location.hash === '#org-event-form') {
      document.getElementById('org-event-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    const refreshAnalytics = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      setAnalyticsError('');
      try {
        const res = await api.get(`/orgs/${id}/analytics`);
        if (active) {
          setAnalytics(res.data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Failed to load organization analytics:', err);
        if (active) {
          setAnalyticsError(err.response?.data?.error || 'Analitik organisasi tidak dapat dimuat.');
        }
      } finally {
        requestInFlight = false;
        if (active) setAnalyticsLoading(false);
      }
    };

    setAnalyticsLoading(true);
    refreshAnalytics();
    const intervalId = setInterval(refreshAnalytics, 15000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [id, refreshKey]);

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/orgs/${id}`, {
        description,
        open_for_collab: org.status === 'verified' ? openCollab : false
      });
      showToast('Organization settings updated!');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update organization');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (org.status !== 'verified') {
      showToast('Cannot publish event: Organization is not verified yet.');
      return;
    }

    setEventSubmitting(true);
    try {
      await api.post('/events', {
        organization_id: id,
        title: eventForm.title,
        description: eventForm.description,
        location_id: eventForm.location_id,
        start_at: eventForm.start_at,
        end_at: eventForm.end_at || null,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity, 10) : null
      });
      showToast('Event published successfully!');
      setEventForm({ title: '', description: '', location_id: locations[0]?.id || '', start_at: '', end_at: '', capacity: '' });
      navigate(`/orgs/${id}/events`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to publish event');
    } finally {
      setEventSubmitting(false);
    }
  };

  if (loading) {
    return <main className="container org-manage-page"><p className="empty-state">Memuat workspace organisasi...</p></main>;
  }

  if (!org) {
    return (
      <main className="container org-manage-page">
        <div className="alert-error">{loadError || 'Organisasi tidak ditemukan atau Anda tidak memiliki akses.'}</div>
      </main>
    );
  }

  const dailyRows = analytics?.daily || [];
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = analytics?.today ? new Date(`${analytics.today}T00:00:00`) : new Date();
    date.setDate(date.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const entry = dailyRows.find((row) => row.date === key);
    return {
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      pending: entry?.pending || 0,
      accepted: entry?.accepted || 0,
      rejected: entry?.rejected || 0
    };
  });
  const summary = analytics?.summary || {};

  return (
    <main className="container org-manage-page">
      {toast && <div className="toast-pill">{toast}</div>}

      <header className="org-manage-hero">
        <div className="org-manage-identity">
          <div className="org-manage-mark" aria-hidden="true">{org.name.charAt(0).toUpperCase()}</div>
          <div>
            <span className="eyebrow">Organization workspace</span>
            <h1>{org.name}</h1>
            <span className={`status-badge status-${org.status}`}>{org.status.toUpperCase()}</span>
          </div>
        </div>
        <div className="org-manage-actions">
          <button type="button" className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)}>
            ↻ Perbarui data
          </button>
          <button type="button" className="btn-primary" onClick={() => document.getElementById('org-event-form')?.scrollIntoView({ behavior: 'smooth' })}>
            ＋ Buat event
          </button>
        </div>
      </header>

      {loadError && <div className="alert-error">{loadError}</div>}

      {org.status === 'pending' && (
        <div className="org-pending-banner">
          <span aria-hidden="true">!</span>
          <div><strong>Menunggu verifikasi</strong><p>Event dan kolaborasi akan tersedia setelah organisasi disetujui admin.</p></div>
        </div>
      )}

      <section className="org-analytics-panel">
        <div className="org-section-heading">
          <div>
            <span className="eyebrow">Kinerja organisasi</span>
            <h2>Ringkasan aktivitas</h2>
          </div>
          <div className="org-live-meta">
            <span className="org-live-indicator"><i /> Live · refresh 15 dtk</span>
            <span>{lastUpdated ? `Terakhir diperbarui ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Memuat data...'}</span>
          </div>
        </div>
        {analyticsError && <p className="org-analytics-error">{analyticsError}</p>}
        <div className="org-metric-grid">
          <article className="org-metric-card"><span>Event dipublikasi</span><strong>{summary.publishedEvents ?? '—'}</strong><small>Semua event aktif</small></article>
          <article className="org-metric-card"><span>Total pendaftar</span><strong>{summary.applications ?? '—'}</strong><small>Semua event organisasi</small></article>
          <article className="org-metric-card"><span>Menunggu review</span><strong>{summary.pendingApplications ?? '—'}</strong><small className="org-metric-warm">Perlu ditindaklanjuti</small></article>
          <article className="org-metric-card"><span>Diterima</span><strong>{summary.acceptedApplications ?? '—'}</strong><small className="org-metric-positive">Peserta terkonfirmasi</small></article>
        </div>
        <div className="org-chart-card">
          <div className="org-chart-heading">
            <div><h3>Pendaftaran peserta</h3><p>Pendaftar berdasarkan status aplikasi · 7 hari terakhir</p></div>
            <span className="org-chart-period">7 hari</span>
          </div>
          {analyticsLoading && !analytics ? (
            <div className="org-chart-placeholder">Memuat analitik...</div>
          ) : analytics ? (
            <>
              <div className="org-chart">
                <Suspense fallback={<div className="org-chart-placeholder">Memuat visualisasi...</div>}>
                  <OrganizationAnalyticsChart data={chartData} />
                </Suspense>
              </div>
              {chartData.every((row) => row.pending + row.accepted + row.rejected === 0) && (
                <p className="org-chart-empty">Belum ada pendaftaran dalam 7 hari terakhir. Data akan muncul otomatis saat peserta mendaftar.</p>
              )}
            </>
          ) : (
            <div className="org-chart-placeholder">Grafik belum tersedia.</div>
          )}
        </div>
      </section>

      <section className="org-manage-content-grid">
        <div className="org-manage-card" id="org-event-form">
          <div className="org-section-heading">
            <div><span className="eyebrow">Publikasi</span><h2>Buat event kampus</h2></div>
            <span className="org-card-icon" aria-hidden="true">＋</span>
          </div>
          <p className="org-card-description">Promosikan workshop, seminar, atau kompetisi untuk mahasiswa.</p>

          {org.status !== 'verified' ? (
            <div className="org-locked-note">Event dapat dipublikasikan setelah organisasi terverifikasi.</div>
          ) : (
          <form onSubmit={handleCreateEvent} className="auth-form org-event-form">
            <div className="form-group">
              <label>Nama event *</label>
              <input
                required
                type="text"
                placeholder="Contoh: AI Hackathon 2026"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Lokasi acara</label>
              <select
                value={eventForm.location_id}
                onChange={(e) => setEventForm({ ...eventForm, location_id: e.target.value })}
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Waktu mulai *</label>
                <input
                  required
                  type="datetime-local"
                  value={eventForm.start_at}
                  onChange={(e) => setEventForm({ ...eventForm, start_at: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Kapasitas peserta</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Contoh: 50"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Deskripsi & agenda</label>
              <textarea
                rows={3}
                placeholder="Detail susunan acara dan prasyarat peserta..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>

            <button type="submit" disabled={eventSubmitting} className="btn-primary">
              {eventSubmitting ? 'Mempublikasikan...' : 'Publikasikan event'}
            </button>
          </form>
          )}
        </div>

        <div className="org-manage-side-column">
          <div className="org-manage-card">
            <div className="org-section-heading">
              <div><span className="eyebrow">Profil</span><h2>Pengaturan organisasi</h2></div>
              <span className="org-card-icon" aria-hidden="true">⚙</span>
            </div>
            <form onSubmit={handleUpdateOrg} className="auth-form org-settings-form">
          <div className="form-group">
            <label>Deskripsi organisasi</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="org-collab-toggle">
            <input
              type="checkbox"
              id="openCollab"
              disabled={org.status !== 'verified'}
              checked={openCollab}
              onChange={(e) => setOpenCollab(e.target.checked)}
            />
            <div><label htmlFor="openCollab">Buka peluang kolaborasi</label><p>Izinkan organisasi lain menemukan dan mengajukan event bersama.</p></div>
          </div>

          <button type="submit" className="btn-primary">
            Simpan pengaturan
          </button>
        </form>
          </div>

          <section className="org-manage-card org-shortcuts-card">
            <span className="eyebrow">Akses cepat</span>
            <Link to={`/orgs/${id}`} className="org-shortcut-link">Lihat profil publik <span>→</span></Link>
            <Link to="/collab" className="org-shortcut-link">Kolaborasi kampus <span>→</span></Link>
            <Link to="/communities" className="org-shortcut-link">Chat Hub organisasi <span>→</span></Link>
          </section>
        </div>
      </section>

      <section className="org-events-panel">
        <div className="org-section-heading">
          <div><span className="eyebrow">Portofolio acara</span><h2>Event organisasi</h2></div>
          <span className="org-event-count">{analytics?.events?.length || 0} terbaru</span>
        </div>
        {analytics?.events?.length ? (
          <div className="org-event-list">
            {analytics.events.map((event) => (
              <Link to={`/events/${event.id}`} key={event.id} className="org-event-row">
                <span className="org-event-date">{new Date(event.start_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                <span className="org-event-copy"><strong>{event.title}</strong><small>{new Date(event.start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {event.application_count} pendaftar</small></span>
                <span className={`status-badge status-${event.status === 'published' ? 'verified' : event.status === 'cancelled' ? 'rejected' : 'pending'}`}>{event.status}</span>
                <span className="org-event-arrow">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-state">{analyticsLoading ? 'Memuat event...' : 'Belum ada event organisasi.'}</p>
        )}
      </section>
    </main>
  );
}
