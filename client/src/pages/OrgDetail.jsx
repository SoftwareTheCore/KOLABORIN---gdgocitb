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
    return <main className="container org-detail-page"><p className="empty-state">Memuat profil organisasi...</p></main>;
  }

  if (!data) {
    return <main className="container org-detail-page"><div className="alert-error">Organisasi tidak ditemukan.</div></main>;
  }

  const { organization, events, community, isOwner } = data;

  return (
    <main className="container org-detail-page">
      {/* Pending status banner */}
      {organization.status === 'pending' && (
        <div className="org-pending-banner">
          <span aria-hidden="true">!</span>
          <div><strong>Menunggu verifikasi</strong><p>Event organisasi akan muncul setelah admin menyelesaikan verifikasi.</p></div>
        </div>
      )}

      <header className="org-public-hero">
        <div className="org-public-identity">
          <span className="org-public-mark" aria-hidden="true">{organization.name.charAt(0).toUpperCase()}</span>
          <div>
            <div className="org-public-tags">
              <span className="tag-subject">{organization.category || 'Organisasi kampus'}</span>
              <span className={`status-badge status-${organization.status}`}>{organization.status.toUpperCase()}</span>
              {organization.open_for_collab && <span className="org-open-collab-tag">🤝 Terbuka untuk kolaborasi</span>}
            </div>
            <span className="eyebrow">Profil organisasi</span>
            <h1>{organization.name}</h1>
            <p>Dipimpin oleh {organization.owner_name}</p>
          </div>
        </div>
        {isOwner && <Link to={`/orgs/${organization.id}/manage`} className="btn-primary">Kelola organisasi →</Link>}
        <p className="org-public-description">{organization.description || 'Organisasi ini belum menambahkan deskripsi.'}</p>

        {community && (
          <div className="org-linked-community">
            <span className="org-community-mark">#</span>
            <div>
              <strong>Chat Hub resmi</strong>
              <span>{community.name}</span>
            </div>
            <Link to={`/communities/${community.id}`} className="btn-secondary">Buka komunitas →</Link>
          </div>
        )}
      </header>

      {/* Events Hosted */}
      <section className="org-events-panel">
        <div className="org-section-heading">
          <div><span className="eyebrow">Agenda kampus</span><h2>Event mendatang</h2></div>
          <span className="org-event-count">{events.length} event</span>
        </div>

        {events.length === 0 ? (
          <p className="empty-state">Belum ada event mendatang.</p>
        ) : (
          <div className="org-event-list">
            {events.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="org-event-row">
                <span className="org-event-date">{new Date(e.start_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                <span className="org-event-copy"><strong>{e.title}</strong><small>{new Date(e.start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small></span>
                <span className="org-event-arrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
