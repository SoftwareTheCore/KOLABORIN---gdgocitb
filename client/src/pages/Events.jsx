import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function formatEventDate(value, options) {
  return new Date(value).toLocaleString('id-ID', options);
}

function EventCard({ event }) {
  const statusClass = event.my_status === 'accepted'
    ? 'verified'
    : event.my_status === 'rejected'
      ? 'rejected'
      : 'pending';

  return (
    <article className="event-card">
      <div className="event-card-meta">
        <span className="event-org">
          {event.org_name}
          {event.org_status === 'verified' && <span title="Organisasi terverifikasi">✓</span>}
        </span>
        <span className={`status-badge status-${event.my_status ? statusClass : 'verified'}`}>
          {event.my_status ? event.my_status.toUpperCase() : 'DIPUBLIKASIKAN'}
        </span>
      </div>
      <h3>{event.title}</h3>
      <p className="event-description">{event.description || 'Informasi acara belum tersedia.'}</p>
      <div className="event-details">
        <span>📅 {formatEventDate(event.start_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>📍 {event.location_name || 'Lokasi kampus akan diumumkan'}</span>
        {event.capacity && (
          <span>👥 {event.accepted_count} / {event.capacity} peserta diterima</span>
        )}
      </div>
      <Link to={`/events/${event.id}`} className="btn-secondary event-card-link">
        {event.my_status ? 'Lihat status pendaftaran' : 'Lihat detail & daftar'} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/events')
      .then((res) => setEvents(res.data))
      .catch((err) => {
        console.error('Failed to load events:', err);
        setLoadError('Event belum dapat dimuat. Coba muat ulang halaman.');
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) => (
      [event.title, event.description, event.org_name, event.location_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    ));
  }, [events, searchTerm]);

  const featuredEvent = visibleEvents[0];
  const otherEvents = visibleEvents.slice(1);
  const myApplications = events.filter((event) => event.my_status);
  const acceptedCount = events.reduce((sum, event) => sum + Number(event.accepted_count || 0), 0);
  const currentMonthEvents = events.filter((event) => {
    const date = new Date(event.start_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <main className="container events-page">
      <section className="events-hero">
        <div>
          <span className="eyebrow">Agenda kampus · ITB</span>
          <h1>Jelajahi event, workshop &amp; kompetisi</h1>
          <p>Temukan kegiatan dari organisasi kampus terverifikasi dan lihat status pendaftaranmu.</p>
        </div>
        <div className="events-summary">
          <div><strong>{currentMonthEvents}</strong><span>Event bulan ini</span></div>
          <div><strong>{acceptedCount}</strong><span>Peserta diterima</span></div>
          <div><strong>{myApplications.length}</strong><span>Pendaftaran saya</span></div>
        </div>
      </section>

      <div className="events-search-row">
        <label className="events-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Cari nama event, penyelenggara, atau lokasi..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <span className="events-results-count">{visibleEvents.length} event</span>
      </div>

      {loadError ? (
        <div className="empty-state">{loadError}</div>
      ) : loading ? (
        <div className="empty-state">Memuat agenda kampus...</div>
      ) : events.length === 0 ? (
        <div className="empty-state events-empty">
          <h2>Belum ada event mendatang</h2>
          <p>Event yang dipublikasikan organisasi kampus akan muncul di sini.</p>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="empty-state events-empty">
          <h2>Event tidak ditemukan</h2>
          <p>Coba kata kunci lain.</p>
        </div>
      ) : (
        <div className="events-content-grid">
          <section className="events-list">
            {featuredEvent && (
              <article className="featured-event-card">
                <div className="featured-event-art" aria-hidden="true">
                  <span>{formatEventDate(featuredEvent.start_at, { day: '2-digit' })}</span>
                  <small>{formatEventDate(featuredEvent.start_at, { month: 'short' })}</small>
                </div>
                <div className="featured-event-content">
                  <span className="eyebrow">Pilihan event berikutnya</span>
                  <span className="event-org">{featuredEvent.org_name}</span>
                  <h2>{featuredEvent.title}</h2>
                  <p>{featuredEvent.description || 'Informasi acara belum tersedia.'}</p>
                  <div className="event-details">
                    <span>🕒 {formatEventDate(featuredEvent.start_at, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>📍 {featuredEvent.location_name || 'Lokasi kampus akan diumumkan'}</span>
                  </div>
                  <Link to={`/events/${featuredEvent.id}`} className="btn-primary">
                    {featuredEvent.my_status ? 'Lihat pendaftaran' : 'Lihat detail & daftar'}
                  </Link>
                </div>
              </article>
            )}
            {otherEvents.length > 0 && (
              <div className="events-section-heading">
                <div>
                  <span className="eyebrow">Kalender kampus</span>
                  <h2>Event mendatang</h2>
                </div>
              </div>
            )}
            <div className="events-card-grid">
              {otherEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </section>

          <aside className="events-sidebar">
            <section className="events-sidebar-card">
              <div className="events-section-heading">
                <div>
                  <span className="eyebrow">Pendaftaran</span>
                  <h2>Tiket &amp; status saya</h2>
                </div>
              </div>
              {myApplications.length === 0 ? (
                <p className="empty-state compact-empty">Belum ada pendaftaran. Pilih event untuk melihat detail dan mendaftar.</p>
              ) : (
                <div className="my-events-list">
                  {myApplications.map((event) => (
                    <Link to={`/events/${event.id}`} className="my-event-item" key={event.id}>
                      <span className="my-event-date">
                        {formatEventDate(event.start_at, { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="my-event-info">
                        <strong>{event.title}</strong>
                        <small>{event.org_name}</small>
                      </span>
                      <span className={`status-badge status-${event.my_status === 'accepted' ? 'verified' : event.my_status === 'rejected' ? 'rejected' : 'pending'}`}>
                        {event.my_status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <section className="events-sidebar-note">
              <strong>Organisasi kampus</strong>
              <p>Event hanya dapat dipublikasikan oleh organisasi yang telah diverifikasi.</p>
              <Link to="/communities">Jelajahi komunitas →</Link>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
