import { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';

const RestaurantMap = ({ latitude, longitude, name, address }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 1. Load Leaflet CSS
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Load Leaflet Script
    const scriptId = 'leaflet-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      // Leaflet script was already loaded, check if L exists
      if (window.L) {
        setLoaded(true);
      } else {
        const interval = setInterval(() => {
          if (window.L) {
            setLoaded(true);
            clearInterval(interval);
          }
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    if (!loaded || !window.L || !mapContainerRef.current) return;

    // Parse coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    // Clean up previous map if exists
    if (mapRef.current) {
      mapRef.current.remove();
    }

    // Initialize map
    const L = window.L;
    const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
    mapRef.current = map;

    // Add TileLayer (OpenStreetMap tiles)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add Marker
    L.marker([lat, lng]).addTo(map)
      .bindPopup(`<b>${name}</b><br>${address}`)
      .openPopup();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loaded, latitude, longitude, name, address]);

  if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-serif font-bold text-brown-900 text-xl flex items-center gap-2">
        <MapPin className="text-gold-500" size={20} /> Location & Directions
      </h3>
      <div 
        ref={mapContainerRef} 
        className="w-full h-80 rounded-2xl border border-gold-500/20 shadow-md relative z-10 overflow-hidden"
        style={{ minHeight: '300px' }}
      />
      <p className="text-xs text-brown-500 italic mt-1.5 flex items-center gap-1">
        📍 Coordinates: {latitude}, {longitude}
      </p>
    </div>
  );
};

export default RestaurantMap;
