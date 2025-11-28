"use client";
import { useState, useCallback, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { MapPin, Loader, Search } from "lucide-react";

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.75rem",
};

// Default center: 28.3652° N, 77.5411° E
const defaultCenter = {
    lat: 28.3652,
    lng: 77.5411,
};

const libraries = ["places"];

export default function StepLocation({ data, updateData }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries, // Use static constant
    });

    const [map, setMap] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);

    const onLoad = (map) => {
        setMap(map);
    };

    const onUnmount = () => {
        setMap(null);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                updateData({
                    location: { lat, lng },
                    address: place.formatted_address // Optionally store address if needed elsewhere
                });

                map.panTo({ lat, lng });
                map.setZoom(15);
            } else {
                console.log("No details available for input: '" + place.name + "'");
            }
        }
    };

    const onMapClick = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateData({ location: { lat, lng } });
    };

    if (loadError) {
        return (
            <div className="h-[400px] w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-500">
                <p className="text-red-500 font-medium">Error loading Maps</p>
                <p className="text-xs mt-2">{loadError.message}</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-[400px] w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-500">
                <Loader className="animate-spin mb-2" />
                <p>Loading Maps...</p>
                <p className="text-xs mt-2">Make sure API Key is set in .env.local</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Where are you located?</h2>
                <p className="text-gray-500">Pin your business location on the map.</p>
            </div>

            <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-md border border-gray-200">
                {/* Search Box */}
                <div className="absolute top-4 left-4 right-4 z-10">
                    <Autocomplete
                        onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for your location..."
                                className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        </div>
                    </Autocomplete>
                </div>

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={data.location || defaultCenter}
                    zoom={13}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={onMapClick}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                >
                    {data.location && <Marker position={data.location} />}
                </GoogleMap>
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-sm justify-center">
                <MapPin size={16} />
                {data.location ? (
                    <span>Location Selected</span>
                ) : (
                    <span>Tap on map or search to select location</span>
                )}
            </div>
        </div>
    );
}
