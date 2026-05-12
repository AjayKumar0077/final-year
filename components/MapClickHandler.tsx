'use client';

import { useMapEvents } from 'react-leaflet';

export function MapClickHandler({ onPinSelect }: { onPinSelect: (point: { latitude: number; longitude: number }) => void }) {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number } }) {
      onPinSelect({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });
  return null;
}

