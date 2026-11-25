import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import PlaceMap from '../components/PlaceMap';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setData(res.data);
      if (res.data.isOwner) {
        const appRes = await api.get(`/events/${id}/applications`);
        setApplicants(appRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (!data || data.isOwner || data.myApplication?.status !== 'accepted') {
      setTicketCode('');
      setTicketError('');
      setTicketLoading(false);
      return undefined;
    }

    let active = true;
    setTicketLoading(true);
    setTicketError('');
    api.get(`/events/${id}/ticket`)
      .then((response) => {
        if (active) setTicketCode(response.data.ticketCode);
      })
      .catch((err) => {
        console.error('Failed to load event QR ticket:', err);
        if (active) setTicketError(err.response?.data?.error || 'Tiket QR tidak dapat dimuat.');
      })
      .finally(() => {
        if (active) setTicketLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, data?.isOwner, data?.myApplication?.status]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/events/${id}/apply`, { message: applyMessage });
      showToast('Application submitted! Status: Pending.');
      setApplyMessage('');
      loadEvent();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewApplicant = async (appId, action) => {
    try {
      const res = await api.patch(`/events/applications/${appId}`, { action });
      showToast(res.data.message);
      loadEvent();
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to ${action} applicant`);
    }
  };

  if (!data) {
    return <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>Loading event details...</div>;
  }

  const { event, myApplication, acceptedCount, isOwner } = data;

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      <div className="group-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <Link to={`/orgs/${event.organization_id}`} style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                🏛️ {event.org_name}
              </Link>
              {event.org_status === 'verified' && <span title="Verified">✅</span>}
            </div>
            <h2>{event.title}</h2>
          </div>
          {myApplication ? (
            <span className={`status-badge status-${myApplication.status === 'accepted' ? 'verified' : myApplication.status === 'rejected' ? 'rejected' : 'pending'}`} style={{ fontSize: '0.85rem' }}>
              APPLICATION: {myApplication.status.toUpperCase()}
            </span>
          ) : isOwner ? (
            <span className="status-badge status-verified">YOU ARE THE HOST</span>
          ) : null}
        </div>

        <p style={{ marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {event.description}
        </p>

        <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
          <span>
            📍 <strong>{event.location_name || 'Campus Venue'}</strong>
            {event.location_id && (
              <Link to={`/map?place=${event.location_id}`} style={{ marginLeft: '0.4rem', color: 'var(--primary)', fontSize: '0.8rem' }}>
                (View on Map ↗)
              </Link>
            )}
          </span>
          <span>
            🕒 <strong>Start:</strong> {new Date(event.start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
          {event.capacity && (
            <span>
              👥 <strong>Seats:</strong> {acceptedCount} / {event.capacity} accepted
            </span>
          )}
        </div>

        {event.location_id && event.latitude && event.longitude && (
          <div className="event-location-map" aria-label={`Map showing ${event.location_name}`}>
            <PlaceMap
              mini={true}
              places={[{
                id: event.location_id,
                name: event.location_name,
                short_description: event.location_address || 'Event location',
                latitude: event.latitude,
                longitude: event.longitude,
                active_people: 0
              }]}
              selectedId={event.location_id}
            />
          </div>
        )}
      </div>

      {/* Student Apply Section */}
      {!isOwner && (
        <div className="dash-card" style={{ marginTop: '1.5rem' }}>
          <h3>Apply to Attend Event</h3>
          {myApplication ? (
            <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-btn)' }}>
              <p>Your current application status is: <strong>{myApplication.status.toUpperCase()}</strong></p>
              {myApplication.message && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.3rem' }}>Note sent: "{myApplication.message}"</p>}
              {myApplication.status === 'accepted' && (
                <>
                  <p style={{ color: 'var(--ok)', fontWeight: 600, marginTop: '0.5rem' }}>
                    🎉 Pendaftaranmu diterima. Tunjukkan tiket QR ini saat check-in event.
                  </p>
                  <section className="event-ticket-card" aria-label="Tiket QR event">
                    <div>
                      <span className="eyebrow">Tiket peserta</span>
                      <h4>{event.title}</h4>
                      <p>Simpan QR ini dan tunjukkan ke panitia saat masuk. Tiket hanya dapat digunakan satu kali.</p>
                      {ticketCode && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(ticketCode);
                              showToast('Kode tiket berhasil disalin.');
                            } catch (err) {
                              console.error('Failed to copy event ticket code:', err);
                              setTicketError('Kode tidak dapat disalin. Tampilkan QR tiket kepada panitia.');
                            }
                          }}
                        >
                          Salin kode manual
                        </button>
                      )}
                    </div>
                    <div className="event-ticket-qr">
                      {ticketLoading ? (
                        <span>Memuat tiket…</span>
                      ) : ticketCode ? (
                        <QRCodeSVG value={ticketCode} size={160} level="M" includeMargin />
                      ) : (
                        <span role={ticketError ? 'alert' : undefined}>{ticketError || 'Tiket QR belum tersedia.'}</span>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleApply} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Note to Organizer (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Tell the organizer why you'd like to attend..."
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-btn)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting...' : 'Apply for Event'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Owner Review Applicants Section */}
      {isOwner && (
        <div className="dash-card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Review Applicants ({applicants.length})</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {acceptedCount} / {event.capacity || '∞'} seats filled
            </span>
          </div>

          {applicants.length === 0 ? (
            <p className="empty-state">No student applications yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {applicants.map((app) => (
                <div key={app.id} className="dash-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                      <strong>{app.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                        {app.faculty} • {app.major}
                      </span>
                    </div>
                    <span className={`status-badge status-${app.status === 'accepted' ? 'verified' : app.status === 'rejected' ? 'rejected' : 'pending'}`}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>

                  {app.message && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic' }}>
                      "{app.message}"
                    </p>
                  )}

                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                      <button
                        onClick={() => handleReviewApplicant(app.id, 'reject')}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReviewApplicant(app.id, 'accept')}
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      >
                        Accept (+20 pts to student)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
