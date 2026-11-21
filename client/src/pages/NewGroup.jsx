import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function NewGroup() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    location_id: '',
    scheduled_at: '',
    max_members: 8
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/locations')
      .then(res => {
        setLocations(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, location_id: res.data[0].id }));
        }
      })
      .catch(console.error);

    // Default scheduled time: now + 1 hour formatted for datetime-local
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setFormData(prev => ({ ...prev, scheduled_at: d.toISOString().slice(0, 16) }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/groups', formData);
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create study group');
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <h2>➕ Create New Study Group</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Schedule a study session at a campus location and invite other students.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Group Title *</label>
            <input
              required
              type="text"
              placeholder="e.g. Belajar Bareng Database Systems"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Subject / Mata Kuliah *</label>
            <input
              required
              type="text"
              placeholder="e.g. Database Systems, Calculus, AI"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Location (Campus Spot) *</label>
            <select
              required
              value={formData.location_id}
              onChange={e => setFormData({ ...formData, location_id: e.target.value })}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-btn)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)'
              }}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Scheduled Date & Time *</label>
              <input
                required
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Max Members (2 - 20)</label>
              <input
                type="number"
                min={2}
                max={20}
                value={formData.max_members}
                onChange={e => setFormData({ ...formData, max_members: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description & Goals (Optional)</label>
            <textarea
              rows={3}
              placeholder="Topik spesifik yang akan dibahas..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{
                padding: '0.65rem 0.85rem',
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
              onClick={() => navigate('/party')}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
