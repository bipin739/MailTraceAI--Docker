import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../context/ThemeContext';

export interface MapLocation {
  ip: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  asn?: string;
  organization?: string;
  isEarliest?: boolean;
}

interface LeafletMapProps {
  locations: MapLocation[];
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ locations, height = '360px' }) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: true
      });

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const validLocs = locations.filter(l => Boolean(l.latitude && l.longitude));

    if (validLocs.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    const bounds = L.latLngBounds([]);

    validLocs.forEach(loc => {
      const isEarliest = loc.isEarliest;
      const markerHtml = `
        <div style="
          width: 24px;
          height: 24px;
          background: ${isEarliest ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
          border: 2px solid ${isEarliest ? '#fca5a5' : '#93c5fd'};
          border-radius: 50%;
          box-shadow: 0 0 10px ${isEarliest ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.6)'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        ">
          ${isEarliest ? '★' : '•'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      const popupContent = `
        <div style="color: #0f172a; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; min-width: 180px; padding: 2px;">
          <div style="font-weight: 700; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; color: #1e293b;">
            ${loc.ip} ${loc.isEarliest ? '<span style="background: #fee2e2; color: #991b1b; padding: 1px 6px; font-size: 10px; border-radius: 9999px; margin-left: 4px;">Earliest Node</span>' : ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <div><strong>Location:</strong> ${[loc.city, loc.country].filter(Boolean).join(', ') || 'Unknown'}</div>
            <div><strong>ASN:</strong> ${loc.asn || 'N/A'}</div>
            <div><strong>Organization:</strong> ${loc.organization || 'N/A'}</div>
          </div>
        </div>
      `;

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent);

      bounds.extend([loc.latitude, loc.longitude]);
    });

    if (validLocs.length === 1) {
      map.setView([validLocs[0].latitude, validLocs[0].longitude], 6);
    } else {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [locations, isDark, tileUrl]);

  // Update tile layer when isDark changes
  useEffect(() => {
    if (mapRef.current && tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
      const newLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(mapRef.current);
      tileLayerRef.current = newLayer;
    }
  }, [isDark, tileUrl]);

  return (
    <div className="relative w-full rounded-card overflow-hidden border border-border shadow-sm bg-surface">
      <div ref={containerRef} style={{ height }} className="w-full z-0" />
      <div className="absolute bottom-2 left-2 z-10 bg-surface/90 text-foreground-muted text-[10px] font-mono px-2.5 py-1 rounded-control border border-border backdrop-blur-sm">
        Observed infrastructure location estimates from IP allocation.
      </div>
    </div>
  );
};
