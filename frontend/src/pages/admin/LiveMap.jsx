import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow, OverlayView } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../mapsConfig';
import { useAuth } from '../../context/AuthContext';
import { getDatabase, ref, onValue } from 'firebase/database';
import { MapPin, Shield, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

const libraries = ['places'];

// Helper: Haversine distance in meters
const haversineDistance = (coords1, coords2) => {
    function toRad(x) {
        return (x * Math.PI) / 180;
    }

    const R = 6371e3; // Earth radius in meters
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const AdminMap = () => {
    const { currentUser } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [center, setCenter] = useState({ lat: 22.5726, lng: 88.3639 });

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    useEffect(() => {
        if (!currentUser?.department) return;

        const db = getDatabase();
        const deptReportsRef = ref(db, `reports/by_department/${currentUser.department}`);

        const unsubscribe = onValue(deptReportsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setIncidents(list);

                // Set center to first incident if exists and no center set yet
                if (list.length > 0 && list[0].location) {
                    setCenter({ lat: list[0].location.lat, lng: list[0].location.lng });
                }
            }
        });

        return () => unsubscribe();
    }, [currentUser?.department]);

    // Clustering Logic
    const clusters = React.useMemo(() => {
        const clustered = [];
        const visited = new Set();

        incidents.forEach((incident) => {
            if (visited.has(incident.id)) return;
            if (!incident.location || !incident.location.lat || !incident.location.lng) return;

            const cluster = [incident];
            visited.add(incident.id);

            incidents.forEach((other) => {
                if (visited.has(other.id)) return;
                if (!other.location || !other.location.lat || !other.location.lng) return;

                const dist = haversineDistance(
                    { lat: incident.location.lat, lng: incident.location.lng },
                    { lat: other.location.lat, lng: other.location.lng }
                );

                if (dist <= 300) { // 300 meters radius
                    cluster.push(other);
                    visited.add(other.id);
                }
            });

            clustered.push(cluster);
        });

        return clustered;
    }, [incidents]);


    if (!isLoaded) return <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl" />;

    return (
        <AdminLayout>
            <div className="h-[calc(100vh-150px)] flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Live Monitor</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Geospatial view of all reports assigned to your department. High density areas are clustered.
                    </p>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={center}
                        zoom={13}
                        options={{
                            styles: [
                                {
                                    "featureType": "all",
                                    "elementType": "geometry.fill",
                                    "stylers": [{ "weight": "2.00" }]
                                },
                            ],
                            disableDefaultUI: false,
                            zoomControl: true,
                        }}
                    >
                        {clusters.map((cluster, index) => {
                            const mainIncident = cluster[0];
                            const isCluster = cluster.length > 1;

                            if (isCluster) {
                                return (
                                    <OverlayView
                                        key={`cluster-${index}`}
                                        position={{ lat: mainIncident.location.lat, lng: mainIncident.location.lng }}
                                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                        getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
                                        zIndex={selectedCluster === cluster ? 1000 : 1}
                                    >
                                        <div
                                            className={`relative flex items-center justify-center w-16 h-16 cursor-pointer group transition-all duration-300 ${selectedCluster === cluster ? 'z-[1000]' : 'z-10 hover:z-50'}`}
                                            onClick={() => setSelectedCluster(cluster)}
                                            onMouseEnter={() => {
                                                if (window.clusterHoverTimeout) clearTimeout(window.clusterHoverTimeout);
                                                setSelectedCluster(cluster);
                                            }}
                                            onMouseLeave={() => {
                                                window.clusterHoverTimeout = setTimeout(() => {
                                                    setSelectedCluster(null);
                                                }, 300);
                                            }}
                                        >
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping"></span>
                                            <span className="absolute inline-flex h-10 w-10 rounded-full bg-red-500 opacity-40 animate-pulse"></span>
                                            <div className="relative w-10 h-10 bg-red-600 rounded-full shadow-xl flex flex-col items-center justify-center border-2 border-white z-10 text-white leading-tight">
                                                <span className="text-[10px] font-black">{cluster.length}</span>
                                            </div>

                                            {/* Apple-Style Glassmorphism Tooltip for LiveMap */}
                                            {selectedCluster === cluster && (
                                                <div
                                                    className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-[280px] bg-black/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 overflow-hidden origin-bottom animate-in fade-in zoom-in-95 duration-200 cursor-default ring-1 ring-white/5"
                                                >
                                                    {/* Header - Transparent & Blurred */}
                                                    <div className="bg-white/5 px-4 py-3 flex justify-between items-center border-b border-white/5 backdrop-blur-md">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle size={14} className="text-red-500" />
                                                            <span className="font-semibold text-[13px] text-white tracking-wide">Cluster Alert</span>
                                                        </div>
                                                        <span className="bg-red-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm border border-red-400/20">{selectedCluster.length} Issues</span>
                                                    </div>

                                                    {/* Report List - Scrollbar Hidden */}
                                                    <div
                                                        className="max-h-[260px] overflow-y-auto p-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
                                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                                    >
                                                        <div className="space-y-1.5">
                                                            {selectedCluster.map((inc) => (
                                                                <Link
                                                                    to={`/admin/incident/${inc.id}`}
                                                                    key={inc.id}
                                                                    className="flex gap-3 items-center bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item active:scale-95 duration-200"
                                                                >
                                                                    {/* Thumbnail */}
                                                                    <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0 overflow-hidden relative border border-white/5">
                                                                        {inc.imageUrl ? (
                                                                            <img
                                                                                src={inc.imageUrl.includes('via.placeholder.com') ? inc.imageUrl.replace('via.placeholder.com', 'placehold.co') : (inc.imageUrl || 'https://placehold.co/100')}
                                                                                className="w-full h-full object-cover"
                                                                                alt=""
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-white/30">
                                                                                <MapPin size={14} />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-center mb-0.5">
                                                                            <h4 className="font-medium text-white text-xs truncate pr-2 capitalize leading-tight">{inc.type || 'Incident'}</h4>
                                                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider max-w-[100px] truncate ${inc.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                                                                                inc.status === 'Pending' ? 'bg-orange-500/20 text-orange-400' :
                                                                                    'bg-blue-500/20 text-blue-400'
                                                                                }`}>
                                                                                {inc.status || 'Pending'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-white/40 font-medium">
                                                                                {new Date(inc.createdAt).toLocaleDateString()}
                                                                            </span>
                                                                            <div className="ml-auto text-blue-400 active:text-blue-300 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                                <ChevronRight size={14} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Tooltip Arrow */}
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/80 backdrop-blur-2xl border-b border-r border-white/10 transform rotate-45 z-0 rounded-br-[2px]"></div>
                                                </div>
                                            )}
                                        </div>
                                    </OverlayView>
                                );
                            } else {
                                return (
                                    <Marker
                                        key={mainIncident.id}
                                        position={{ lat: mainIncident.location.lat, lng: mainIncident.location.lng }}
                                        onClick={() => setSelectedIncident(mainIncident)}
                                        icon={{
                                            url: mainIncident.status === 'Resolved' ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                                        }}
                                    />
                                );
                            }
                        })}

                        {/* InfoWindow for Single Incident */}
                        {selectedIncident && (
                            <InfoWindow
                                position={{ lat: selectedIncident.location?.lat, lng: selectedIncident.location?.lng }}
                                onCloseClick={() => setSelectedIncident(null)}
                            >
                                <div className="p-2 min-w-[250px] max-w-[300px]">
                                    <div className="flex gap-3 mb-3">
                                        <img
                                            src={selectedIncident.imageUrl || 'https://placehold.co/100'}
                                            className="w-16 h-16 rounded-lg object-cover border border-slate-100"
                                            alt="Incident"
                                        />
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{selectedIncident.userName}</h4>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${selectedIncident.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {selectedIncident.priority}
                                            </span>
                                            <p className="text-[10px] text-slate-500 mt-1">{selectedIncident.type}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 italic mb-2 line-clamp-2">"{selectedIncident.description}"</p>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <Clock size={10} />
                                            {new Date(selectedIncident.createdAt).toLocaleDateString()}
                                        </div>
                                        <Link to={`/admin/incident/${selectedIncident.id}`} className="text-[10px] font-bold text-blue-600 hover:underline">Full Details</Link>
                                    </div>
                                </div>
                            </InfoWindow>
                        )}


                    </GoogleMap>

                    {/* Legend */}
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-10">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legend</h5>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pending</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-[6px] text-white font-bold animate-pulse">!</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">High Density (Alert)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Resolved</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminMap;
