import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Vite leaflet default icon path issues
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom HTML DivIcon showing live headcount numbers
function createPlaceIcon(count, isSelected = false) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="marker-pin ${isSelected ? 'marker-selected' : ''}">
        <span class="marker-count">${count}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [0, -18]
  });
}

function createPendingIcon() {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="marker-pin marker-pending">
        <span class="marker-count">⏳</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    tooltipAnchor: [0, -16]
  });
}

// Controller component for map interaction
function MapController({ pickMode, onPick, center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  useEffect(() => {
    if (!pickMode || !onPick) return;

    const handleClick = (e) => {
      onPick(e.latlng);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, pickMode, onPick]);

  return null;
}

export default function PlaceMap({
  mini = false,
  places = [],
  selectedId = null,
  onSelect = () => {},
  pendingPins = [],
  pickMode = false,
  onPick = null,
  center = null
}) {
  const defaultCenter = [
    parseFloat(import.meta.env.VITE_MAP_LAT || '-6.8893'),
    parseFloat(import.meta.env.VITE_MAP_LNG || '107.6104')
  ];

  const mapCenter = center || defaultCenter;

  return (
    <div className={`placemap-wrapper ${mini ? 'placemap-mini' : 'placemap-full'}`}>
      <MapContainer
        center={mapCenter}
        zoom={mini ? 15 : 16}
        scrollWheelZoom={!mini}
        dragging={!mini}
        touchZoom={!mini}
        doubleClickZoom={!mini}
        boxZoom={!mini}
        keyboard={!mini}
        style={{ width: '100%', height: '100%', borderRadius: mini ? 'var(--radius-btn)' : 'var(--radius-card)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController pickMode={pickMode} onPick={onPick} center={center} />

        {/* Active Locations Pins */}
        {places.map((place) => {
          const isSelected = selectedId === place.id;
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createPlaceIcon(place.active_people || 0, isSelected)}
              eventHandlers={{
                click: () => onSelect(place.id)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="map-tooltip-content">
                  <strong>{place.name}</strong>
                  {place.short_description && <p>{place.short_description}</p>}
                  <span className="tooltip-live-tag">
                    🟢 {place.active_people || 0} people studying now
                  </span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Pending Place Requests (Grey dashed markers) */}
        {pendingPins.map((req) => (
          <Marker
            key={`pending-${req.id}`}
            position={[req.latitude, req.longitude]}
            icon={createPendingIcon()}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="map-tooltip-content">
                <strong>{req.name} (Pending Approval)</strong>
                <p>Status: Under admin review</p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
