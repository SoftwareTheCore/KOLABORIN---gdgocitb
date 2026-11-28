import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import {
  decodeQrFromImage,
  getQrCameraErrorMessage,
  getQrImageErrorMessage,
  startQrCamera
} from '../utils/qrScanner';

const STATUS_LABELS = {
  pending: 'Menunggu',
  accepted: 'Diterima',
  rejected: 'Ditolak'
};

function getStatusClass(status) {
  if (status === 'accepted') return 'verified';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function formatDate(value) {
  if (!value) return 'Waktu belum ditentukan';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function exportApplications(applications) {
  const rows = [
    ['Event', 'Nama', 'Fakultas', 'Program studi', 'Status', 'Waktu daftar', 'Pesan'],
    ...applications.map((application) => [
      application.event_title || '',
      application.name || '',
      application.faculty || '',
      application.major || '',
      STATUS_LABELS[application.status] || application.status,
      formatDate(application.applied_at),
      application.message || ''
    ])
  ];
  const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = `\uFEFF${rows.map((row) => row.map(quote).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kolaborin-pendaftar-event.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function QrGateScanner({ eventId, eventTitle, eventStatus, onCheckedIn }) {
  const videoRef = useRef(null);
  const checkTicketRef = useRef(null);
  const checkingRef = useRef(false);
  const lastScanRef = useRef({ code: '', at: 0 });
  const checkedCodesRef = useRef(new Set());
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [cameraStarting, setCameraStarting] = useState(false);

  const checkTicket = async (value) => {
    const ticketCode = typeof value === 'string' ? value.trim() : '';
    if (!ticketCode || !eventId || checkingRef.current) return;

    checkingRef.current = true;
    setChecking(true);
    setFeedback(null);
    try {
      const response = await api.post(`/events/${eventId}/check-ins`, { ticket_code: ticketCode });
      checkedCodesRef.current.add(ticketCode);
      setManualCode('');
      setFeedback({ type: 'success', ...response.data });
      onCheckedIn();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Tiket tidak dapat divalidasi.'
      });
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  };
  checkTicketRef.current = checkTicket;

  useEffect(() => {
    if (!cameraActive) return undefined;
    if (!eventId || eventStatus !== 'published') {
      setCameraStarting(false);
      setCameraActive(false);
      return undefined;
    }

    let active = true;
    let scannerControls;
    const startScanner = async () => {
      try {
        scannerControls = await startQrCamera(videoRef.current, (value) => {
          if (!active) return;
          const code = value.trim();
          const now = Date.now();
          if (!code || checkedCodesRef.current.has(code)) return;
          if (lastScanRef.current.code === code && now - lastScanRef.current.at < 4000) return;
          lastScanRef.current = { code, at: now };
          checkTicketRef.current?.(code);
        });
        if (active) setCameraStarting(false);
        else scannerControls.stop();
      } catch (err) {
        if (!active) return;
        console.error('Unable to start QR camera scanner:', err);
        setScannerError(getQrCameraErrorMessage(err));
        setCameraStarting(false);
        setCameraActive(false);
      }
    };
    startScanner();

    return () => {
      active = false;
      scannerControls?.stop();
    };
  }, [cameraActive, eventId, eventStatus]);

  const handleManualSubmit = (event) => {
    event.preventDefault();
    checkTicket(manualCode);
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setScannerError('');
    setFeedback(null);
    try {
      const code = await decodeQrFromImage(file);
      await checkTicket(code);
    } catch (err) {
      console.error('Unable to decode event QR image:', err);
      setScannerError(getQrImageErrorMessage(err));
    }
  };

  return (
    <section className="org-qr-scanner-panel">
      <header className="org-qr-scanner-heading">
        <div>
          <span className="eyebrow">Check-in peserta</span>
          <h2>Live QR Gate Scanner</h2>
        </div>
        <span className={`org-qr-live-indicator ${cameraActive ? 'is-active' : ''}`}>
          <i /> {cameraStarting ? 'Menghubungkan kamera' : cameraActive ? 'Kamera siap' : 'Gate siap'}
        </span>
      </header>
      <p className="org-qr-selected-event">
        {eventTitle ? `Tiket yang dipindai akan divalidasi untuk: ${eventTitle}` : 'Pilih event untuk mulai check-in.'}
      </p>

      <div className={`org-qr-viewfinder ${cameraActive ? 'is-camera-active' : ''}`}>
        {cameraActive ? (
          <video ref={videoRef} className="org-qr-video" autoPlay muted playsInline />
        ) : (
          <div className="org-qr-camera-placeholder">
            <span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
            <strong>Arahkan QR tiket peserta ke kamera</strong>
            <small>Gunakan kode tiket pribadi dari halaman detail event.</small>
          </div>
        )}
        {cameraActive && <div className="org-qr-reticle" aria-hidden="true"><i /></div>}
      </div>

      <div className="org-qr-camera-actions">
        <button
          type="button"
          className={cameraActive ? 'btn-secondary' : 'btn-primary'}
          onClick={() => {
            setScannerError('');
            if (cameraActive) {
              setCameraActive(false);
              setCameraStarting(false);
            } else {
              setCameraStarting(true);
              setCameraActive(true);
            }
          }}
          disabled={!eventId || eventStatus !== 'published' || cameraStarting}
        >
          {cameraStarting ? 'Menghubungkan kamera…' : cameraActive ? 'Hentikan kamera' : 'Mulai scan dengan kamera'}
        </button>
        {(!eventId || eventStatus !== 'published') && (
          <small>Pilih event yang dipublikasikan untuk mengaktifkan scanner.</small>
        )}
      </div>

      {scannerError && <p className="org-qr-feedback is-error" role="alert">{scannerError}</p>}
      {feedback && (
        <div className={`org-qr-feedback ${feedback.type === 'success' ? 'is-success' : 'is-error'}`} role={feedback.type === 'success' ? 'status' : 'alert'}>
          <strong>
            <span className="material-symbols-outlined" aria-hidden="true">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {feedback.type === 'success' ? 'Check-in berhasil' : 'Check-in gagal'}
          </strong>
          <span>{feedback.type === 'success' ? feedback.attendee?.name : feedback.message}</span>
          {feedback.type === 'success' && feedback.attendee && (
            <small>
              {[feedback.attendee.major, feedback.attendee.faculty].filter(Boolean).join(' · ')}
              {feedback.attendee.checked_in_at
                ? ` · ${new Date(feedback.attendee.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </small>
          )}
        </div>
      )}

      <label className="org-qr-image-upload" htmlFor="event-ticket-image">
        <span className="material-symbols-outlined" aria-hidden="true">image</span>
        Scan QR dari foto atau gambar
        <input
          id="event-ticket-image"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          disabled={checking || !eventId || eventStatus !== 'published'}
        />
      </label>

      <form className="org-qr-manual-form" onSubmit={handleManualSubmit}>
        <label htmlFor="manual-event-ticket">Validasi manual jika kamera terkendala</label>
        <div>
          <input
            id="manual-event-ticket"
            autoComplete="off"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Tempel kode tiket QR"
            disabled={!eventId || eventStatus !== 'published' || checking}
          />
          <button type="submit" className="btn-primary" disabled={!manualCode.trim() || checking || !eventId || eventStatus !== 'published'}>
            {checking ? 'Memvalidasi…' : 'Validasi'}
          </button>
        </div>
        <small>Kode hanya berlaku untuk satu event dan satu kali check-in.</small>
      </form>
    </section>
  );
}

export default function OrgEventWorkspace({ mode = 'events' }) {
  const { id } = useParams();
  const isRecruitmentView = mode === 'recruitment';
  const [organization, setOrganization] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/orgs/${id}/events`);
        if (!active) return;
        const nextEvents = response.data.events || [];
        setOrganization(response.data.organization);
        setEvents(nextEvents);
        setSelectedEventId((current) => (
          nextEvents.some((event) => String(event.id) === String(current))
            ? String(current)
            : String(nextEvents[0]?.id || '')
        ));
      } catch (err) {
        console.error('Failed to load organization events:', err);
        if (active) setError(err.response?.data?.error || 'Event organisasi tidak dapat dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      active = false;
    };
  }, [id, refreshKey]);

  useEffect(() => {
    let active = true;
    const loadApplications = async () => {
      if (!isRecruitmentView && !selectedEventId) {
        setApplications([]);
        setApplicationsLoading(false);
        return;
      }

      setApplicationsLoading(true);
      setError('');
      try {
        const response = isRecruitmentView
          ? await api.get(`/orgs/${id}/applications`)
          : await api.get(`/events/${selectedEventId}/applications`);
        if (active) setApplications(response.data);
      } catch (err) {
        console.error('Failed to load event applications:', err);
        if (active) setError(err.response?.data?.error || 'Data pendaftar tidak dapat dimuat.');
      } finally {
        if (active) setApplicationsLoading(false);
      }
    };

    loadApplications();
    return () => {
      active = false;
    };
  }, [id, isRecruitmentView, selectedEventId, refreshKey]);

  const selectedEvent = events.find((event) => String(event.id) === String(selectedEventId));
  const scopedApplications = useMemo(() => {
    if (isRecruitmentView && eventFilter !== 'all') {
      return applications.filter((application) => String(application.event_id) === eventFilter);
    }
    return applications;
  }, [applications, eventFilter, isRecruitmentView]);

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedApplications.filter((application) => {
      const matchesStatus = statusFilter === 'all'
        || application.status === statusFilter
        || (statusFilter === 'checked_in' && Boolean(application.checked_in_at))
        || (statusFilter === 'not_checked_in' && application.status === 'accepted' && !application.checked_in_at);
      const searchable = [
        application.name,
        application.faculty,
        application.major,
        application.event_title,
        application.message
      ].filter(Boolean);
      const matchesSearch = !query || searchable.some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [scopedApplications, search, statusFilter]);

  const counts = useMemo(() => scopedApplications.reduce((result, application) => {
    result.total += 1;
    if (application.status in result) result[application.status] += 1;
    return result;
  }, { total: 0, pending: 0, accepted: 0, rejected: 0 }), [scopedApplications]);

  const summary = isRecruitmentView
    ? counts
    : {
      total: selectedEvent?.application_count || 0,
      pending: selectedEvent?.pending_count || 0,
      accepted: selectedEvent?.accepted_count || 0,
      rejected: selectedEvent?.rejected_count || 0
    };
  const acceptedApplications = applications.filter((application) => application.status === 'accepted');
  const checkedInCount = acceptedApplications.filter((application) => application.checked_in_at).length;
  const notCheckedInCount = acceptedApplications.length - checkedInCount;
  const attendanceRate = acceptedApplications.length
    ? Math.round((checkedInCount / acceptedApplications.length) * 100)
    : 0;

  const handleReview = async (applicationId, action) => {
    setReviewingId(applicationId);
    setNotice('');
    try {
      const response = await api.patch(`/events/applications/${applicationId}`, { action });
      setNotice(response.data.message || 'Status pendaftar berhasil diperbarui.');
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Status pendaftar gagal diperbarui.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <main className="container org-workspace-page">
      <header className="org-workspace-hero">
        <div className="org-manage-identity">
          <div className="org-manage-mark" aria-hidden="true">
            {organization?.name?.trim().charAt(0).toUpperCase() || 'K'}
          </div>
          <div>
            <span className="eyebrow">{organization?.name || 'Workspace organisasi'}</span>
            <h1>{isRecruitmentView ? 'Rekrutmen & Anggota' : 'Event & Workshop'}</h1>
            <p>
              {isRecruitmentView
                ? 'Tinjau dan kelola pendaftar pada seluruh event organisasi.'
                : 'Pantau event organisasi dan kelola pengajuan peserta berdasarkan data aktual.'}
            </p>
          </div>
        </div>
        <div className="org-workspace-actions">
          <button type="button" className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)}>
            ↻ Perbarui data
          </button>
          <Link to={`/orgs/${id}/settings`} className="btn-secondary">Pengaturan</Link>
          {!isRecruitmentView && (
            <Link to={`/orgs/${id}/settings#org-event-form`} className="btn-primary">＋ Buat event</Link>
          )}
        </div>
      </header>

      {error && <div className="alert-error" role="alert">{error}</div>}
      {notice && <div className="org-workspace-notice" role="status">{notice}</div>}

      {organization?.status === 'pending' && (
        <div className="org-pending-banner">
          <span aria-hidden="true">!</span>
          <div><strong>Menunggu verifikasi</strong><p>Pengelolaan event aktif setelah organisasi diverifikasi.</p></div>
        </div>
      )}

      {isRecruitmentView && (
        <div className="org-recruitment-note">
          <strong>Rekrutmen yang tersedia saat ini adalah pendaftaran peserta event.</strong>
          <span>Data seleksi anggota organisasi belum tersedia di sistem.</span>
        </div>
      )}

      <section className="org-workspace-overview">
        <div className="org-workspace-event-picker">
          <label htmlFor={isRecruitmentView ? 'recruitment-event-filter' : 'organization-event'}>
            {isRecruitmentView ? 'Filter event' : 'Pilih event'}
          </label>
          {isRecruitmentView ? (
            <select
              id="recruitment-event-filter"
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value)}
            >
              <option value="all">Semua event</option>
              {events.map((event) => <option key={event.id} value={String(event.id)}>{event.title}</option>)}
            </select>
          ) : (
            <select
              id="organization-event"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={!events.length}
            >
              {events.length
                ? events.map((event) => (
                  <option key={event.id} value={String(event.id)}>
                    {event.title} · {formatDate(event.start_at)}
                  </option>
                ))
                : <option value="">Belum ada event</option>}
            </select>
          )}
          {selectedEvent && !isRecruitmentView && (
            <p>{formatDate(selectedEvent.start_at)} · {selectedEvent.location_name || 'Lokasi belum ditentukan'} · {selectedEvent.status}</p>
          )}
        </div>
        {isRecruitmentView ? (
          <div className="org-workspace-kpis">
            <article><span>Pendaftar</span><strong>{loading ? '—' : summary.total}</strong></article>
            <article><span>Menunggu review</span><strong>{loading ? '—' : summary.pending}</strong></article>
            <article><span>Diterima</span><strong>{loading ? '—' : summary.accepted}</strong></article>
            <article><span>Ditolak</span><strong>{loading ? '—' : summary.rejected}</strong></article>
          </div>
        ) : (
          <div className="org-event-checkin-kpis" aria-label="Ringkasan peserta event">
            <article>
              <span>Pendaftar terkonfirmasi</span>
              <strong>{applicationsLoading ? '—' : `${acceptedApplications.length}${selectedEvent?.capacity ? ` / ${selectedEvent.capacity}` : ''}`}</strong>
              <small>{summary.total} pendaftar tercatat</small>
            </article>
            <article>
              <span>Kehadiran QR</span>
              <strong>{applicationsLoading ? '—' : checkedInCount}</strong>
              <small>{attendanceRate}% dari peserta diterima</small>
            </article>
            <article>
              <span>Belum check-in</span>
              <strong>{applicationsLoading ? '—' : notCheckedInCount}</strong>
              <small>Peserta diterima menunggu scan</small>
            </article>
            <article>
              <span>Menunggu review</span>
              <strong>{applicationsLoading ? '—' : applications.filter((application) => application.status === 'pending').length}</strong>
              <small>Perlu tindak lanjut organisasi</small>
            </article>
          </div>
        )}
      </section>

      <div className={`org-event-workspace-grid ${isRecruitmentView ? 'is-recruitment-view' : ''}`}>
      <section className="org-applicant-panel">
        <div className="org-applicant-heading">
          <div>
            <span className="eyebrow">{isRecruitmentView ? 'Antrian organisasi' : 'Manajemen peserta'}</span>
            <h2>{isRecruitmentView ? 'Pendaftar event' : 'Daftar pendaftar'}</h2>
            <p>Data identitas dan status diambil dari pendaftaran event yang tersimpan.</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportApplications(visibleApplications)}
            disabled={!visibleApplications.length}
          >
            ↓ Ekspor CSV
          </button>
        </div>
        <div className="org-applicant-filters">
          <label className="org-applicant-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, fakultas, program studi..."
            />
          </label>
          <label>
            <select aria-label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Semua status</option>
              {!isRecruitmentView && <option value="checked_in">Sudah check-in</option>}
              {!isRecruitmentView && <option value="not_checked_in">Belum check-in</option>}
              <option value="pending">Menunggu review</option>
              <option value="accepted">Diterima</option>
              <option value="rejected">Ditolak</option>
            </select>
          </label>
        </div>

        {loading || applicationsLoading ? (
          <p className="empty-state">Memuat daftar pendaftar...</p>
        ) : !events.length && !isRecruitmentView ? (
          <div className="org-workspace-empty">
            <strong>Belum ada event organisasi</strong>
            <p>Buat event terlebih dahulu agar pendaftar dapat muncul di halaman ini.</p>
            <Link to={`/orgs/${id}/settings#org-event-form`} className="btn-primary">Buat event</Link>
          </div>
        ) : visibleApplications.length === 0 ? (
          <p className="empty-state">
            {applications.length ? 'Tidak ada pendaftar yang cocok dengan filter.' : 'Belum ada pendaftar untuk event ini.'}
          </p>
        ) : (
          <div className="org-applicant-list">
            {visibleApplications.map((application) => (
              <article className="org-applicant-row" key={application.id}>
                <span className="org-applicant-avatar">
                  {application.name?.trim().charAt(0).toUpperCase() || '?'}
                </span>
                <div className="org-applicant-copy">
                  <strong>{application.name}</strong>
                  <small>{[application.major, application.faculty].filter(Boolean).join(' · ') || 'Informasi akademik tidak tersedia'}</small>
                  {isRecruitmentView && <small className="org-applicant-event">{application.event_title}</small>}
                  {application.message && <small className="org-applicant-message">{application.message}</small>}
                </div>
                <div className="org-applicant-time">
                  <span className={`status-badge status-${getStatusClass(application.status)}`}>
                    {STATUS_LABELS[application.status] || application.status}
                  </span>
                  {application.status === 'accepted' && !isRecruitmentView ? (
                    <small className={application.checked_in_at ? 'org-checkin-status is-checked-in' : 'org-checkin-status'}>
                      {application.checked_in_at
                        ? `Hadir · ${formatDate(application.checked_in_at)}`
                        : 'Belum check-in'}
                    </small>
                  ) : (
                    <small>{formatDate(application.applied_at)}</small>
                  )}
                </div>
                {application.status === 'pending' && (
                  <div className="org-applicant-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={reviewingId !== null}
                      onClick={() => handleReview(application.id, 'accept')}
                    >
                      Terima
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={reviewingId !== null}
                      onClick={() => handleReview(application.id, 'reject')}
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      {!isRecruitmentView && (
        <QrGateScanner
          eventId={selectedEventId}
          eventTitle={selectedEvent?.title}
          eventStatus={selectedEvent?.status}
          onCheckedIn={() => setRefreshKey((key) => key + 1)}
        />
      )}
      </div>
    </main>
  );
}
