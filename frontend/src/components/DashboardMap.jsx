import { useEffect, useState, useRef, useMemo } from 'react';
import { MapPin, Navigation, Locate, Layers, X } from 'lucide-react';

const DashboardMap = ({ restaurants = [] }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [mapStyle, setMapStyle] = useState('default'); // 'default' | 'dark' | 'satellite'

  // Filter restaurants that have valid coordinates
  const mappableRestaurants = useMemo(() => {
    return restaurants.filter(
      (r) => r.latitude && r.longitude && !isNaN(parseFloat(r.latitude)) && !isNaN(parseFloat(r.longitude))
    );
  }, [restaurants]);

  // Load Leaflet CSS + JS
  useEffect(() => {
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
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

  // Tile layer URLs
  const tileLayers = {
    default: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    dark: {
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
  };

  // Initialize map
  useEffect(() => {
    if (!loaded || !window.L || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const L = window.L;

    // Center on India by default, or first restaurant
    let defaultCenter = [20.5937, 78.9629];
    let defaultZoom = 5;

    if (mappableRestaurants.length > 0) {
      const lats = mappableRestaurants.map((r) => parseFloat(r.latitude));
      const lngs = mappableRestaurants.map((r) => parseFloat(r.longitude));
      defaultCenter = [
        lats.reduce((a, b) => a + b, 0) / lats.length,
        lngs.reduce((a, b) => a + b, 0) / lngs.length,
      ];
      defaultZoom = 12;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView(defaultCenter, defaultZoom);
    mapRef.current = map;

    // Add zoom control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add tile layer
    const tileConfig = tileLayers[mapStyle];
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    // Create markers layer group
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Add restaurant markers
    addRestaurantMarkers(L, map);

    // Fit bounds to show all restaurants
    if (mappableRestaurants.length > 1) {
      const bounds = L.latLngBounds(
        mappableRestaurants.map((r) => [parseFloat(r.latitude), parseFloat(r.longitude)])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loaded, mapStyle]);

  // Update markers when restaurants change
  useEffect(() => {
    if (!loaded || !window.L || !mapRef.current || !markersLayerRef.current) return;
    const L = window.L;
    markersLayerRef.current.clearLayers();
    addRestaurantMarkers(L, mapRef.current);
  }, [mappableRestaurants, loaded]);

  const addRestaurantMarkers = (L, map) => {
    if (!markersLayerRef.current) return;

    mappableRestaurants.forEach((restaurant) => {
      const lat = parseFloat(restaurant.latitude);
      const lng = parseFloat(restaurant.longitude);

      // Custom icon
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #D4AF37, #3E2723);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(212,175,55,0.4);
            border: 2.5px solid white;
            cursor: pointer;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 14px;
              line-height: 1;
            ">🍽️</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      const ratingColor =
        restaurant.rating >= 4.0
          ? '#D4AF37'
          : restaurant.rating >= 3.0
          ? '#C5A880'
          : restaurant.rating
          ? '#3E2723'
          : '#9CA3AF';

      const ratingText = restaurant.rating ? restaurant.rating.toFixed(1) : 'New';

      const popupContent = `
        <div style="font-family: 'Inter', system-ui, sans-serif; min-width: 220px; max-width: 260px;">
          <div style="margin-bottom: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <h3 style="font-size: 15px; font-weight: 800; color: #1c1917; margin: 0; line-height: 1.2;">${restaurant.name}</h3>
              <span style="
                background: ${ratingColor};
                color: white;
                font-size: 11px;
                font-weight: 700;
                padding: 2px 7px;
                border-radius: 4px;
                white-space: nowrap;
                flex-shrink: 0;
              ">★ ${ratingText}</span>
            </div>
            <p style="font-size: 12px; color: #78716c; margin: 0;">${restaurant.cuisine || ''}</p>
          </div>
          <div style="font-size: 11px; color: #a8a29e; display: flex; align-items: center; gap: 4px; margin-bottom: 10px;">
            <span>📍</span>
            <span>${restaurant.location || restaurant.city || ''}</span>
          </div>

          <a href="/restaurants/${restaurant.id}" style="
            display: block;
            text-align: center;
            background: linear-gradient(135deg, #3E2723, #4E342E);
            color: #FDFBF7;
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            transition: opacity 0.2s;
          ">View & Book Table</a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(popupContent, {
          maxWidth: 280,
          className: 'dineflow-popup',
        })
        .on('click', () => {
          setSelectedRestaurant(restaurant);
        });

      markersLayerRef.current.addLayer(marker);
    });
  };

  // Get user location
  const handleLocateMe = () => {
    if (locating || !mapRef.current || !window.L) return;
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setLocating(false);

        const L = window.L;
        const map = mapRef.current;

        // Remove previous user marker
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
        }

        // Add pulsing user location marker
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="position: relative; width: 20px; height: 20px;">
              <div style="
                position: absolute; inset: 0;
                background: #3b82f6;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(59,130,246,0.5);
              "></div>
              <div style="
                position: absolute; inset: -8px;
                background: rgba(59,130,246,0.15);
                border-radius: 50%;
                animation: pulse-ring 2s ease-out infinite;
              "></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .bindPopup('<b style="font-family: Inter, sans-serif;">📍 You are here</b>')
          .addTo(map);

        map.flyTo([latitude, longitude], 13, { duration: 1.5 });
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Switch map style
  const cycleMapStyle = () => {
    const styles = ['default', 'dark', 'satellite'];
    const currentIndex = styles.indexOf(mapStyle);
    setMapStyle(styles[(currentIndex + 1) % styles.length]);
  };

  if (mappableRestaurants.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm max-w-xl mx-auto">
        <MapPin size={48} className="mx-auto text-stone-300 mb-4" />
        <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">No Map Data Available</h3>
        <p className="text-stone-600 text-sm">
          Restaurants haven't added their location coordinates yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif font-black text-brown-900 flex items-center gap-2">
            <MapPin size={20} className="text-gold-500" />
            Explore Restaurants Near You
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {mappableRestaurants.length} restaurant{mappableRestaurants.length !== 1 ? 's' : ''} on the map
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Map style toggle */}
          <button
            onClick={cycleMapStyle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm cursor-pointer"
            title="Switch map style"
          >
            <Layers size={14} />
            <span className="capitalize">{mapStyle === 'default' ? 'Standard' : mapStyle === 'dark' ? 'Dark' : 'Satellite'}</span>
          </button>

          {/* Locate me button */}
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
              userCoords
                ? 'bg-blue-500 text-white border border-blue-500 hover:bg-blue-600'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
            }`}
            title="Show my location"
          >
            {locating ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Locate size={14} />
            )}
            <span>{userCoords ? 'Located' : 'Find Me'}</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-lg">
        <div
          ref={mapContainerRef}
          className="w-full"
          style={{ height: '500px', minHeight: '400px' }}
        />

        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-cream-200 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-700">
            {mappableRestaurants.length} Restaurants
          </span>
        </div>
      </div>

      {/* Selected Restaurant Quick View */}
      {selectedRestaurant && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
            <img
              src={
                selectedRestaurant.image && selectedRestaurant.image !== 'no-photo.jpg'
                  ? selectedRestaurant.image
                  : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200'
              }
              alt={selectedRestaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="font-serif font-black text-stone-900 text-base truncate">
              {selectedRestaurant.name}
            </h4>
            <p className="text-xs text-stone-500 truncate">
              {selectedRestaurant.cuisine} • {selectedRestaurant.location || selectedRestaurant.city}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/restaurants/${selectedRestaurant.id}`}
              className="bg-brown-900 hover:bg-gold-500 text-cream-100 hover:text-brown-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Book Table
            </a>
            <button
              onClick={() => setSelectedRestaurant(null)}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Custom styles for Leaflet popups and markers */}
      <style>{`
        .dineflow-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 4px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dineflow-popup .leaflet-popup-content {
          margin: 12px 14px;
          line-height: 1.4;
        }
        .dineflow-popup .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .custom-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .user-location-marker {
          background: transparent !important;
          border: none !important;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DashboardMap;
