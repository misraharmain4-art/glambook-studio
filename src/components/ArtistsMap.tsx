import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Pin = {
  id: string;
  name: string;
  city: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  base_price: number | null;
  rating: number;
};

type Props = {
  artists: Pin[];
  onPinClick?: (artistId: string) => void;
};

// Fix leaflet icon URLs (Vite breaks the default ones)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function ArtistsMap({ artists, onPinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    // Default centre: India
    const map = L.map(containerRef.current, {
      center: [22.9734, 78.6569],
      zoom: 5,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (artists.length === 0) return;

    const bounds = L.latLngBounds([]);
    artists.forEach((a) => {
      const marker = L.marker([a.latitude, a.longitude], { icon: defaultIcon }).addTo(map);
      const priceText = a.base_price != null ? `₹${Number(a.base_price).toLocaleString("en-IN")}` : "—";
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:180px">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px">${escapeHtml(a.name)}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px">${escapeHtml(a.city ?? "—")}</div>
          <div style="display:flex;justify-content:space-between;font-size:12px">
            <span>★ ${Number(a.rating).toFixed(1)}</span>
            <span style="font-weight:600">${priceText}</span>
          </div>
          <button id="pin-${a.id}" style="margin-top:8px;width:100%;padding:6px;border:0;border-radius:8px;background:linear-gradient(135deg,#e5739a,#c5527a);color:#fff;font-weight:600;cursor:pointer">View profile</button>
        </div>`
      );
      marker.on("popupopen", () => {
        const btn = document.getElementById(`pin-${a.id}`);
        btn?.addEventListener("click", () => onPinClick?.(a.id));
      });
      markersRef.current.push(marker);
      bounds.extend([a.latitude, a.longitude]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [artists, onPinClick]);

  return <div ref={containerRef} className="w-full h-[520px] rounded-3xl overflow-hidden shadow-card border" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
