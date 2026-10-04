'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

type Position = { gpsLat: number; gpsLng: number; horodatage: string };
type DriverLocation = { livreurId: string; nom: string; statut: string; dernierePosition: Position | null };
const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const mapCenter: LatLngExpression = [12.3714, -1.5197];

export default function DriverMap({ token }: { token: string }) {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      let accessToken = sessionStorage.getItem('unique-token') || token;
      const headers = () => ({ Authorization: `Bearer ${accessToken}` });
      let response = await fetch(`${api}/gps/livreurs/dernieres-positions`, { headers: headers() });
      if (response.status === 401) {
        const refreshToken = sessionStorage.getItem('unique-refresh');
        if (refreshToken) {
          const refreshed = await fetch(`${api}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
          if (refreshed.ok) {
            const pair = await refreshed.json();
            accessToken = pair.accessToken as string;
            sessionStorage.setItem('unique-token', accessToken);
            sessionStorage.setItem('unique-refresh', pair.refreshToken as string);
            response = await fetch(`${api}/gps/livreurs/dernieres-positions`, { headers: headers() });
          }
        }
      }
      if (!response.ok) throw new Error('Positions GPS indisponibles');
      setDrivers(await response.json() as DriverLocation[]);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Erreur GPS'); }
  }, [token]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    const socket = io(api.replace(/\/api\/?$/, ''), { auth: (done) => done({ token: sessionStorage.getItem('unique-token') || token }), transports: ['websocket', 'polling'] });
    socket.on('position:livreur', (position: Position & { livreurId: string }) => {
      setDrivers((current) => current.map((driver) => driver.livreurId === position.livreurId
        ? { ...driver, dernierePosition: position } : driver));
    });
    return () => { window.clearInterval(interval); socket.disconnect(); };
  }, [load, token]);

  const located = drivers.filter((driver) => driver.dernierePosition &&
    Number.isFinite(driver.dernierePosition.gpsLat) && Number.isFinite(driver.dernierePosition.gpsLng));
  return <div className="driver-map-wrap">
    <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="driver-map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {located.map((driver) => {
        const point = driver.dernierePosition!;
        const icon = divIcon({ className: 'driver-marker', html: '<span></span>', iconSize: [30, 30], iconAnchor: [15, 15] });
        return <Marker key={driver.livreurId} position={[point.gpsLat, point.gpsLng]} icon={icon}><Popup><strong>{driver.nom}</strong><br/>{driver.statut.replaceAll('_', ' ')}<br/>Dernière position : {age(point.horodatage)}</Popup></Marker>;
      })}
    </MapContainer>
    <div className="map-caption">{error || (located.length ? `${located.length} position(s) · ${located.map((d) => `${d.nom} : ${age(d.dernierePosition!.horodatage)}`).join(' · ')}` : 'Aucune position GPS enregistrée.')}</div>
  </div>;
}

function age(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (!Number.isFinite(minutes)) return 'date inconnue';
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  return `il y a ${Math.floor(minutes / 60)} h`;
}
