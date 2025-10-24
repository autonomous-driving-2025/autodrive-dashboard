'use client';
import { useEffect, useMemo, memo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Position {
  lat: number;
  lon: number;
}

// Create custom icon to fix Leaflet default icon issue with Next.js
let DefaultIcon: L.Icon | null = null;

if (typeof window !== 'undefined') {
  DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  L.Marker.prototype.options.icon = DefaultIcon;
}

// Separate component to handle map updates
const MapUpdater = memo(({ position, path }: { position: Position | null; path: Position[] }) => {
  const map = useMap();
  const prevPositionRef = useRef<Position | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Wait for map to be ready
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        setIsMapReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map]);

  // Update view when position changes
  useEffect(() => {
    if (!isMapReady || !map || !position) return;
    
    const positionChanged = !prevPositionRef.current || 
      prevPositionRef.current.lat !== position.lat || 
      prevPositionRef.current.lon !== position.lon;
    
    if (positionChanged) {
      try {
        map.setView([position.lat, position.lon], map.getZoom(), { animate: true });
        prevPositionRef.current = position;
      } catch (error) {
        console.error('Error setting map view:', error);
      }
    }
  }, [position, map, isMapReady]);

  return null;
});

MapUpdater.displayName = 'MapUpdater';

interface MapComponentProps {
  position: Position | null;
  path?: Position[];
}

// Memoize the main component to prevent unnecessary re-renders
const MapComponent = memo(({ position = null, path = [] }: MapComponentProps) => {
  // Debug logging (throttled for performance with large paths)
  useEffect(() => {
    if (path.length % 100 === 0 || path.length < 10) {
      console.log('MapComponent - Position:', position);
      console.log('MapComponent - Path length:', path.length);
    }
  }, [position, path]);

  // Use a static default center - DO NOT change this on re-render
  const defaultCenter: [number, number] = [-7.770674369531926, 110.37788002883504];

  // Memoize polyline positions with optimization for large datasets
  // Use Douglas-Peucker-like simplification for paths > 50k points
  const polylinePositions = useMemo(() => {
    const positions = path.map(p => [p.lat, p.lon] as [number, number]);
    
    // For massive datasets (>50k points), use adaptive sampling to maintain performance
    // This keeps the path visual quality while reducing render complexity
    if (positions.length > 50000) {
      console.log(`Large path detected: ${positions.length} points, applying optimization...`);
      
      // Keep every Nth point, but always keep first and last
      // For 100k points, sample every 2nd point = 50k points
      // For 1M points, sample every 20th point = 50k points
      const targetPoints = 50000;
      const step = Math.ceil(positions.length / targetPoints);
      
      const simplified: [number, number][] = [];
      for (let i = 0; i < positions.length; i += step) {
        simplified.push(positions[i]);
      }
      // Always include the last point
      if (simplified[simplified.length - 1] !== positions[positions.length - 1]) {
        simplified.push(positions[positions.length - 1]);
      }
      
      console.log(`Path simplified from ${positions.length} to ${simplified.length} points`);
      return simplified;
    }
    
    return positions;
  }, [path]);

  // Memoize marker position
  const markerPosition = useMemo(() => {
    return position ? [position.lat, position.lon] as [number, number] : null;
  }, [position]);

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={18} 
      zoomControl={false} 
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100vw", position: "absolute", top: 0, left: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <ZoomControl position="bottomleft" />

      {markerPosition && DefaultIcon && (
        <Marker 
          position={markerPosition} 
          icon={DefaultIcon}
        />
      )}
      {polylinePositions.length > 0 && (
        <Polyline 
          positions={polylinePositions} 
          pathOptions={{ color: "red", weight: 3 }} 
        />
      )}
      <MapUpdater position={position} path={path} />
    </MapContainer>
  );
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
