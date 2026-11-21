import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function OrgManage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [org, setOrg] = useState(null);
  const [locations, setLocations] = useState([]);
  const [description, setDescription] = useState('');
  const [openCollab, setOpenCollab] = useState(false);
  const [loading, setLoading] = useState(true);

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
    try {
      const [orgRes, locRes] = await Promise.all([
        api.get(`/orgs/${id}`),
        api.get('/locations')
      ]);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

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
      navigate(`/orgs/${id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to publish event');
    } finally {
      setEventSubmitting(false);
    }
  };

  if (loading || !org) {
    return <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>Loading organization settings...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Manage: {org.name}</h2>
        <span className={`status-badge status-${org.status}`} style={{ marginTop: '0.4rem', display: 'inline-block' }}>
          STATUS: {org.status.toUpperCase()}
        </span>
      </div>

      {org.status === 'pending' && (
        <div className="alert-error" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', marginBottom: '1.5rem' }}>
          ⚠️ <strong>Pending verification:</strong> Event publishing and collaboration are locked until an admin approves your organization in the Admin Panel.
        </div>
      )}

      {/* Settings Form */}
      <div className="dash-card">
        <h3>Organization Profile & Settings</h3>
        <form onSubmit={handleUpdateOrg} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: '0.65rem',
                borderRadius: 'var(--radius-btn)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="openCollab"
              disabled={org.status !== 'verified'}
              checked={openCollab}
              onChange={(e) => setOpenCollab(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: org.status === 'verified' ? 'pointer' : 'not-allowed' }}
            />
            <label htmlFor="openCollab" style={{ fontSize: '0.9rem', cursor: org.status === 'verified' ? 'pointer' : 'not-allowed' }}>
              <strong>Open for Collaboration:</strong> Allow other student organizations to discover and request joint events.
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            Save Settings
          </button>
        </form>
      </div>

      {/* Create Event Section */}
      <div className="dash-card" style={{ marginTop: '1.5rem' }}>
        <h3>📅 Publish New Event</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '1rem' }}>
          Promote campus workshops, seminars, or competitions.
        </p>

        {org.status !== 'verified' ? (
          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-btn)', textAlign: 'center', color: 'var(--muted)' }}>
            🔒 You cannot publish events while your organization status is <strong>PENDING</strong>.
          </div>
        ) : (
          <form onSubmit={handleCreateEvent} className="auth-form">
            <div className="form-group">
              <label>Event Title *</label>
              <input
                required
                type="text"
                placeholder="e.g. AI Hackathon 2026"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Venue / Location</label>
              <select
                value={eventForm.location_id}
                onChange={(e) => setEventForm({ ...eventForm, location_id: e.target.value })}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)'
                }}
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date & Time *</label>
                <input
                  required
                  type="datetime-local"
                  value={eventForm.start_at}
                  onChange={(e) => setEventForm({ ...eventForm, start_at: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Participant Capacity (Seats)</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description & Agenda</label>
              <textarea
                rows={3}
                placeholder="Detail susunan acara dan prasyarat peserta..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)'
                }}
              />
            </div>

            <button type="submit" disabled={eventSubmitting} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              {eventSubmitting ? 'Publishing...' : 'Publish Event'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
