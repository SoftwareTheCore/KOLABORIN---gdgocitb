import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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

  const categories = [...new Set(communities.map((community) => community.category).filter(Boolean))];
  const visibleCommunities = communities.filter((community) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query
      || [community.name, community.description, community.org_name, community.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (!categoryFilter || community.category === categoryFilter);
  });

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
    <div className="container communities-page">
      {toast && <div className="toast-pill">{toast}</div>}

      <section className="communities-hero">
        <div>
          <span className="eyebrow">Chat Hub · Komunitas kampus</span>
          <h1>Temukan ruang diskusi yang tepat</h1>
          <p>Gabung komunitas, bertukar ide, dan ikuti percakapan kampus.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          ＋ Buat komunitas
        </button>
      </section>

      <section className="communities-controls">
        <label className="open-party-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Cari komunitas, organisasi, atau topik..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <div className="filter-scroll open-party-subjects" aria-label="Filter kategori komunitas">
          <button type="button" className={!categoryFilter ? 'btn-primary' : 'btn-secondary'} onClick={() => setCategoryFilter('')}>
            Semua kategori
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={categoryFilter === category ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="empty-state">Memuat komunitas...</p>
      ) : visibleCommunities.length === 0 ? (
        <div className="empty-state communities-empty">
          <h3>{communities.length ? 'Komunitas tidak ditemukan' : 'Belum ada komunitas'}</h3>
          <p>{communities.length ? 'Coba kata kunci atau kategori lain.' : 'Jadilah yang pertama membuat ruang komunitas kampus.'}</p>
        </div>
      ) : (
        <div className="party-grid communities-grid">
          {visibleCommunities.map((c) => (
            <article key={c.id} className="party-card community-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="tag-subject">{c.category || 'Umum'}</span>
                {c.org_name && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    🏛️ {c.org_name} {c.org_status === 'verified' && '✓'}
                  </span>
                )}
              </div>

              <span className="community-card-avatar" aria-hidden="true">{c.name.charAt(0).toUpperCase()}</span>
              <h2>{c.name}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem', flex: 1 }}>
                {c.description || 'Ruang diskusi untuk komunitas kampus.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  👥 <strong>{c.member_count}</strong> anggota
                </span>

                {c.is_member ? (
                  <Link to={`/communities/${c.id}`} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                    Buka Chat Hub →
                  </Link>
                ) : (
                  <button onClick={() => handleJoin(c.id)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                    Gabung
                  </button>
                )}
              </div>
            </article>
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
