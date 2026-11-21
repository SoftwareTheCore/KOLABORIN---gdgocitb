import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function OrgDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orgs/${id}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>Loading organization...</div>;
  }

  if (!data) {
    return <div className="container" style={{ padding: '2rem 1rem' }}><div className="alert-error">Organization not found.</div></div>;
  }

  const { organization, events, community, isOwner } = data;

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Pending status banner */}
      {organization.status === 'pending' && (
        <div className="alert-error" style={{ background: '#fef3c7', color: '#b45309', marginBottom: '1.5rem', border: '1px solid #fde68a' }}>
          ⚠️ <strong>Pending verification:</strong> You cannot publish events yet. An admin must verify this organization.
        </div>
      )}

      <div className="group-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span className="tag-subject">{organization.category || 'Organization'}</span>
              <span className={`status-badge status-${organization.status}`}>
                {organization.status.toUpperCase()}
              </span>
              {organization.open_for_collab && (
                <span className="status-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                  🤝 Open for Collaboration
                </span>
              )}
            </div>
            <h2>{organization.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Led by {organization.owner_name}
            </p>
          </div>

          {isOwner && (
            <Link to={`/orgs/${organization.id}/manage`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              ⚙️ Manage Organization
            </Link>
          )}
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {organization.description || 'No description provided.'}
        </p>

        {community && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-btn)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Official Community:</strong> {community.name}
            </div>
            <Link to={`/communities/${community.id}`} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
              Open Chat Hub →
            </Link>
          </div>
        )}
      </div>

      {/* Events Hosted */}
      <div className="dash-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Upcoming Events Hosted ({events.length})</h3>
          {isOwner && organization.status === 'verified' && (
            <Link to={`/orgs/${organization.id}/manage`} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              + Create Event
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <p className="empty-state">No upcoming events hosted by this organization.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.map((e) => (
              <div key={e.id} className="dash-list-item">
                <div>
                  <strong>{e.title}</strong>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    🕒 {new Date(e.start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <Link to={`/events/${e.id}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                  View Event
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
