import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function Collab() {
  const { extra } = useAuth();
  const [collabOrgs, setCollabOrgs] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [selectedToOrg, setSelectedToOrg] = useState(null);
  const [collabMessage, setCollabMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const myVerifiedOrgs = extra?.ownedOrgs?.filter(o => o.status === 'verified') || [];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadCollabData = async () => {
    try {
      const [resOrgs, resInbox] = await Promise.all([
        api.get('/orgs?openForCollab=1'),
        api.get('/collab-requests/inbox')
      ]);
      // Filter out user's own orgs
      const myOrgIds = (extra?.ownedOrgs || []).map(o => o.id);
      setCollabOrgs(resOrgs.data.filter(o => !myOrgIds.includes(o.id)));
      setInbox(resInbox.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollabData();
  }, [extra]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedToOrg || myVerifiedOrgs.length === 0) return;

    setSubmitting(true);
    try {
      await api.post('/collab-requests', {
        from_org_id: myVerifiedOrgs[0].id,
        to_org_id: selectedToOrg.id,
        message: collabMessage
      });
      showToast('Collaboration request sent!');
      setSelectedToOrg(null);
      setCollabMessage('');
      loadCollabData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send collaboration request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (id, action) => {
    try {
      const res = await api.patch(`/collab-requests/${id}`, { action });
      showToast(res.data.message);
      loadCollabData();
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to ${action} request`);
    }
  };

  return (
    <main className="container org-collab-page">
      {toast && <div className="toast-pill">{toast}</div>}

      <header className="org-collab-hero">
        <div><span className="eyebrow">Jaringan organisasi kampus</span><h1>Kolaborasi yang lebih besar.</h1><p>Temukan organisasi terverifikasi dan ajukan event bersama.</p></div>
        <span className="org-home-hero-mark" aria-hidden="true">↗</span>
      </header>

      {myVerifiedOrgs.length === 0 && (
        <div className="org-pending-banner">
          <span aria-hidden="true">!</span>
          <div><strong>Verifikasi diperlukan</strong><p>Pemilik organisasi terverifikasi dapat mengirim proposal kolaborasi.</p></div>
        </div>
      )}

      <div className="org-collab-grid">
        {/* Left: Discover Organizations Open for Collab */}
        <div>
          <div className="org-manage-card">
            <div className="org-section-heading"><div><span className="eyebrow">Temukan partner</span><h2>Terbuka untuk kolaborasi</h2></div><span className="org-event-count">{collabOrgs.length} organisasi</span></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Organisasi terverifikasi yang siap merancang kegiatan bersama.
            </p>

            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p>
            ) : collabOrgs.length === 0 ? (
              <p className="empty-state">Belum ada organisasi lain yang membuka kolaborasi.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {collabOrgs.map((org) => (
                  <div key={org.id} className="org-collab-org-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div>
                        <strong>{org.name}</strong>
                        <span className="tag-subject" style={{ marginLeft: '0.5rem' }}>{org.category}</span>
                      </div>
                      {myVerifiedOrgs.length > 0 && (
                        <button
                          onClick={() => setSelectedToOrg(org)}
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          Ajukan kolaborasi
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {org.description || 'Organisasi kampus terverifikasi.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Inbox Proposals */}
        <div>
          <div className="org-manage-card">
            <div className="org-section-heading"><div><span className="eyebrow">Permintaan masuk</span><h2>Kotak kolaborasi</h2></div><span className="org-event-count">{inbox.length}</span></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Proposal event bersama yang dikirim ke organisasi Anda.
            </p>

            {inbox.length === 0 ? (
              <p className="empty-state">Belum ada proposal kolaborasi.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inbox.map((req) => (
                  <div key={req.id} className="org-collab-inbox-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem' }}>Dari: {req.from_org_name}</strong>
                      <span className={`status-badge status-${req.status === 'accepted' ? 'verified' : req.status === 'declined' ? 'rejected' : 'pending'}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Pengirim: {req.sender_name} ({req.sender_email})
                    </span>
                    <p style={{ fontSize: '0.85rem', background: 'var(--card)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '100%' }}>
                      "{req.message}"
                    </p>

                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', marginTop: '0.25rem' }}>
                        <button
                          onClick={() => handleRespond(req.id, 'decline')}
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, 'accept')}
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          Terima proposal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Send Proposal */}
      {selectedToOrg && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>🤝 Ajukan kolaborasi</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Mengirim proposal ke <strong>{selectedToOrg.name}</strong> dari <strong>{myVerifiedOrgs[0]?.name}</strong>.
            </p>

            <form onSubmit={handleSendRequest} className="auth-form">
              <div className="form-group">
                <label>Rencana kolaborasi *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ceritakan rencana kolaborasi, ide event bareng, atau agenda bersama..."
                  value={collabMessage}
                  onChange={(e) => setCollabMessage(e.target.value)}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-btn)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedToOrg(null)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Mengirim...' : 'Kirim proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
