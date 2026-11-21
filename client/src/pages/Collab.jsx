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
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Open for Collaboration 🤝</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Connect and co-host campus events with other verified student organizations.
        </p>
      </div>

      {myVerifiedOrgs.length === 0 && (
        <div className="alert-error" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', marginBottom: '1.5rem' }}>
          ℹ️ You must be an owner of a verified student organization to send collaboration proposals.
        </div>
      )}

      {/* Grid: Left Discover Orgs, Right Collaboration Inbox */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Left: Discover Organizations Open for Collab */}
        <div>
          <div className="dash-card">
            <h3>Organizations Open for Collaboration ({collabOrgs.length})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              These verified organizations have active collaboration enabled.
            </p>

            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p>
            ) : collabOrgs.length === 0 ? (
              <p className="empty-state">No other organizations currently looking for collaboration.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {collabOrgs.map((org) => (
                  <div key={org.id} className="dash-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
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
                          Send Proposal
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {org.description || 'Verified student organization.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Inbox Proposals */}
        <div>
          <div className="dash-card">
            <h3>📥 Collaboration Inbox ({inbox.length})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Joint event proposals sent to your organization.
            </p>

            {inbox.length === 0 ? (
              <p className="empty-state">Inbox empty. No proposals received yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inbox.map((req) => (
                  <div key={req.id} className="dash-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem' }}>From: {req.from_org_name}</strong>
                      <span className={`status-badge status-${req.status === 'accepted' ? 'verified' : req.status === 'declined' ? 'rejected' : 'pending'}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Sender: {req.sender_name} ({req.sender_email})
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
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, 'accept')}
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          Accept Proposal
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
            <h3>🤝 Propose Collaboration</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Sending proposal to <strong>{selectedToOrg.name}</strong> from <strong>{myVerifiedOrgs[0]?.name}</strong>.
            </p>

            <form onSubmit={handleSendRequest} className="auth-form">
              <div className="form-group">
                <label>Collaboration Proposal Message *</label>
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
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
