"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Station { name: string; lat: number; lng: number; partner: string }

export default function StationMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    supabase
      .from("projects")
      .select("name, partner_slug, lat, lng")
      .not("lat", "is", null)
      .not("lng", "is", null)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setStations(data.map((p) => ({ name: p.name, lat: p.lat, lng: p.lng, partner: p.partner_slug })));
        }
      });
  }, []);

  useEffect(() => {
    if (stations.length === 0 || initialized.current || !mapRef.current) return;
    initialized.current = true;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([-8.85, 116.15], 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const pinHtml = `<div style="background:#24B5CB;width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`;
      const icon = L.divIcon({ html: pinHtml, className: "", iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10] });

      stations.forEach(({ name, lat, lng, partner }) => {
        L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`<strong style="color:#1A7A8A">${name}</strong><br><span style="font-size:12px;color:#6B7280">${partner}</span>`);
      });
    };
    document.head.appendChild(script);
  }, [stations]);

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: 300 }} />;
}
