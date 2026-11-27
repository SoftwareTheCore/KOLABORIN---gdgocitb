import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { CardSkeletonList } from '../components/LoadingSkeleton';

const SPACE_LABELS = {
  meeting_room: 'Ruang meeting',
  event_venue: 'Venue event'
};

function formatDate(value) {
  if (!value) return 'Jadwal belum ditentukan';
  return new Date(value).toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateTimeInput(value) {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function createMeetingForm(locationId = '') {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    location_id: locationId,
    title: '',
    description: '',
    start_at: formatDateTimeInput(start),
    end_at: formatDateTimeInput(end)
  };
}

export default function OrgLiveSpot() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [meetingForm, setMeetingForm] = useState(() => createMeetingForm());
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [cancelingMeetingId, setCancelingMeetingId] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    const loadLiveSpot = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      setError('');
      try {
        const response = await api.get(`/orgs/${id}/live-spots`);
        if (active) setData(response.data);
      } catch (err) {
        console.error('Failed to load organization live spaces:', err);
        if (active) setError(err.response?.data?.error || 'Live Spot organisasi tidak dapat dimuat.');
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    loadLiveSpot();
    const intervalId = setInterval(loadLiveSpot, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [id, refreshKey]);

  const locations = data?.locations || [];
  const upcomingEvents = data?.upcomingEvents || [];
  const meetings = data?.meetings || [];
  const normalizedSearch = search.trim().toLowerCase();
  const visibleLocations = useMemo(() => locations.filter((location) => {
    const matchesType = filter === 'all' || location.type === filter;
    const matchesSearch = !normalizedSearch
      || [location.name, location.address, location.description, location.short_description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesType && matchesSearch;
  }), [locations, filter, normalizedSearch]);

  const meetingRooms = locations.filter((location) => location.type === 'meeting_room').length;
  const eventVenues = locations.filter((location) => location.type === 'event_venue').length;
  const ownedLocationIds = new Set(locations.map((location) => String(location.id)));
  const eventsAtSpaces = upcomingEvents.filter((event) => ownedLocationIds.has(String(event.location_id))).length;

  useEffect(() => {
    const firstMeetingRoom = locations.find((location) => location.type === 'meeting_room');
    if (firstMeetingRoom) {
      setMeetingForm((current) => current.location_id
        ? current
        : { ...current, location_id: String(firstMeetingRoom.id) });
    }
  }, [locations]);

  const handleScheduleMeeting = async (event) => {
    event.preventDefault();
    setMeetingSubmitting(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post(`/orgs/${id}/meetings`, meetingForm);
      setNotice(response.data.message || 'Meeting berhasil dijadwalkan.');
      setMeetingForm(createMeetingForm(meetingForm.location_id));
      setShowMeetingForm(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Meeting gagal dijadwalkan.');
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    setCancelingMeetingId(meetingId);
    setError('');
    setNotice('');
    try {
      const response = await api.patch(`/orgs/${id}/meetings/${meetingId}`, { action: 'cancel' });
      setNotice(response.data.message || 'Meeting berhasil dibatalkan.');
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Meeting gagal dibatalkan.');
    } finally {
      setCancelingMeetingId(null);
    }
  };

  return (
    <main className="container org-live-spot-page">
      <header className="org-live-spot-hero">
        <div>
          <div className="org-live-spot-breadcrumb">
            <Link to="/">Home</Link><span>›</span><span>{data?.organization?.name || 'Organisasi'}</span><span>›</span><strong>Live Spot &amp; Lab</strong>
          </div>
          <span className="eyebrow">Event &amp; meeting organisasi</span>
          <h1>Live Spot &amp; Venue</h1>
          <p>Kelola ruang meeting dan venue event organisasi, lalu pantau agenda yang terhubung ke lokasi tersebut.</p>
        </div>
        <div className="org-live-spot-actions">
          <span className="org-live-refresh"><i /> Sinkron otomatis · 30 dtk</span>
          <button type="button" className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)}>
            ↻ Perbarui data
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!meetingRooms || data?.organization?.status !== 'verified'}
            onClick={() => setShowMeetingForm((visible) => !visible)}
          >
            ＋ Jadwalkan meeting
          </button>
        </div>
      </header>

      {error && <div className="alert-error" role="alert">{error}</div>}
      {notice && <div className="org-workspace-notice" role="status">{notice}</div>}

      <div className="org-live-spot-note">
        <strong>Untuk event dan meeting organisasi.</strong>
        <span>Agenda memakai data tersimpan. Meeting dapat dijadwalkan di ruang organisasi; sensor okupansi dan kontrol IoT belum terhubung.</span>
      </div>

      <section className="org-live-spot-metrics" aria-label="Ringkasan fasilitas organisasi">
        <article><span>Fasilitas terhubung</span><strong>{loading ? '—' : locations.length}</strong><small>Ruang dan venue organisasi</small></article>
        <article><span>Ruang meeting</span><strong>{loading ? '—' : meetingRooms}</strong><small>Tipe meeting room</small></article>
        <article><span>Venue event</span><strong>{loading ? '—' : eventVenues}</strong><small>Tipe event venue</small></article>
        <article><span>Agenda terjadwal</span><strong>{loading ? '—' : eventsAtSpaces + meetings.length}</strong><small>Event dan meeting organisasi</small></article>
      </section>

      {showMeetingForm && (
        <section className="org-live-spot-panel org-live-meeting-form-panel">
          <div className="org-live-spot-section-heading">
            <div><span className="eyebrow">Jadwal internal</span><h2>Buat meeting organisasi</h2></div>
            <button type="button" className="org-live-close-form" onClick={() => setShowMeetingForm(false)}>Tutup</button>
          </div>
          <form className="org-live-meeting-form" onSubmit={handleScheduleMeeting}>
            <label>
              <span>Ruang meeting</span>
              <select
                required
                value={meetingForm.location_id}
                onChange={(event) => setMeetingForm({ ...meetingForm, location_id: event.target.value })}
              >
                {locations.filter((location) => location.type === 'meeting_room').map((location) => (
                  <option key={location.id} value={String(location.id)}>{location.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Nama meeting</span>
              <input
                required
                maxLength="150"
                value={meetingForm.title}
                onChange={(event) => setMeetingForm({ ...meetingForm, title: event.target.value })}
                placeholder="Contoh: Rapat koordinasi acara"
              />
            </label>
            <label>
              <span>Mulai</span>
              <input
                required
                type="datetime-local"
                min={formatDateTimeInput(new Date())}
                value={meetingForm.start_at}
                onChange={(event) => setMeetingForm({ ...meetingForm, start_at: event.target.value })}
              />
            </label>
            <label>
              <span>Selesai</span>
              <input
                required
                type="datetime-local"
                min={meetingForm.start_at}
                value={meetingForm.end_at}
                onChange={(event) => setMeetingForm({ ...meetingForm, end_at: event.target.value })}
              />
            </label>
            <label className="org-live-meeting-description">
              <span>Agenda (opsional)</span>
              <textarea
                rows="2"
                value={meetingForm.description}
                onChange={(event) => setMeetingForm({ ...meetingForm, description: event.target.value })}
                placeholder="Catatan singkat agenda meeting"
              />
            </label>
            <button type="submit" className="btn-primary" disabled={meetingSubmitting}>
              {meetingSubmitting ? 'Menyimpan...' : 'Simpan jadwal meeting'}
            </button>
          </form>
        </section>
      )}

      <div className="org-live-spot-grid">
        <section className="org-live-spot-panel">
          <div className="org-live-spot-section-heading">
            <div>
              <span className="eyebrow">Ruang organisasi</span>
              <h2>Live Spot &amp; venue terhubung</h2>
            </div>
            <Link to={`/orgs/${id}/events`}>Kelola event →</Link>
          </div>
          <div className="org-live-spot-filters">
            <label className="org-live-spot-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Cari nama ruang atau alamat..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <div className="org-live-spot-filter-tabs" aria-label="Filter tipe fasilitas">
              <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Semua ({locations.length})</button>
              <button type="button" className={filter === 'meeting_room' ? 'active' : ''} onClick={() => setFilter('meeting_room')}>Meeting ({meetingRooms})</button>
              <button type="button" className={filter === 'event_venue' ? 'active' : ''} onClick={() => setFilter('event_venue')}>Event ({eventVenues})</button>
            </div>
          </div>

          {loading && !data ? (
            <CardSkeletonList count={2} />
          ) : !visibleLocations.length ? (
            <div className="org-live-spot-empty">
              <strong>{locations.length ? 'Fasilitas tidak ditemukan' : 'Belum ada ruang atau venue terhubung'}</strong>
              <p>
                {locations.length
                  ? 'Coba ubah kata kunci atau filter fasilitas.'
                  : 'Fasilitas yang telah diverifikasi akan tampil di Campus Radar dan dapat digunakan untuk agenda organisasi.'}
              </p>
            </div>
          ) : (
            <div className="org-live-spot-cards">
              {visibleLocations.map((location) => {
                const locationEvents = upcomingEvents.filter((event) => String(event.location_id) === String(location.id));
                const locationMeetings = meetings.filter((meeting) => String(meeting.location_id) === String(location.id));
                const locationAgenda = [
                  ...locationEvents.map((event) => ({ ...event, agendaType: 'event' })),
                  ...locationMeetings.map((meeting) => ({ ...meeting, agendaType: 'meeting' }))
                ].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
                return (
                  <article className="org-live-space-card" key={location.id}>
                    <div className={`org-live-space-art ${location.type}`}>
                      <span className="org-live-space-icon" aria-hidden="true">{location.type === 'meeting_room' ? '▤' : '✦'}</span>
                      <span className="org-live-space-type">{SPACE_LABELS[location.type] || 'Fasilitas organisasi'}</span>
                      <span className="org-live-space-count">{locationAgenda.length} agenda</span>
                    </div>
                    <div className="org-live-space-content">
                      <div className="org-live-space-title">
                        <div><h3>{location.name}</h3><span>{location.address || 'Alamat belum dicantumkan'}</span></div>
                        <span className="org-live-space-approved">Terhubung</span>
                      </div>
                      <p>{location.description || location.short_description || 'Belum ada deskripsi fasilitas.'}</p>
                      <div className="org-live-space-agenda">
                        <strong>Agenda mendatang</strong>
                        {locationAgenda.length ? locationAgenda.slice(0, 3).map((agenda) => (
                          agenda.agendaType === 'event' ? (
                            <Link to={`/events/${agenda.id}`} key={`event-${agenda.id}`} className="org-live-agenda-row">
                              <span>Event · {formatDate(agenda.start_at)}</span>
                              <b>{agenda.title}</b>
                            </Link>
                          ) : (
                            <div key={`meeting-${agenda.id}`} className="org-live-agenda-row">
                              <span>Meeting · {formatDate(agenda.start_at)}</span>
                              <b>{agenda.title}</b>
                            </div>
                          )
                        )) : <span className="org-live-agenda-empty">Belum ada event atau meeting terjadwal.</span>}
                      </div>
                      <div className="org-live-space-actions">
                        <Link to={`/map?place=${location.id}`} className="btn-secondary">Lihat di peta</Link>
                        <Link to={`/orgs/${id}/settings#org-event-form`} className="btn-primary">Jadwalkan event</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="org-live-spot-side">
          <section className="org-live-spot-panel">
            <div className="org-live-spot-section-heading">
              <div><span className="eyebrow">Kalender organisasi</span><h2>Event mendatang</h2></div>
              <span className="org-live-count">{upcomingEvents.length}</span>
            </div>
            {upcomingEvents.length ? (
              <div className="org-live-agenda-list">
                {upcomingEvents.slice(0, 8).map((event) => (
                  <Link to={`/events/${event.id}`} className="org-live-agenda-card" key={event.id}>
                    <span className="org-live-agenda-date">
                      <b>{new Date(event.start_at).toLocaleDateString('id-ID', { day: '2-digit' })}</b>
                      <small>{new Date(event.start_at).toLocaleDateString('id-ID', { month: 'short' })}</small>
                    </span>
                    <span className="org-live-agenda-info">
                      <strong>{event.title}</strong>
                      <small>{formatDate(event.start_at)}</small>
                      <small>{event.location_name || 'Lokasi belum dipilih'} · {event.application_count} pendaftar</small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-state">Belum ada event mendatang. Event yang memiliki jadwal dan lokasi akan tampil di sini.</p>
            )}
          </section>

          <section className="org-live-spot-panel">
            <div className="org-live-spot-section-heading">
              <div><span className="eyebrow">Rapat internal</span><h2>Meeting mendatang</h2></div>
              <span className="org-live-count">{meetings.length}</span>
            </div>
            {meetings.length ? (
              <div className="org-live-agenda-list">
                {meetings.slice(0, 8).map((meeting) => (
                  <article className="org-live-agenda-card org-live-meeting-card" key={meeting.id}>
                    <span className="org-live-agenda-date">
                      <b>{new Date(meeting.start_at).toLocaleDateString('id-ID', { day: '2-digit' })}</b>
                      <small>{new Date(meeting.start_at).toLocaleDateString('id-ID', { month: 'short' })}</small>
                    </span>
                    <span className="org-live-agenda-info">
                      <strong>{meeting.title}</strong>
                      <small>{formatDate(meeting.start_at)} – {new Date(meeting.end_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                      <small>{meeting.location_name}</small>
                    </span>
                    <button
                      type="button"
                      className="org-live-cancel-meeting"
                      disabled={cancelingMeetingId === meeting.id}
                      onClick={() => handleCancelMeeting(meeting.id)}
                    >
                      {cancelingMeetingId === meeting.id ? '...' : 'Batalkan'}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">Belum ada meeting internal yang dijadwalkan.</p>
            )}
          </section>

        </aside>
      </div>

      <footer className="org-live-spot-footer">
        <span>Data diperbarui {data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
        <span>Lokasi hanya menampilkan fasilitas aktif yang terhubung ke organisasi ini.</span>
      </footer>
    </main>
  );
}
