import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2>Campus Events 📅</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Workshops, seminars, and hackathons hosted by verified student organizations.
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading events...</p>
      ) : events.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
          <h3>No upcoming events published</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Stay tuned for upcoming campus activities.</p>
        </div>
      ) : (
        <div className="party-grid">
          {events.map((evt) => (
            <div key={evt.id} className="party-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🏛️ {evt.org_name}
                  {evt.org_status === 'verified' && <span title="Verified Organization">✅</span>}
                </span>
                {evt.my_status ? (
                  <span className={`status-badge status-${evt.my_status === 'accepted' ? 'verified' : evt.my_status === 'rejected' ? 'rejected' : 'pending'}`}>
                    {evt.my_status.toUpperCase()}
                  </span>
                ) : (
                  <span className="status-badge status-verified">PUBLISHED</span>
                )}
              </div>

              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{evt.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem', flex: 1 }}>
                {evt.description || 'No description provided.'}
              </p>

              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span>📍 {evt.location_name || 'Campus Venue'}</span>
                <span>
                  🕒 {new Date(evt.start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {evt.capacity && (
                  <span>
                    👥 Accepted: <strong>{evt.accepted_count}</strong> / {evt.capacity} seats
                  </span>
                )}
              </div>

              <Link to={`/events/${evt.id}`} className="btn-primary" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                {evt.my_status ? 'View Status' : 'View Details & Apply'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
