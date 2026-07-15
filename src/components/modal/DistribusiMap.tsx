"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Ikon tetap
const clinicIcon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:#0f172a;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

// Utility menghitung bearing
function calculateBearing(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x =
        Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Utility menghitung jarak (Haversine) dalam meter
function getDistanceInMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000; // radius bumi dalam meter
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Props
interface DistribusiMapProps {
    destination: {
        name: string;
        latitude: number | null;
        longitude: number | null;
    } | null;
    route: { latitude: number; longitude: number }[];
}

// Komponen pengendali viewport
function FitBounds({ destination, route }: DistribusiMapProps) {
    const map = useMap();
    useEffect(() => {
        const points: [number, number][] = [];
        if (destination?.latitude != null && destination?.longitude != null) {
            points.push([destination.latitude, destination.longitude]);
        }
        const lastPoint = route[route.length - 1];
        if (lastPoint) {
            points.push([lastPoint.latitude, lastPoint.longitude]);
        }
        if (points.length === 0) return;
        if (points.length === 1) {
            map.setView(points[0], 14, { animate: true });
            return;
        }
        map.fitBounds(points, { padding: [70, 70], animate: true, maxZoom: 16 });
    }, [destination, route, map]);
    return null;
}

// Komponen Utama
export default function DistribusiMap({
    destination,
    route,
}: DistribusiMapProps) {
    const hasDestination =
        destination?.latitude != null && destination?.longitude != null;
    const currentPoint = route[route.length - 1];

    // State untuk menyimpan rute dari OSRM
    const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);

    // Ref untuk menyimpan koordinat terakhir yang di-request agar bisa optimasi 10m
    const lastRequestedCoord = useRef<{ lat: number; lng: number } | null>(null);
    // Ref untuk menyimpan AbortController agar bisa membatalkan fetch sebelumnya
    const abortControllerRef = useRef<AbortController | null>(null);

    // Bearing untuk orientasi truk
    const bearing = useMemo(() => {
        if (route.length < 2) return 0;
        const a = route[route.length - 2];
        const b = currentPoint;
        return calculateBearing(a.latitude, a.longitude, b.latitude, b.longitude);
    }, [route, currentPoint]);

    const driverIcon = useMemo(
        () =>
            L.divIcon({
                className: "",
                html: `<div style="position:relative;width:32px;height:32px;transform:rotate(${bearing}deg);">
                    <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.25;animation:driver-pulse 2s ease-out infinite;"></div>
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚚</div>
                </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            }),
        [bearing]
    );

    // Effect untuk mengambil rute OSRM saat posisi driver berubah signifikan
    useEffect(() => {
        // Hanya jika kita punya driver & destination yang valid
        if (!hasDestination || !currentPoint) {
            setOsrmRoute(null);
            return;
        }

        const destLat = destination!.latitude!;
        const destLng = destination!.longitude!;
        const driverLat = currentPoint.latitude;
        const driverLng = currentPoint.longitude;

        // Cek jarak dengan koordinat terakhir yang di-fetch
        const last = lastRequestedCoord.current;
        if (last) {
            const distance = getDistanceInMeters(
                last.lat,
                last.lng,
                driverLat,
                driverLng
            );
            // Jika masih dalam radius 10 meter, jangan request ulang
            if (distance < 10) return;
        }

        // Batalkan request sebelumnya jika ada
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const url = `https://router.project-osrm.org/route/v1/driving/${destLng},${destLat};${driverLng},${driverLat}?overview=full&geometries=geojson`;

        fetch(url, { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error("OSRM request failed");
                const data = await response.json();
                if (!data.routes || data.routes.length === 0) {
                    throw new Error("No route found");
                }
                // GeoJSON coordinates: [lng, lat] → Leaflet [lat, lng]
                const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
                    (c: [number, number]) => [c[1], c[0]]
                );
                setOsrmRoute(coords);
                // Simpan titik driver yang baru saja berhasil di-fetch
                lastRequestedCoord.current = {
                    lat: driverLat,
                    lng: driverLng,
                };
            })
            .catch((err) => {
                if ((err as Error).name !== "AbortError") {
                    console.warn("Gagal mengambil rute OSRM, fallback ke garis lurus", err);
                    setOsrmRoute(null); // akan menampilkan fallback garis lurus
                }
            });

        return () => {
            controller.abort();
        };
    }, [hasDestination, destination?.latitude, destination?.longitude, currentPoint]);

    // Tentukan posisi polyline yang akan ditampilkan:
    // - rute OSRM jika tersedia,
    // - jika tidak, fallback ke garis lurus antara destinasi dan driver
    const polylinePositions: [number, number][] = useMemo(() => {
        if (osrmRoute) return osrmRoute;

        // Fallback garis lurus
        if (hasDestination && currentPoint) {
            return [
                [destination!.latitude!, destination!.longitude!],
                [currentPoint.latitude, currentPoint.longitude],
            ];
        }
        return [];
    }, [osrmRoute, hasDestination, destination, currentPoint]);

    // Pusat awal peta
    const initialCenter: [number, number] = hasDestination
        ? [destination!.latitude!, destination!.longitude!]
        : [-6.9175, 107.6191];

    return (
        <>
            <style>{`
                @keyframes driver-pulse {
                    0% { transform: scale(0.95); opacity:0.35; }
                    50% { transform: scale(1.4); opacity:0.1; }
                    100% { transform: scale(1.8); opacity:0; }
                }
                .leaflet-container { z-index:1 !important; }
                .leaflet-pane { z-index:1 !important; }
                .leaflet-top, .leaflet-bottom { z-index:2 !important; }
            `}</style>
            <MapContainer
                center={initialCenter}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marker destinasi */}
                {hasDestination && (
                    <Marker
                        position={[destination!.latitude!, destination!.longitude!]}
                        icon={clinicIcon}
                    >
                        <Popup>{destination!.name}</Popup>
                    </Marker>
                )}

                {/* Polyline rute OSRM atau fallback */}
                {polylinePositions.length > 0 && (
                    <Polyline
                        positions={polylinePositions}
                        pathOptions={{ color: "#2563eb", weight: 4 }}
                    />
                )}

                {/* Marker driver (truk berputar) */}
                {currentPoint && (
                    <Marker
                        position={[currentPoint.latitude, currentPoint.longitude]}
                        icon={driverIcon}
                    />
                )}

                {/* FitBounds otomatis */}
                <FitBounds destination={destination} route={route} />
            </MapContainer>
        </>
    );
}