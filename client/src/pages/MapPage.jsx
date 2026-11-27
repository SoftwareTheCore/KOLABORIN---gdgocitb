import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import PlaceMap from '../components/PlaceMap';
import { CardSkeletonList } from '../components/LoadingSkeleton';

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const { refreshProfile, user } = useAuth();
  const isOrganization = user?.role === 'organization';
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [placeSearch, setPlaceSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [placeGroups, setPlaceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  };

  const loadMapData = async () => {
    try {
      const { data } = await api.get('/locations/live');
      setPlaces(data);
      const placeQuery = searchParams.get('place');
      if (placeQuery) {
        setSelectedPlaceId(Number(placeQuery));
      } else if (data.length > 0 && !selectedPlaceId) {
        setSelectedPlaceId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load Campus Radar:', err);
      showToast(err.response?.data?.error || 'Data Campus Radar gagal dimuat.');
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
    if (!selectedPlaceId || isOrganization) {
      setPlaceGroups([]);
      return;
    }
    api.get(`/groups?location=${selectedPlaceId}`)
      .then((response) => setPlaceGroups(response.data))
      .catch((err) => console.error('Failed to load Open Party at this location:', err));
  }, [selectedPlaceId, isOrganization]);

  const normalizedSearch = placeSearch.trim().toLowerCase();
  const visiblePlaces = places.filter((place) => {
    const matchesType = !typeFilter || place.type === typeFilter;
    const matchesSearch = !normalizedSearch
      || [place.name, place.address, place.short_description, place.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesType && matchesSearch;
  });
  const selectedPlace = visiblePlaces.find((place) => place.id === selectedPlaceId);
  const placeTypes = [...new Set(places.map((place) => place.type).filter(Boolean))];

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await api.post(`/groups/${groupId}/join`);
      showToast(response.data.points?.awarded > 0
        ? `+${response.data.points.awarded} points earned!`
        : 'Berhasil bergabung dengan Open Party.');
      refreshProfile();
      await loadMapData();
      const groupsResponse = await api.get(`/groups?location=${selectedPlaceId}`);
      setPlaceGroups(groupsResponse.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Tidak dapat bergabung dengan Open Party.');
    }
  };

  const handleRate = async (rating) => {
    try {
      const response = await api.post(`/locations/${selectedPlace.id}/rating`, { rating });
      setPlaces((current) => current.map((place) => (
        place.id === selectedPlace.id ? { ...place, ...response.data } : place
      )));
      showToast('Rating tempat berhasil disimpan.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Rating tempat gagal disimpan.');
    }
  };

  return (
    <div className="map-page-layout map-stitch-page">
      {toast && <div className="toast-pill" role="status">{toast}</div>}

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

      <div className="map-view-column">
        <div className="map-top-bar">
          <div>
            <h3>Live Campus Radar</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Jumlah mahasiswa yang sedang belajar diperbarui otomatis.
            </span>
          </div>
          <span className="map-live-count">{places.length} lokasi</span>
        </div>

        <div className="map-render-container">
          <PlaceMap
            mini={false}
            places={visiblePlaces}
            selectedId={selectedPlaceId}
            onSelect={setSelectedPlaceId}
            center={selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : null}
          />
        </div>

        <div className="map-legend">
          <span><span className="legend-dot dot-blue" /> Lokasi belajar</span>
          <span><span className="legend-dot dot-orange" /> Lokasi terpilih</span>
        </div>
      </div>

      <div className="map-side-panel">
        {loading ? (
          <CardSkeletonList count={2} />
        ) : selectedPlace ? (
          <div>
            <div className="side-panel-header">
              <span className="tag-subject" style={{ textTransform: 'capitalize' }}>
                {selectedPlace.type.replace(/_/g, ' ')}
              </span>
              <h2 style={{ marginTop: '0.4rem' }}>{selectedPlace.name}</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {selectedPlace.address || 'Area kampus'}
              </p>
              <div className="place-rating-summary" aria-label={`Rating ${selectedPlace.rating.toFixed(1)} dari 5`}>
                <span aria-hidden="true">{'★'.repeat(Math.round(selectedPlace.rating))}{'☆'.repeat(5 - Math.round(selectedPlace.rating))}</span>
                <strong>{selectedPlace.rating.toFixed(1)}</strong>
                <small>({selectedPlace.rating_count} rating)</small>
              </div>
              {user?.role !== 'admin' && (
                <div className="place-rating-input" role="group" aria-label={`Beri rating untuk ${selectedPlace.name}`}>
                  <span>{selectedPlace.user_rating ? 'Rating Anda' : 'Beri rating'}</span>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      aria-label={`${rating} dari 5 bintang`}
                      aria-pressed={selectedPlace.user_rating === rating}
                      className={rating <= (selectedPlace.user_rating || 0) ? 'is-selected' : ''}
                      onClick={() => handleRate(rating)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '0.6rem' }} className="live-headcount-badge">
                ● {selectedPlace.active_people} mahasiswa belajar · {selectedPlace.active_groups} Open Party aktif
              </div>
              <p style={{ fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
                {isOrganization
                  ? selectedPlace.description || selectedPlace.short_description
                  : selectedPlace.short_description || selectedPlace.description}
              </p>
            </div>

            {!isOrganization && (
              <>
                <hr style={{ margin: '1.25rem 0', borderColor: 'var(--border)' }} />
                <div className="side-panel-groups">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4>Open Party di lokasi ini</h4>
                    <Link to="/groups/new" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      + Buat Open Party
                    </Link>
                  </div>
                  {placeGroups.length === 0 ? (
                    <p className="empty-state">Belum ada Open Party mendatang di lokasi ini.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {placeGroups.map((group) => (
                        <div key={group.id} className="group-mini-card">
                          <span className="tag-subject">{group.subject}</span>
                          <strong style={{ display: 'block', margin: '0.2rem 0' }}>{group.title}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {new Date(group.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {group.member_count}/{group.max_members} mahasiswa
                          </span>
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                            <Link to={`/groups/${group.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', flex: 1, textAlign: 'center' }}>
                              Lihat detail
                            </Link>
                            {group.is_member ? (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ok)', padding: '0.3rem 0.5rem' }}>
                                ✓ Bergabung
                              </span>
                            ) : group.status === 'full' ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '0.3rem 0.5rem' }}>
                                Penuh
                              </span>
                            ) : (
                              <button type="button" onClick={() => handleJoinGroup(group.id)} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                                Gabung
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
            {places.length === 0 ? 'Belum ada lokasi aktif di Campus Radar.' : 'Pilih lokasi yang terlihat untuk membaca detailnya.'}
          </div>
        )}
      </div>
    </div>
  );
}
