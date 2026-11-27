import React, { useState, useEffect } from 'react';
import api from '../api';
import { CardSkeletonList } from '../components/LoadingSkeleton';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('orgs');
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [pendingBadges, setPendingBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadAllQueues = async () => {
    setError('');
    try {
      const [resOrgs, resLocations, resBadges] = await Promise.all([
        api.get('/admin/orgs/pending'),
        api.get('/admin/locations'),
        api.get('/admin/badges/pending')
      ]);
      setPendingOrgs(resOrgs.data);
      setLocations(resLocations.data);
      setPendingBadges(resBadges.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Data panel admin gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllQueues();
  }, []);

  const handleOrgAction = async (id, action) => {
    try {
      const res = await api.patch(`/admin/orgs/${id}`, { action });
      showToast(res.data.message);
      loadAllQueues();
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to ${action} organization`);
    }
  };

  const handleRemoveLocation = async (location) => {
    if (!window.confirm(`Hapus ${location.name} dari Campus Radar?`)) return;
    try {
      const res = await api.delete(`/admin/locations/${location.id}`);
      setLocations((current) => current.filter((item) => item.id !== location.id));
      showToast(res.data.message);
    } catch (err) {
      showToast(err.response?.data?.error || 'Lokasi gagal dihapus.');
    }
  };

  const handleBadgeAction = async (id, action) => {
    try {
      const res = await api.patch(`/admin/badges/${id}`, { action });
      showToast(res.data.message);
      loadAllQueues();
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to ${action} badge`);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Admin Moderation Panel</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Verifikasi organisasi, kelola lokasi Campus Radar, dan tinjau badge mahasiswa.
        </p>
      </div>
      {error && <div className="alert-error" role="alert">{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('orgs')}
          className={activeTab === 'orgs' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          Organizations ({pendingOrgs.length})
        </button>
        <button
          onClick={() => setActiveTab('places')}
          className={activeTab === 'places' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          Campus Radar ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={activeTab === 'badges' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          Badges ({pendingBadges.length})
        </button>
      </div>

      {error ? null : loading ? (
        <CardSkeletonList count={3} />
      ) : (
        <div>
          {/* TAB 1: ORGANIZATIONS */}
          {activeTab === 'orgs' && (
            <div>
              {pendingOrgs.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
                  ✅ No pending organizations. All verified!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingOrgs.map((org) => (
                    <div key={org.id} className="dash-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <span className="tag-subject">{org.category}</span>
                          <h3 style={{ marginTop: '0.3rem' }}>{org.name}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                            Owner: <strong>{org.owner_name}</strong> ({org.owner_email}) • {org.faculty}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOrgAction(org.id, 'reject')}
                            className="btn-secondary"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.85rem' }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleOrgAction(org.id, 'verify')}
                            className="btn-primary"
                            style={{ fontSize: '0.85rem' }}
                          >
                            Verify Organization
                          </button>
                        </div>
                      </div>
                      <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        {org.description || 'No description provided.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMPUS RADAR */}
          {activeTab === 'places' && (
            <div>
              {locations.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
                  Semua lokasi Campus Radar sudah dihapus.
                </div>
              ) : (
                <div className="admin-location-list">
                  {locations.map((location) => (
                    <div key={location.id} className="dash-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <span className="tag-subject" style={{ textTransform: 'capitalize' }}>
                            {location.type.replace(/_/g, ' ')}
                          </span>
                          <h3 style={{ marginTop: '0.3rem' }}>{location.name}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                            {location.address || 'Lokasi kampus'} · {location.rating_count} penilaian
                          </p>
                          <p className="admin-location-rating" aria-label={`Rating ${location.rating} dari 5`}>
                            <span aria-hidden="true">{'★'.repeat(Math.round(location.rating))}{'☆'.repeat(5 - Math.round(location.rating))}</span>
                            <strong>{location.rating.toFixed(1)}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveLocation(location)}
                          className="btn-secondary"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.85rem' }}
                        >
                          Hapus lokasi
                        </button>
                      </div>
                      <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        {location.short_description || 'Belum ada deskripsi fasilitas.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BADGES */}
          {activeTab === 'badges' && (
            <div>
              {pendingBadges.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
                  ✅ No pending badge approvals.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingBadges.map((bg) => (
                    <div key={bg.id} className="dash-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            🏅 {bg.badge_name}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                            Candidate: <strong>{bg.user_name}</strong> ({bg.faculty} • {bg.major})
                          </p>
                          <span style={{ fontSize: '0.85rem', color: 'var(--ok)', fontWeight: 600 }}>
                            Qualified with {bg.answer_count} answers in {bg.subject} study groups
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleBadgeAction(bg.id, 'reject')}
                            className="btn-secondary"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.85rem' }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleBadgeAction(bg.id, 'approve')}
                            className="btn-primary"
                            style={{ fontSize: '0.85rem' }}
                          >
                            Approve Badge
                          </button>
                        </div>
                      </div>
                      <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {bg.badge_description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
