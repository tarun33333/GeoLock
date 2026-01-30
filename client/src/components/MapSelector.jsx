import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

const SearchField = ({ provider }) => {
    const map = useMapEvents({});
    useEffect(() => {
        const searchControl = new GeoSearchControl({
            provider,
            style: 'bar', // 'bar' or 'button'
            showMarker: true,
            showPopup: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: true,
            searchLabel: 'Enter address',
        });
        map.addControl(searchControl);

        map.on('geosearch/showlocation', (e) => {
            // e.location contains label, x (lng), y (lat), bounds
        });

        return () => map.removeControl(searchControl);
    }, [map, provider]);
    return null;
};

const LocationMarker = ({ setLocation, initialPos }) => {
    const [position, setPosition] = useState(initialPos || null);

    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            setLocation(e.latlng);
        },
        locationfound(e) {
            setPosition(e.latlng);
            setLocation(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
        'geosearch/showlocation': (e) => {
            const latlng = { lat: e.location.y, lng: e.location.x };
            setPosition(latlng);
            setLocation(latlng);
        }
    });

    useEffect(() => {
        if (!initialPos) map.locate();
        else {
            // If initialPos provided, fly to it
            map.flyTo(initialPos, map.getZoom());
        }
    }, [map, initialPos]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const LocateControl = () => {
    const map = useMapEvents({});

    const handleLocate = (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.locate({ setView: true, maxZoom: 16 });
    };

    return (
        <div
            className="leaflet-top leaflet-left"
            style={{ marginTop: '80px', marginLeft: '10px', pointerEvents: 'auto' }}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white" style={{ border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                <button
                    type="button"
                    onClick={handleLocate}
                    className="flex items-center justify-center w-8 h-8 bg-white hover:bg-gray-100 text-gray-700 focus:outline-none"
                    title="Locate Me"
                    style={{ cursor: 'pointer', border: 'none' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const MapSelector = ({ onLocationSelect, initialPos, className = "" }) => {
    const provider = new OpenStreetMapProvider();

    return (
        <div className={`h-full w-full relative z-0 ${className}`}>
            {/* z-0 important for search bar layering if modal */}
            <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <SearchField provider={provider} />
                <LocateControl />
                <LocationMarker setLocation={onLocationSelect} initialPos={initialPos} />
            </MapContainer>
        </div>
    );
};

export default MapSelector;
