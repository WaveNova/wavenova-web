"use client";

import { useEffect, useRef, useState } from "react";

interface LatLng { lat: number; lng: number }

interface Props {
  defaultLat?: number | null;
  defaultLng?: number | null;
  onChange: (coords: LatLng) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initGoogleMaps?: () => void;
  }
}

export default function LocationPicker({ defaultLat, defaultLng, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<LatLng | null>(
    defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : null
  );

  useEffect(() => {
    if (window.google?.maps?.places) { setLoaded(true); return; }

    window.initGoogleMaps = () => setLoaded(true);

    if (!document.getElementById("gmap-script")) {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const script = document.createElement("script");
      script.id = "gmap-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["geometry", "name", "formatted_address"],
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;
      const coords = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setSelected(coords);
      onChange(coords);
    });
  }, [loaded, onChange]);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search your station location on Google Maps…"
        className="w-full border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#24B5CB]"
      />
      {selected && (
        <p className="text-xs text-[#059669] mt-1.5 font-medium">
          ✓ Location set — {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
        </p>
      )}
      {!selected && defaultLat && defaultLng && (
        <p className="text-xs text-[#9CA3AF] mt-1.5">
          Current: {defaultLat.toFixed(5)}, {defaultLng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
