import React, { useState, useEffect } from 'react';
import { MapPin, X, Navigation, Filter, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CivicLayout from './CivicLayout';
import { getDatabase, ref, onValue } from "firebase/database";
import { auth } from '../../services/firebase';
import { GoogleMap, useJsApiLoader, Marker, OverlayView } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../mapsConfig';
import { useTheme } from '../../context/ThemeContext';

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Light mode map styles
const lightMapStyles = [
    {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#f1f5f9" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#cbd5e1" }]
    }
];

// Dark mode map styles
const darkMapStyles = [
    {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
    },
    {
        featureType: "all",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#0f172a" }]
    },
    {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#94a3b8" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#334155" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0f172a" }]
    }
];

const LiveMap = () => {
    const { theme } = useTheme();
    const [libraries] = useState(['places']);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    const [mapCenter, setMapCenter] = useState(null);
    const [selectedPin, setSelectedPin] = useState(null);
    const [pins, setPins] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log("Location access denied or unavailable. Defaulting to India View.");
                    setMapCenter({ lat: 21.1458, lng: 79.0882 });
                }
            );
        } else {
            setMapCenter({ lat: 21.1458, lng: 79.0882 });
        }
    }, []);

    useEffect(() => {
        const db = getDatabase(auth.app);
        const reportsRef = ref(db, 'reports');

        onValue(reportsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const loadedPins = Object.keys(data)
                    .map(key => ({
                        id: key,
                        ...data[key]
                    }))
                    .filter(pin => pin.location && pin.location.lat && pin.location.lng);

                setPins(loadedPins);
            }
        });
    }, []);

    // --- 1. Filter Logic ---
    const filteredPins = React.useMemo(() => {
        return pins.filter(pin => {
            if (filterType === 'all') return pin.status !== 'Resolved';
            if (filterType === 'critical') {
                return ['Fire & Safety', 'Medical/Ambulance', 'Police'].includes(pin.department) ||
                    pin.priority === 'Critical' ||
                    pin.type === 'SOS Emergency';
            }
            return pin.type?.toLowerCase() === filterType;
        });
    }, [pins, filterType]);

    // --- 2. Stats Calculation ---
    const criticalCount = pins.filter(p =>
        ['Fire & Safety', 'Medical/Ambulance', 'Police'].includes(p.department) ||
        p.priority === 'Critical' ||
        p.type === 'SOS Emergency'
    ).length;

    const pendingCount = pins.filter(p => p.status === 'Pending').length;
    const resolvedCount = pins.filter(p => p.status === 'Resolved' || p.status === 'Accepted').length;

    // --- 3. Clustering Helper: Haversine distance ---
    const haversineDistance = (coords1, coords2) => {
        function toRad(x) { return (x * Math.PI) / 180; }
        const R = 6371e3; // Earth radius in meters
        const dLat = toRad(coords2.lat - coords1.lat);
        const dLon = toRad(coords2.lng - coords1.lng);
        const lat1 = toRad(coords1.lat);
        const lat2 = toRad(coords2.lat);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // --- 4. Clustering Logic (Applied on Filtered Pins) ---
    const clusters = React.useMemo(() => {
        const clustered = [];
        const visited = new Set();
        // Use filteredPins so clustering reacts to filters
        const activePins = filteredPins;

        activePins.forEach((pin) => {
            if (visited.has(pin.id)) return;
            if (!pin.location || !pin.location.lat || !pin.location.lng) return;

            const cluster = [pin];
            visited.add(pin.id);

            activePins.forEach((other) => {
                if (visited.has(other.id)) return;
                if (!other.location || !other.location.lat || !other.location.lng) return;

                const dist = haversineDistance(
                    { lat: parseFloat(pin.location.lat), lng: parseFloat(pin.location.lng) },
                    { lat: parseFloat(other.location.lat), lng: parseFloat(other.location.lng) }
                );

                if (dist <= 300) { // 300 meters radius
                    cluster.push(other);
                    visited.add(other.id);
                }
            });

            clustered.push(cluster);
        });

        return clustered;
    }, [filteredPins]);

    return (
        <CivicLayout noPadding>
            <div className="relative h-full w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                {/* Google Map */}
                {isLoaded && mapCenter ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={mapCenter}
                        zoom={15}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            styles: theme === 'dark' ? darkMapStyles : lightMapStyles
                        }}
                    >
                        {/* Current User Location Marker */}
                        <Marker
                            position={mapCenter}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillOpacity: 1,
                                strokeWeight: 3,
                                fillColor: '#3b82f6',
                                strokeColor: '#ffffff',
                            }}
                            title="You are here"
                        />

                        {/* Incident Markers & Clusters */}
                        {clusters.map((cluster, index) => {
                            const isCluster = cluster.length > 1;
                            const pin = cluster[0]; // Use first pin as representative for location

                            if (isCluster) {
                                return (
                                    <OverlayView
                                        key={`cluster-${index}`}
                                        position={{ lat: parseFloat(pin.location.lat), lng: parseFloat(pin.location.lng) }}
                                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                        getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
                                    >
                                        <div
                                            className="relative flex items-center justify-center w-20 h-20 cursor-pointer group z-50 hover:z-[60]"
                                            onClick={() => setSelectedPin(pin)} // For now open the first one, or we could support cluster viewing
                                        >
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-orange-600 opacity-75 animate-ping"></span>
                                            <span className="absolute inline-flex h-12 w-12 rounded-full bg-orange-500 opacity-40 animate-pulse"></span>
                                            <div className="relative w-14 h-14 bg-orange-600 rounded-full shadow-xl flex flex-col items-center justify-center border-4 border-white z-10 text-white leading-tight">
                                                <span className="text-[10px] font-bold uppercase">Area</span>
                                                <span className="text-lg font-black">{cluster.length}</span>
                                            </div>
                                        </div>
                                    </OverlayView>
                                );
                            }

                            // Single Pin Rendering
                            const isCritical =
                                ['Fire & Safety', 'Medical/Ambulance', 'Police'].includes(pin.department) ||
                                pin.priority === 'Critical' ||
                                pin.type === 'SOS Emergency';

                            // Determine Icon based on type
                            let iconEmoji = '🚩';
                            if (pin.type?.toLowerCase().includes('pothole')) iconEmoji = '🚧';
                            else if (pin.type?.toLowerCase().includes('garbage')) iconEmoji = '🗑️';
                            else if (pin.type?.toLowerCase().includes('light')) iconEmoji = '💡';
                            else if (pin.type?.toLowerCase().includes('water')) iconEmoji = '💧';
                            else if (pin.type?.toLowerCase().includes('fire')) iconEmoji = '🔥';
                            else if (pin.type?.toLowerCase().includes('traffic')) iconEmoji = '🚦';
                            else if (pin.type?.toLowerCase().includes('sos')) iconEmoji = '🚨';

                            if (isCritical) {
                                return (
                                    <OverlayView
                                        key={pin.id}
                                        position={{ lat: parseFloat(pin.location.lat), lng: parseFloat(pin.location.lng) }}
                                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                        getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -height - 10 })}
                                    >
                                        <div
                                            className="relative flex items-center justify-center w-16 h-16 cursor-pointer group z-50 hover:z-[60]"
                                            onClick={() => setSelectedPin(pin)}
                                        >
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping"></span>
                                            <span className="absolute inline-flex h-10 w-10 rounded-full bg-red-500 opacity-40 animate-pulse"></span>
                                            <div className="relative w-12 h-12 bg-red-600 rounded-full shadow-xl flex items-center justify-center border-4 border-white z-10 text-white font-bold text-sm tracking-tighter">
                                                SOS
                                            </div>
                                            {/* Hover Tooltip for Critical */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[70]">
                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-xl border border-slate-200 dark:border-slate-700 min-w-[200px]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">SOS</div>
                                                        <div className="flex-1">
                                                            <h4 className="text-slate-900 dark:text-white font-bold text-sm capitalize truncate">{pin.type || 'Emergency'}</h4>
                                                            <p className="text-red-600 dark:text-red-400 text-xs font-semibold">CRITICAL ALERT</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-300 text-xs mb-2 line-clamp-2">{pin.location?.address || 'Location N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </OverlayView>
                                );
                            }

                            return (
                                <OverlayView
                                    key={pin.id}
                                    position={{ lat: parseFloat(pin.location.lat), lng: parseFloat(pin.location.lng) }}
                                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                    getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
                                >
                                    <div
                                        className="relative flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform hover:z-40 group"
                                        onClick={() => setSelectedPin(pin)}
                                    >
                                        <div className="text-3xl drop-shadow-md filter">{iconEmoji}</div>
                                        <div className="w-2 h-2 bg-black/30 rounded-full blur-[1px] mt-[-2px]"></div>

                                        {/* Hover Tooltip for Normal */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[70]">
                                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-xl border border-slate-200 dark:border-slate-700 min-w-[200px]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-lg">{iconEmoji}</div>
                                                    <div className="flex-1">
                                                        <h4 className="text-slate-900 dark:text-white font-bold text-sm capitalize truncate">{pin.type || 'Issue'}</h4>
                                                        <p className="text-slate-600 dark:text-slate-400 text-xs">{new Date(pin.timestamp).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-300 text-xs mb-2 line-clamp-2">{pin.location?.address || 'Location N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </OverlayView>
                            );
                        })}
                    </GoogleMap>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                        <MapPin className="animate-bounce mb-3 text-blue-600 dark:text-blue-500" size={48} />
                        <span className="font-bold text-lg">Locating you...</span>
                        <span className="text-sm text-slate-500 dark:text-slate-500 mt-2">Please enable location access</span>
                    </div>
                )}

                {/* Top Stats Bar */}
                <div className="absolute top-4 left-4 right-4 flex gap-3 z-10 pointer-events-none">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg pointer-events-auto border border-slate-200 dark:border-slate-700 flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white text-lg">Live Map</h2>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse"></div>
                                    {filteredPins.length} Active Reports
                                </p>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-3 rounded-lg transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                            >
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="hidden md:flex gap-3">
                        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg shadow-lg pointer-events-auto border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
                                <div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{criticalCount}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Critical</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg shadow-lg pointer-events-auto border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Clock size={20} className="text-blue-600 dark:text-blue-400" />
                                <div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Pending</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg shadow-lg pointer-events-auto border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
                                <div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{resolvedCount}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Resolved</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="absolute top-24 left-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl z-10 border border-slate-200 dark:border-slate-700 min-w-[240px]">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Filter Reports</h3>
                        <div className="space-y-2">
                            {[
                                { value: 'all', label: 'All Reports', icon: '🗺️' },
                                { value: 'critical', label: 'Critical Only', icon: '🚨' },
                                { value: 'pothole', label: 'Potholes', icon: '🚧' },
                                { value: 'garbage', label: 'Garbage', icon: '🗑️' },
                                { value: 'light', label: 'Street Lights', icon: '💡' },
                                { value: 'water', label: 'Water Issues', icon: '💧' },
                            ].map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => {
                                        setFilterType(filter.value);
                                        setShowFilters(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${filterType === filter.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    <span className="text-xl">{filter.icon}</span>
                                    <span className="text-sm font-semibold">{filter.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Location Button */}
                <button
                    onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    setMapCenter({
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude
                                    });
                                }
                            );
                        }
                    }}
                    className="absolute bottom-32 right-4 p-4 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 z-10"
                >
                    <Navigation size={24} />
                </button>

                {/* Selected Pin Detail Card */}
                {selectedPin && (
                    <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl z-20 border border-slate-200 dark:border-slate-700">
                        <div className="flex gap-4 items-start">
                            {/* Icon */}
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-3xl shrink-0">
                                {selectedPin.type === 'pothole' ? '🚧' :
                                    selectedPin.type === 'garbage' ? '🗑️' :
                                        selectedPin.type?.includes('SOS') ? '🚨' : '🚩'}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg capitalize mb-1">{selectedPin.type || 'Issue'}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                    {selectedPin.location?.address || 'Location information unavailable'}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold">
                                        {selectedPin.status || 'Active'}
                                    </span>
                                    {selectedPin.department && (
                                        <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                                            {selectedPin.department}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => navigate(`/civic/report`)}
                                    className="px-5 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setSelectedPin(null)}
                                    className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CivicLayout>
    );
};

export default LiveMap;