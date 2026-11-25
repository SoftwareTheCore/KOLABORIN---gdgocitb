import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function OrgNew() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Unit Kegiatan Mahasiswa',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/orgs', formData);
      await refreshProfile();
      navigate(`/orgs/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register organization');
      setSubmitting(false);
    }
  };

  return (
    <main className="container org-new-page">
      <div className="auth-card org-new-card">
        <span className="eyebrow">Campus organization</span>
        <h1>Daftarkan organisasi</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Daftarkan himpunan atau unit kegiatan kampus. Organisasi baru perlu diverifikasi admin sebelum dapat mempublikasikan event.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nama organisasi *</label>
            <input
              required
              type="text"
              placeholder="e.g. ITB Game Development Club"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Kategori</label>
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
              <option value="Himpunan Jurusan">Himpunan Jurusan</option>
              <option value="Unit Kegiatan Mahasiswa">Unit Kegiatan Mahasiswa (UKM)</option>
              <option value="Komunitas Teknologi">Komunitas Teknologi</option>
              <option value="Lembaga Kepemimpinan">Lembaga Kepemimpinan</option>
            </select>
          </div>

          <div className="form-group">
            <label>Deskripsi & misi</label>
            <textarea
              rows={3}
              placeholder="Visi, misi, dan kegiatan utama organisasi..."
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

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {submitting ? 'Mendaftarkan...' : 'Kirim untuk verifikasi'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
