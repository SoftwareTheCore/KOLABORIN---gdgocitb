import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create community modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Akademik',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadCommunities = async () => {
    try {
      const res = await api.get('/communities');
      setCommunities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleJoin = async (id) => {
    try {
      await api.post(`/communities/${id}/join`);
      showToast('Joined community successfully!');
      loadCommunities();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to join');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/communities', formData);
      setShowModal(false);
      setFormData({ name: '', category: 'Akademik', description: '' });
      showToast('Community created successfully!');
      navigate(`/communities/${res.data.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create community');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2>Community Hub 💬</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Official organization channels, study groups, and interactive auto-reply chat rooms.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          ➕ Create Community
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading communities...</p>
      ) : communities.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
          <h3>No communities found</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Be the first to start a campus community!</p>
        </div>
      ) : (
        <div className="party-grid">
          {communities.map((c) => (
            <div key={c.id} className="party-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="tag-subject">{c.category || 'General'}</span>
                {c.org_name && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    🏛️ {c.org_name} {c.org_status === 'verified' && '✅'}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{c.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem', flex: 1 }}>
                {c.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  👥 <strong>{c.member_count}</strong> members
                </span>

                {c.is_member ? (
                  <Link to={`/communities/${c.id}`} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                    Open Chat Room →
                  </Link>
                ) : (
                  <button onClick={() => handleJoin(c.id)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    Join Community
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create Community */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>➕ Create New Community</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
              Create a campus community space for discussion, announcements, and peer support.
            </p>

            <form onSubmit={handleCreate} className="auth-form">
              <div className="form-group">
                <label>Community Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. STEI Competitive Programming"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-btn)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                >
                  <option value="Akademik">Akademik</option>
                  <option value="Minat Bakat">Minat Bakat</option>
                  <option value="Komunitas">Komunitas Umum</option>
                  <option value="Teknologi">Teknologi</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Tujuan komunitas..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
