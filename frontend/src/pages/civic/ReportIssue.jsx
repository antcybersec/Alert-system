import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, MapPin, CheckCircle, AlertTriangle, Trash2,
    Lightbulb, Droplets, X, Loader2, Upload, Search, Crosshair, Award,
    Video, Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CivicLayout from './CivicLayout';
import { verifyImageWithAI, submitReportToBackend } from '../../services/backendService';
import { uploadImage, uploadVideo, uploadAudio } from '../../services/storageService';
import { auth } from '../../services/firebase';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../mapsConfig';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

const libraries = ['places'];

// Light mode map styles
const lightMapStyles = [
    { featureType: "all", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#cbd5e1" }] }
];

// Dark mode map styles
const darkMapStyles = [
    { featureType: "all", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
];

const ReportIssue = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    // Media states
    const [mediaType, setMediaType] = useState(null); // 'image', 'video', 'audio'
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedAudio, setSelectedAudio] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);

    // Analysis states
    const [analyzing, setAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [category, setCategory] = useState(null);
    const [department, setDepartment] = useState('');

    // Location states
    const [location, setLocation] = useState({ lat: null, lng: null, address: 'Detecting location...' });
    const [map, setMap] = useState(null);
    const [searchResult, setSearchResult] = useState(null);

    // UI states
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [submittedReportId, setSubmittedReportId] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    const fetchAddress = useCallback((lat, lng) => {
        if (!window.google || !window.google.maps || !window.google.maps.Geocoder) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
                setLocation(prev => ({
                    ...prev,
                    lat,
                    lng,
                    address: results[0].formatted_address
                }));
            } else {
                console.warn("Geocoder failed:", status);
                setLocation(prev => ({
                    ...prev,
                    lat,
                    lng,
                    address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                }));
            }
        });
    }, []);

    const detectLocation = useCallback(() => {
        if (navigator.geolocation) {
            setLocation(prev => ({ ...prev, address: 'Detecting location...' }));

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    setLocation(prev => ({ ...prev, ...pos, address: 'Fetching address...' }));

                    if (window.google?.maps?.Geocoder) {
                        fetchAddress(pos.lat, pos.lng);
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    toast.error("Location access denied or failed.");
                },
                { enableHighAccuracy: true }
            );
        } else {
            toast.error("Geolocation is not supported by this browser.");
        }
    }, [fetchAddress]);

    useEffect(() => {
        detectLocation();
    }, [detectLocation]);

    useEffect(() => {
        if (isLoaded && location.lat && (location.address === 'Fetching address...' || location.address === 'Detecting location...')) {
            fetchAddress(location.lat, location.lng);
        }
    }, [isLoaded, location.lat, location.lng, location.address, fetchAddress]);

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Helper function to format confidence score safely
    const formatConfidence = (score) => {
        if (!score) return 0;

        // If score is a decimal (e.g. 0.95), convert to 95
        let numericScore = Number(score);
        if (numericScore <= 1 && numericScore > 0) {
            numericScore = numericScore * 100;
        }

        return Math.round(numericScore);
    };

    const onMapLoad = useCallback((map) => {
        setMap(map);
    }, []);

    const onMarkerDragEnd = (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        fetchAddress(newLat, newLng);
    };

    const onPlaceChanged = () => {
        if (searchResult !== null) {
            const place = searchResult.getPlace();
            if (place.geometry) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                setLocation({
                    lat: newLat,
                    lng: newLng,
                    address: place.formatted_address
                });
                map?.panTo({ lat: newLat, lng: newLng });
                map?.setZoom(17);
            }
        }
    };

    const onLoadAutocomplete = (autocomplete) => {
        setSearchResult(autocomplete);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result);
            reader.readAsDataURL(file);

            setAnalyzing(true);
            setAiResult(null);

            try {
                const result = await verifyImageWithAI(file);
                console.log("[AI FULL RESULT]:", result);

                if (result) {
                    // Extract confidence score from various possible sources and format it
                    let confidenceScore = 0;
                    if (result.ai_confidence) {
                        confidenceScore = formatConfidence(result.ai_confidence);
                    } else if (result.confidence?.overall) {
                        confidenceScore = formatConfidence(result.confidence.overall);
                    } else if (result.fullAnalysis?.ai_confidence) {
                        confidenceScore = formatConfidence(result.fullAnalysis.ai_confidence);
                    } else if (result.fullAnalysis?.confidence?.overall) {
                        confidenceScore = formatConfidence(result.fullAnalysis.confidence.overall);
                    }

                    setAiResult({
                        // Basic info
                        detected: result.detected_issue || result.explanation || 'Issue Detected',
                        confidence: `${confidenceScore}%`,
                        confidenceValue: confidenceScore, // Store numeric value for comparisons
                        severity: result.verified ? 'High' : 'Low',
                        recommendation: result.verified ? 'Verified by Gemini AI' : 'Low confidence detection',
                        isVerified: result.verified,

                        // Comprehensive analysis
                        imageOverview: result.imageOverview || null,
                        detailedIssueAnalysis: result.detailedIssueAnalysis || null,
                        eventDetection: result.eventDetection || null,
                        classification: result.classification || null,
                        departmentRouting: result.departmentRouting || null,
                        actionableInsights: result.actionableInsights || null,
                        fullAnalysis: result // Store complete result
                    });

                    // Auto-fill department based on AI routing
                    if (result.departmentRouting?.primaryDepartment) {
                        setDepartment(result.departmentRouting.primaryDepartment);
                    } else {
                        // Fallback to text-based detection
                        const explanation = (result.explanation || result.detected_issue || '').toLowerCase();
                        if (explanation.includes('pothole')) { setCategory('pothole'); setDepartment('Roads & Transport'); }
                        else if (explanation.includes('garbage') || explanation.includes('trash')) { setCategory('garbage'); setDepartment('Municipal/Waste'); }
                        else if (explanation.includes('light') || explanation.includes('dark')) { setCategory('light'); setDepartment('Electricity Board'); }
                        else if (explanation.includes('water') || explanation.includes('leak')) { setCategory('water'); setDepartment('Water Supply'); }
                        else if (explanation.includes('traffic')) { setDepartment('Traffic'); }
                        else if (explanation.includes('fire')) { setDepartment('Fire & Safety'); }
                    }

                    // Auto-fill category if available
                    if (result.classification?.category) {
                        setCategory(result.classification.category.toLowerCase());
                    }
                }
            } catch (error) {
                console.error("AI Analysis Failed:", error);
                setAiResult({
                    detected: 'Analysis Failed',
                    confidence: '0%',
                    severity: 'Unknown',
                    recommendation: 'Could not connect to AI backend.'
                });
            } finally {
                setAnalyzing(false);
            }
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate video file
            if (!file.type.startsWith('video/')) {
                toast.error('Please upload a valid video file');
                return;
            }

            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                toast.error('Video file too large. Maximum size is 50MB');
                return;
            }

            setVideoFile(file);
            setMediaType('video');
            const reader = new FileReader();
            reader.onloadend = () => setSelectedVideo(reader.result);
            reader.readAsDataURL(file);

            setAnalyzing(true);
            setAiResult(null);

            try {
                // For video, we'll analyze the first frame or send to backend
                const result = await verifyImageWithAI(file); // Backend will handle video
                if (result) {
                    const confidenceScore = formatConfidence(result.ai_confidence || result.confidence?.overall);

                    setAiResult({
                        detected: result.detected_issue || result.explanation || 'Issue Detected',
                        confidence: `${confidenceScore}%`,
                        confidenceValue: confidenceScore,
                        severity: result.verified ? 'High' : 'Low',
                        recommendation: result.verified ? 'Verified by Gemini AI' : 'Low confidence detection',
                        isVerified: result.verified,
                        imageOverview: result.imageOverview || null,
                        detailedIssueAnalysis: result.detailedIssueAnalysis || null,
                        eventDetection: result.eventDetection || null,
                        classification: result.classification || null,
                        departmentRouting: result.departmentRouting || null,
                        actionableInsights: result.actionableInsights || null,
                        fullAnalysis: result
                    });

                    if (result.departmentRouting?.primaryDepartment) {
                        setDepartment(result.departmentRouting.primaryDepartment);
                    }
                    if (result.classification?.category) {
                        setCategory(result.classification.category.toLowerCase());
                    }
                }
            } catch (error) {
                console.error("Video Analysis Failed:", error);
                setAiResult({
                    detected: 'Analysis Failed',
                    confidence: '0%',
                    severity: 'Unknown',
                    recommendation: 'Could not analyze video.'
                });
            } finally {
                setAnalyzing(false);
            }
        }
    };

    const handleAudioUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate audio file
            if (!file.type.startsWith('audio/')) {
                toast.error('Please upload a valid audio file');
                return;
            }

            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Audio file too large. Maximum size is 10MB');
                return;
            }

            setAudioFile(file);
            setMediaType('audio');
            const reader = new FileReader();
            reader.onloadend = () => setSelectedAudio(reader.result);
            reader.readAsDataURL(file);

            setAnalyzing(true);
            setAiResult(null);

            try {
                // For audio, backend will transcribe and analyze
                const result = await verifyImageWithAI(file); // Backend will handle audio
                if (result) {
                    const confidenceScore = formatConfidence(result.ai_confidence || result.confidence?.overall);

                    setAiResult({
                        detected: result.detected_issue || result.explanation || 'Issue Detected from Audio',
                        confidence: `${confidenceScore}%`,
                        confidenceValue: confidenceScore,
                        severity: result.verified ? 'High' : 'Low',
                        recommendation: result.verified ? 'Verified by Gemini AI' : 'Low confidence detection',
                        isVerified: result.verified,
                        transcription: result.transcription || null,
                        eventDetection: result.eventDetection || null,
                        classification: result.classification || null,
                        departmentRouting: result.departmentRouting || null,
                        actionableInsights: result.actionableInsights || null,
                        fullAnalysis: result
                    });

                    if (result.departmentRouting?.primaryDepartment) {
                        setDepartment(result.departmentRouting.primaryDepartment);
                    }
                    if (result.classification?.category) {
                        setCategory(result.classification.category.toLowerCase());
                    }
                }
            } catch (error) {
                console.error("Audio Analysis Failed:", error);
                setAiResult({
                    detected: 'Analysis Failed',
                    confidence: '0%',
                    severity: 'Unknown',
                    recommendation: 'Could not analyze audio.'
                });
            } finally {
                setAnalyzing(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let mediaUrl = null;
            let finalMediaType = 'image'; // Default to image if generic or fallback

            if (imageFile) {
                mediaUrl = await uploadImage(imageFile, 'civic-reports');
                finalMediaType = 'image';
            } else if (videoFile) {
                mediaUrl = await uploadVideo(videoFile, 'civic-reports');
                finalMediaType = 'video';
            } else if (audioFile) {
                mediaUrl = await uploadAudio(audioFile, 'civic-reports');
                finalMediaType = 'audio';
            } else if (selectedImage && !imageFile) {
                // Case where selectedImage is a string (e.g. reused or pre-filled), though mostly imageFile is present
                mediaUrl = selectedImage;
            }

            const reportData = {
                type: category || 'General',
                department: department,
                description: e.target.elements.description.value,
                location: { lat: location.lat, lng: location.lng, address: location.address },
                imageUrl: finalMediaType === 'image' ? mediaUrl : null, // Backward compatibility
                mediaUrl: mediaUrl,
                mediaType: finalMediaType,
                aiVerified: aiResult?.isVerified || false,
                aiAnalysis: aiResult?.detected || aiResult?.transcription || 'No analysis available',
                aiConfidence: aiResult?.confidence ? parseInt(aiResult.confidence) : 0,
                priority: aiResult?.severity === 'High' ? 'High' : 'Normal',
                status: 'Pending',
                timestamp: Date.now(),
                userId: auth.currentUser?.uid,
                userName: auth.currentUser?.displayName || 'Anonymous'
            };

            const response = await submitReportToBackend(reportData);
            setSubmittedReportId(response.id || 'N/A');
            setShowSuccessPopup(true);

            // Auto redirect after 3 seconds
            setTimeout(() => {
                setShowSuccessPopup(false);
                navigate('/civic/my-reports');
            }, 3000);
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error('Failed to submit report: ' + error.message);
        }
    };

    return (
        <CivicLayout>
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                    <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-lg">
                        <Camera size={28} className="text-white" />
                    </div>
                    Report an Issue
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-base ml-16">Help improve your community with AI-powered reporting</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Upload Area - 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Evidence</h2>
                            {aiResult?.isVerified && (
                                <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    AI Verified
                                </span>
                            )}
                        </div>

                        <div className="mb-6">
                            {!selectedImage && !selectedVideo && !selectedAudio ? (
                                <div>
                                    {/* Media Type Selector */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {/* Image Button */}
                                        <div
                                            onClick={() => document.getElementById('image-upload').click()}
                                            className="relative group cursor-pointer"
                                        >
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="h-[180px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-500 transition-all">
                                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                                    <Camera size={32} />
                                                </div>
                                                <p className="font-bold text-lg text-slate-900 dark:text-white mb-1">Photo</p>
                                                <p className="text-slate-600 dark:text-slate-400 text-xs">JPG, PNG (Max 10MB)</p>
                                            </div>
                                        </div>

                                        {/* Video Button */}
                                        <div
                                            onClick={() => document.getElementById('video-upload').click()}
                                            className="relative group cursor-pointer"
                                        >
                                            <input
                                                id="video-upload"
                                                type="file"
                                                accept="video/*"
                                                onChange={handleVideoUpload}
                                                className="hidden"
                                            />
                                            <div className="h-[180px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-500 transition-all">
                                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                                    <Video size={32} />
                                                </div>
                                                <p className="font-bold text-lg text-slate-900 dark:text-white mb-1">Video</p>
                                                <p className="text-slate-600 dark:text-slate-400 text-xs">MP4, WebM (Max 50MB)</p>
                                            </div>
                                        </div>

                                        {/* Audio/Voice Button */}
                                        <div
                                            onClick={() => document.getElementById('audio-upload').click()}
                                            className="relative group cursor-pointer"
                                        >
                                            <input
                                                id="audio-upload"
                                                type="file"
                                                accept="audio/*"
                                                onChange={handleAudioUpload}
                                                className="hidden"
                                            />
                                            <div className="h-[180px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-500 transition-all">
                                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                                    <Mic size={32} />
                                                </div>
                                                <p className="font-bold text-lg text-slate-900 dark:text-white mb-1">Voice</p>
                                                <p className="text-slate-600 dark:text-slate-400 text-xs">MP3, WAV (Max 10MB)</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
                                        Click on any option above to upload evidence
                                    </p>
                                </div>
                            ) : selectedImage ? (
                                <div className="relative h-[500px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedImage(null); setAiResult(null); setCategory(null); setDepartment(''); }}
                                            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 rounded-lg p-3 text-white transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* AI Analysis Overlay - Comprehensive */}
                                    <AnimatePresence>
                                        {(analyzing || aiResult) && (
                                            <motion.div
                                                initial={{ y: 100, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700 max-h-[80%] overflow-y-auto"
                                            >
                                                {analyzing ? (
                                                    <div className="flex items-center gap-4">
                                                        <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">Gemini AI Analysis</div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Performing comprehensive image analysis...</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* Main Detection */}
                                                        <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${aiResult.isVerified ? 'bg-blue-600 dark:bg-blue-500' : 'bg-red-600 dark:bg-red-500'}`}>
                                                                {aiResult.isVerified ? <CheckCircle size={24} className="text-white" /> : <AlertTriangle size={24} className="text-white" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{aiResult.detected}</h4>
                                                                <p className="text-sm text-slate-600 dark:text-slate-400">{aiResult.recommendation}</p>
                                                            </div>
                                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${aiResult.isVerified ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                                                                {aiResult.severity}
                                                            </span>
                                                        </div>

                                                        {/* Image Overview */}
                                                        {aiResult.imageOverview && (
                                                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                                                                <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                                                    <Camera size={16} className="text-blue-600 dark:text-blue-400" />
                                                                    Image Overview
                                                                </h5>
                                                                <div className="space-y-2 text-xs">
                                                                    {aiResult.imageOverview.sceneDescription && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Scene: </span>
                                                                            <span className="text-slate-600 dark:text-slate-400">{aiResult.imageOverview.sceneDescription}</span>
                                                                        </div>
                                                                    )}
                                                                    {aiResult.imageOverview.environmentalContext && (
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <div>
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Setting: </span>
                                                                                <span className="text-slate-600 dark:text-slate-400">{aiResult.imageOverview.environmentalContext.setting}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Location Type: </span>
                                                                                <span className="text-slate-600 dark:text-slate-400">{aiResult.imageOverview.environmentalContext.locationType}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Time: </span>
                                                                                <span className="text-slate-600 dark:text-slate-400">{aiResult.imageOverview.timeEstimation}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Weather: </span>
                                                                                <span className="text-slate-600 dark:text-slate-400">{aiResult.imageOverview.environmentalContext.weatherCondition}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Detailed Issue Analysis */}
                                                        {aiResult.detailedIssueAnalysis && (
                                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                                                <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                                                    <AlertTriangle size={16} className="text-blue-600 dark:text-blue-400" />
                                                                    Detailed Issue Analysis
                                                                </h5>
                                                                <div className="space-y-2 text-xs">
                                                                    {aiResult.detailedIssueAnalysis.issueVisibility !== undefined && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Visibility: </span>
                                                                            <span className="text-slate-600 dark:text-slate-400">{aiResult.detailedIssueAnalysis.issueVisibility}%</span>
                                                                        </div>
                                                                    )}
                                                                    {aiResult.detailedIssueAnalysis.issueSize && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Size: </span>
                                                                            <span className="text-slate-600 dark:text-slate-400">{aiResult.detailedIssueAnalysis.issueSize}</span>
                                                                        </div>
                                                                    )}
                                                                    {aiResult.detailedIssueAnalysis.severityIndicators && aiResult.detailedIssueAnalysis.severityIndicators.length > 0 && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Severity Indicators: </span>
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {aiResult.detailedIssueAnalysis.severityIndicators.map((indicator, idx) => (
                                                                                    <span key={idx} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                                                                        {indicator}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Event Detection */}
                                                        {aiResult.eventDetection && (
                                                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                                                                <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Event Detection</h5>
                                                                <div className="space-y-2 text-xs">
                                                                    {aiResult.eventDetection.primaryEvent && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Primary Event: </span>
                                                                            <span className="text-slate-600 dark:text-slate-400">{aiResult.eventDetection.primaryEvent}</span>
                                                                        </div>
                                                                    )}
                                                                    {aiResult.eventDetection.eventType && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Type: </span>
                                                                            <span className="text-slate-600 dark:text-slate-400">{aiResult.eventDetection.eventType}</span>
                                                                        </div>
                                                                    )}
                                                                    {aiResult.eventDetection.eventDescription && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Description: </span>
                                                                            <span className="text-slate-600 dark:text-slate-400">{aiResult.eventDetection.eventDescription}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Actionable Insights */}
                                                        {aiResult.actionableInsights && (
                                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                                                <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                                                                    Actionable Insights
                                                                </h5>
                                                                <div className="space-y-2 text-xs">
                                                                    {aiResult.actionableInsights.immediateActions && aiResult.actionableInsights.immediateActions.length > 0 && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Immediate Actions:</span>
                                                                            <ul className="list-disc list-inside mt-1 text-slate-600 dark:text-slate-400 space-y-0.5">
                                                                                {aiResult.actionableInsights.immediateActions.map((action, idx) => (
                                                                                    <li key={idx}>{action}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                    {aiResult.actionableInsights.estimatedResolutionTime && (
                                                                        <div>
                                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Estimated Resolution: </span>
                                                                            <span className="text-slate-600 dark:text-slate-400">{aiResult.actionableInsights.estimatedResolutionTime}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Confidence Score */}
                                                        {aiResult.isVerified && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">AI Confidence Score</span>
                                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{aiResult.confidence}</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                                    <div className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500 ease-out" style={{ width: aiResult.confidence }}></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : selectedVideo ? (
                                <div className="video-preview-wrapper relative h-[500px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                    <video src={selectedVideo} controls className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedVideo(null); setVideoFile(null); setAiResult(null); setMediaType(null); }}
                                            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 rounded-lg p-3 text-white transition-colors pointer-events-auto"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* AI Analysis Overlay for Video */}
                                    <AnimatePresence>
                                        {(analyzing || aiResult) && (
                                            <motion.div
                                                initial={{ y: 100, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700 max-h-[60%] overflow-y-auto"
                                            >
                                                {analyzing ? (
                                                    <div className="flex items-center gap-4">
                                                        <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">Gemini AI Analysis</div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Analyzing video content...</div>
                                                        </div>
                                                    </div>
                                                ) : aiResult && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${aiResult.isVerified ? 'bg-blue-600 dark:bg-blue-500' : 'bg-red-600 dark:bg-red-500'}`}>
                                                                {aiResult.isVerified ? <CheckCircle size={20} className="text-white" /> : <AlertTriangle size={20} className="text-white" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{aiResult.detected}</h4>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400">{aiResult.recommendation}</p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${aiResult.isVerified ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                                                                {aiResult.severity}
                                                            </span>
                                                        </div>
                                                        {aiResult.isVerified && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">AI Confidence</span>
                                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{aiResult.confidence}</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                                    <div className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500" style={{ width: aiResult.confidence }}></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : selectedAudio ? (
                                /* Audio Preview - FIXED */
                                <section className="audio-preview-wrapper relative h-[400px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-700">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                                        <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                            <Mic size={64} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <audio src={selectedAudio} controls className="w-full max-w-md mb-4" />
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedAudio(null); setAudioFile(null); setAiResult(null); setMediaType(null); }}
                                            className="mt-4 bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            Remove Audio
                                        </button>
                                    </div>

                                    {/* AI Analysis Overlay for Audio */}
                                    <AnimatePresence>
                                        {(analyzing || aiResult) && (
                                            <motion.div
                                                initial={{ y: 100, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700"
                                            >
                                                {analyzing ? (
                                                    <div className="flex items-center gap-4">
                                                        <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">Gemini AI Analysis</div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Transcribing and analyzing audio...</div>
                                                        </div>
                                                    </div>
                                                ) : aiResult && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${aiResult.isVerified ? 'bg-blue-600 dark:bg-blue-500' : 'bg-red-600 dark:bg-red-500'}`}>
                                                                {aiResult.isVerified ? <CheckCircle size={20} className="text-white" /> : <AlertTriangle size={20} className="text-white" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{aiResult.detected}</h4>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400">{aiResult.recommendation}</p>
                                                            </div>
                                                        </div>
                                                        {aiResult.transcription && (
                                                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                                <h5 className="font-bold text-xs text-slate-900 dark:text-white mb-2">Transcription:</h5>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{aiResult.transcription}"</p>
                                                            </div>
                                                        )}
                                                        {aiResult.isVerified && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">AI Confidence</span>
                                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{aiResult.confidence}</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                                    <div className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500" style={{ width: aiResult.confidence }}></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Right Column: Form - 3 columns */}
                <div className="lg:col-span-3">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Location Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="text-blue-600 dark:text-blue-400" size={20} />
                                    Location
                                </h3>
                            </div>

                            {isLoaded && (
                                <div className="mb-4">
                                    <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Search location manually..."
                                                className="w-full pl-12 pr-14 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={detectLocation}
                                                title="Use current location"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-100 dark:bg-slate-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                                            >
                                                {location.address === 'Detecting location...' ? (
                                                    <Loader2 size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
                                                ) : (
                                                    <Crosshair size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </Autocomplete>
                                </div>
                            )}

                            <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg relative overflow-hidden border border-slate-200 dark:border-slate-600">
                                {isLoaded && location.lat ? (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={{ lat: location.lat, lng: location.lng }}
                                        zoom={15}
                                        onLoad={onMapLoad}
                                        onUnmount={onUnmount}
                                        options={{
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: false,
                                            styles: theme === 'dark' ? darkMapStyles : lightMapStyles
                                        }}
                                    >
                                        <Marker
                                            position={{ lat: location.lat, lng: location.lng }}
                                            draggable={true}
                                            onDragEnd={onMarkerDragEnd}
                                        />
                                    </GoogleMap>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                                        <Loader2 className="animate-spin mb-2 text-blue-600 dark:text-blue-400" size={32} />
                                        <span className="text-sm font-semibold">Detecting your location...</span>
                                    </div>
                                )}

                                <div className="absolute bottom-3 left-3 right-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate">
                                    {location.address}
                                </div>
                            </div>
                        </div>

                        {/* Department & Category */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Department & Category</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Department</label>
                                    <select
                                        required
                                        value={department}
                                        onChange={(e) => { setDepartment(e.target.value); setCategory(null); }}
                                        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-white transition-colors"
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Municipal/Waste">Municipal/Waste</option>
                                        <option value="Electricity Board">Electricity Board</option>
                                        <option value="Water Supply">Water Supply</option>
                                        <option value="Traffic">Traffic</option>
                                        <option value="Police">Police</option>
                                        <option value="Fire & Safety">Fire & Safety</option>
                                        <option value="Medical/Ambulance">Medical/Ambulance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Issue Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {department === 'Municipal/Waste' && (
                                            <>
                                                <CategoryCard id="pothole" icon={<AlertTriangle />} label="Pothole" selected={category === 'pothole'} onClick={() => setCategory('pothole')} />
                                                <CategoryCard id="garbage" icon={<Trash2 />} label="Garbage" selected={category === 'garbage'} onClick={() => setCategory('garbage')} />
                                            </>
                                        )}
                                        {department === 'Electricity Board' && (
                                            <>
                                                <CategoryCard id="light" icon={<Lightbulb />} label="Street Light" selected={category === 'light'} onClick={() => setCategory('light')} />
                                                <CategoryCard id="wire" icon={<AlertTriangle />} label="Loose Wire" selected={category === 'wire'} onClick={() => setCategory('wire')} />
                                            </>
                                        )}
                                        {department === 'Water Supply' && (
                                            <>
                                                <CategoryCard id="water" icon={<Droplets />} label="Leakage" selected={category === 'water'} onClick={() => setCategory('water')} />
                                                <CategoryCard id="sewage" icon={<Trash2 />} label="Sewage" selected={category === 'sewage'} onClick={() => setCategory('sewage')} />
                                            </>
                                        )}
                                        {!department && (
                                            <>
                                                <CategoryCard id="pothole" icon={<AlertTriangle />} label="Pothole" selected={category === 'pothole'} onClick={() => { setCategory('pothole'); setDepartment('Municipal/Waste'); }} />
                                                <CategoryCard id="garbage" icon={<Trash2 />} label="Garbage" selected={category === 'garbage'} onClick={() => { setCategory('garbage'); setDepartment('Municipal/Waste'); }} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Additional Details (Optional)</label>
                                <textarea
                                    name="description"
                                    placeholder="Describe the issue in detail..."
                                    className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-4 focus:border-blue-500 focus:outline-none resize-none h-24 text-slate-900 dark:text-white transition-colors"
                                ></textarea>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!selectedImage && !selectedVideo && !selectedAudio || analyzing || !department}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Submit Report
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Success Popup Modal */}
            <AnimatePresence>
                {showSuccessPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl"
                        >
                            {/* Success Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                    <div className="relative w-20 h-20 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                                        <CheckCircle size={48} className="text-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Success Message */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    Report Submitted Successfully!
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    Thank you for helping improve your community
                                </p>

                                {/* Points Earned */}
                                <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                                        <Award size={24} />
                                        <span className="text-xl font-bold">+10 Points Earned!</span>
                                    </div>
                                </div>

                                {/* Report ID */}
                                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Report ID</p>
                                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                        {submittedReportId}
                                    </p>
                                </div>
                            </div>

                            {/* Auto Redirect Message */}
                            <div className="text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-500">
                                    Redirecting to My Reports...
                                </p>
                                <div className="mt-3 flex justify-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </CivicLayout>
    );
};

const CategoryCard = ({ id, icon, label, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${selected
            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
    >
        <div className={`mb-2 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

export default ReportIssue;