import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('orgs'); // orgs, places, badges
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [pendingPlaces, setPendingPlaces] = useState([]);
  const [pendingBadges, setPendingBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadAllQueues = async () => {
    try {
      const [resOrgs, resPlaces, resBadges] = await Promise.all([
        api.get('/admin/orgs/pending'),
        api.get('/admin/place-requests/pending'),
        api.get('/admin/badges/pending')
      ]);
      setPendingOrgs(resOrgs.data);
      setPendingPlaces(resPlaces.data);
      setPendingBadges(resBadges.data);
    } catch (err) {
      console.error(err);
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

  const handlePlaceAction = async (id, action) => {
    try {
      const res = await api.patch(`/admin/place-requests/${id}`, { action });
      showToast(res.data.message);
      loadAllQueues();
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to ${action} place`);
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
        <h2>Admin Moderation Panel 🛡️</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Verify student organizations, approve campus study spots, and confirm academic expertise badges.
        </p>
      </div>

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
          Places ({pendingPlaces.length})
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={activeTab === 'badges' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          Badges ({pendingBadges.length})
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading queue...</p>
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

          {/* TAB 2: PLACES */}
          {activeTab === 'places' && (
            <div>
              {pendingPlaces.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
                  ✅ No pending place requests.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingPlaces.map((pl) => (
                    <div key={pl.id} className="dash-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <span className="tag-subject" style={{ textTransform: 'capitalize' }}>
                            {pl.type.replace('_', ' ')}
                          </span>
                          <h3 style={{ marginTop: '0.3rem' }}>{pl.name}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                            Requested by: <strong>{pl.requester_name}</strong> ({pl.faculty}) • Coordinates: [{pl.latitude}, {pl.longitude}]
                          </p>
                          {pl.address && <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Address: {pl.address}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handlePlaceAction(pl.id, 'reject')}
                            className="btn-secondary"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.85rem' }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handlePlaceAction(pl.id, 'approve')}
                            className="btn-primary"
                            style={{ fontSize: '0.85rem' }}
                          >
                            Approve to Live Map
                          </button>
                        </div>
                      </div>
                      <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                        {pl.short_description || 'No description provided.'}
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
