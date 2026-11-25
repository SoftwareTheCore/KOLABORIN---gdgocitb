import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import PlaceMap from '../components/PlaceMap';

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile, user, extra } = useAuth();
  const isOrganization = user?.role === 'organization';

  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [placeSearch, setPlaceSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [placeGroups, setPlaceGroups] = useState([]);
  const [pendingPins, setPendingPins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Place request mode
  const [pickMode, setPickMode] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pickedLatLng, setPickedLatLng] = useState(null);
  const [placeForm, setPlaceForm] = useState({
    name: '',
    type: searchParams.get('organization') ? 'meeting_room' : 'study_spot',
    address: '',
    short_description: ''
  });
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadMapData = async () => {
    try {
      const [resLive, resMine] = await Promise.all([
        api.get('/locations/live'),
        api.get('/place-requests/mine')
      ]);
      setPlaces(resLive.data);
      setPendingPins(resMine.data.filter(r => r.status === 'pending'));

      // Check URL query parameter ?place=<id>
      const placeQuery = searchParams.get('place');
      if (placeQuery) {
        setSelectedPlaceId(parseInt(placeQuery, 10));
      } else if (resLive.data.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(resLive.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
    const interval = setInterval(loadMapData, 30000);
    return () => clearInterval(interval);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('request') === '1') {
      setPickMode(true);
    }
  }, [searchParams]);

  // When selected place changes, fetch groups at this place
  useEffect(() => {
    if (!selectedPlaceId || isOrganization) {
      setPlaceGroups([]);
      return;
    }
    api.get(`/groups?location=${selectedPlaceId}`)
      .then(res => setPlaceGroups(res.data))
      .catch(console.error);
  }, [selectedPlaceId, isOrganization]);

  const normalizedPlaceSearch = placeSearch.trim().toLowerCase();
  const visiblePlaces = places.filter((place) => {
    const matchesType = !typeFilter || place.type === typeFilter;
    const matchesSearch = !normalizedPlaceSearch
      || [place.name, place.address, place.short_description, place.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedPlaceSearch));
    return matchesType && matchesSearch;
  });
  const selectedPlace = visiblePlaces.find((place) => place.id === selectedPlaceId);
  const placeTypes = [...new Set(places.map((place) => place.type).filter(Boolean))];

  // Handle map pick for place request
  const handleMapPick = (latlng) => {
    setPickedLatLng(latlng);
    setPickMode(false);
    setShowRequestModal(true);
  };

  const submitPlaceRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/place-requests', {
        name: placeForm.name,
        type: placeForm.type,
        address: placeForm.address,
        short_description: placeForm.short_description,
        latitude: pickedLatLng.lat,
        longitude: pickedLatLng.lng,
        organization_id: user?.role === 'organization'
          ? searchParams.get('organization') || extra?.ownedOrgs?.[0]?.id || null
          : null
      });
      setShowRequestModal(false);
      setPlaceForm({
        name: '',
        type: searchParams.get('organization') ? 'meeting_room' : 'study_spot',
        address: '',
        short_description: ''
      });
      showToast('Place request submitted! Pending admin review.');
      loadMapData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit place request');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const res = await api.post(`/groups/${groupId}/join`);
      showToast(res.data.points?.awarded > 0 ? `+${res.data.points.awarded} points earned! 🎉` : 'Joined group successfully!');
      refreshProfile();
      loadMapData();
      // Refetch place groups
      const gRes = await api.get(`/groups?location=${selectedPlaceId}`);
      setPlaceGroups(gRes.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not join group');
    }
  };

  return (
    <div className="map-page-layout map-stitch-page">
      {/* Toast Alert */}
      {toast && <div className="toast-pill">{toast}</div>}

      <section className="map-discovery-header">
        <div className="map-discovery-topline">
          <div>
            <span className="eyebrow">ITB Ganesha · Radar kampus</span>
            <h1>Temukan spot belajar di sekitar</h1>
          </div>
          <span className="map-live-count"><span aria-hidden="true">●</span> {places.length} lokasi terpantau</span>
        </div>
        <div className="map-discovery-controls">
          <label className="map-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Cari gedung, spot, atau fasilitas..."
              value={placeSearch}
              onChange={(event) => setPlaceSearch(event.target.value)}
            />
          </label>
          <div className="map-type-filters" aria-label="Filter tipe lokasi">
            <button type="button" className={!typeFilter ? 'active' : ''} onClick={() => setTypeFilter('')}>
              Semua spot
            </button>
            {placeTypes.map((type) => (
              <button type="button" className={typeFilter === type ? 'active' : ''} key={type} onClick={() => setTypeFilter(type)}>
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pick mode banner */}
      {pickMode && (
        <div className="pick-mode-banner">
          <span>📍 Click on the map to choose the new place location</span>
          <button onClick={() => setPickMode(false)} className="btn-secondary" style={{ color: '#fff', borderColor: '#fff' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Map Column */}
      <div className="map-view-column">
        <div className="map-top-bar">
          <div>
            <h3>Live Campus Radar</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              🟢 Live numbers estimate people studying now
            </span>
          </div>
          <button
            onClick={() => setPickMode(true)}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            📍 Request a Place
          </button>
        </div>

        <div className="map-render-container">
          <PlaceMap
            mini={false}
            places={visiblePlaces}
            selectedId={selectedPlaceId}
            onSelect={(id) => setSelectedPlaceId(id)}
            pendingPins={pendingPins}
            pickMode={pickMode}
            onPick={handleMapPick}
            center={selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : null}
          />
        </div>

        {/* Legend */}
        <div className="map-legend">
          <span><span className="legend-dot dot-blue"></span> Lokasi belajar</span>
          <span><span className="legend-dot dot-orange"></span> Lokasi terpilih</span>
          <span><span className="legend-dot dot-grey"></span> Menunggu verifikasi</span>
        </div>
      </div>

      {/* Side Panel Column */}
      <div className="map-side-panel">
        {selectedPlace ? (
          <div>
            <div className="side-panel-header">
              <span className="tag-subject" style={{ textTransform: 'capitalize' }}>
                {selectedPlace.type.replace('_', ' ')}
              </span>
              <h2 style={{ marginTop: '0.4rem' }}>{selectedPlace.name}</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {selectedPlace.address || 'Campus Area'}
              </p>
              <div style={{ marginTop: '0.6rem' }} className="live-headcount-badge">
                🟢 {selectedPlace.active_people} people studying now ({selectedPlace.active_groups} active groups)
              </div>
              <p style={{ fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: 1.4 }}>
                {selectedPlace.description || selectedPlace.short_description}
              </p>
            </div>

            {!isOrganization && (
              <>
                <hr style={{ margin: '1.25rem 0', borderColor: 'var(--border)' }} />

                <div className="side-panel-groups">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4>Open Party di lokasi ini</h4>
                    <Link to="/groups/new" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      + New Group
                    </Link>
                  </div>

                  {placeGroups.length === 0 ? (
                    <p className="empty-state">No upcoming study groups at this location. Be the first to start one!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {placeGroups.map(g => (
                        <div key={g.id} className="group-mini-card">
                          <span className="tag-subject">{g.subject}</span>
                          <strong style={{ display: 'block', margin: '0.2rem 0' }}>{g.title}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            🕒 {new Date(g.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {g.member_count}/{g.max_members} members
                          </span>
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                            <Link to={`/groups/${g.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', flex: 1, textAlign: 'center' }}>
                              Open Space
                            </Link>
                            {g.is_member ? (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ok)', padding: '0.3rem 0.5rem' }}>
                                ✓ Joined
                              </span>
                            ) : g.status === 'full' ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '0.3rem 0.5rem' }}>
                                Full
                              </span>
                            ) : (
                              <button
                                onClick={() => handleJoinGroup(g.id)}
                                className="btn-primary"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                              >
                                Join (+5 pts)
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: '3rem' }}>
            {isOrganization
              ? 'Select a location on the map to see its details.'
              : 'Select a location on the map to see details and study groups.'}
          </div>
        )}
      </div>

      {/* Modal Request a Place */}
      {showRequestModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>📍 Request a New Place</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem', marginBottom: '1rem' }}>
              Submit a campus study spot or meeting room for admin approval.
            </p>
            <form onSubmit={submitPlaceRequest}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Place Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ruang Diskusi Lt. 3"
                  value={placeForm.name}
                  onChange={e => setPlaceForm({ ...placeForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Place Type *</label>
                <select
                  value={placeForm.type}
                  onChange={e => setPlaceForm({ ...placeForm, type: e.target.value })}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-btn)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                >
                  <option value="study_spot">Study Spot</option>
                  <option value="meeting_room">Meeting Room</option>
                  <option value="event_venue">Event Venue</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Address / Building Location</label>
                <input
                  type="text"
                  placeholder="e.g. Labtek V STEI Lt. 3"
                  value={placeForm.address}
                  onChange={e => setPlaceForm({ ...placeForm, address: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Short Description (max 200 chars)</label>
                <textarea
                  maxLength={200}
                  rows={3}
                  placeholder="Deskripsi fasilitas, colokan, Wi-Fi..."
                  value={placeForm.short_description}
                  onChange={e => setPlaceForm({ ...placeForm, short_description: e.target.value })}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-btn)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
