import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix für fehlende Marker-Icons in Vite/React-Projekten
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Button-Komponente innerhalb der Karte
function LocateButton({ setPosition }) {
  const map = useMap();

  const locateUser = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation wird nicht unterstützt.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setPosition(newPosition);
        map.setView(newPosition, 16);

        console.log("Standort aktualisiert:", newPosition);
      },
      (err) => {
        console.error("Standort konnte nicht geladen werden:", err);
      }
    );
  };

  return (
    <button
      onClick={locateUser}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        padding: "8px 12px",
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      📍 Standort anzeigen
    </button>
  );
}

function MapClickHandler({ setTargetPosition, setPlaceName }) {
  useMapEvents({
    async click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];

      setTargetPosition(coords);
      setPlaceName("Ort wird geladen...");

      console.log("Zielkoordinate gewählt:", coords);

      try {
        const name = await fetchPlaceName(e.latlng.lat, e.latlng.lng);
        setPlaceName(name);
        console.log("Gefundener Ort:", name);
      } catch (error) {
        console.error("Reverse Geocoding fehlgeschlagen:", error);
        setPlaceName("Ort konnte nicht geladen werden");
      }
    },
  });

  return null;
}

async function fetchPlaceName(lat, lon) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?` +
    `lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "de",
    },
  });

  const data = await response.json();

  return (
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.municipality ||
    data.address?.county ||
    data.display_name ||
    "Unbekannter Ort"
  );
}

export default function Map() {
  const [placeName, setPlaceName] = useState("");
  const [position, setPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation wird nicht unterstützt.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const initialPosition = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setPosition(initialPosition);
        console.log("Initialer Standort:", initialPosition);
      },
      (err) => {
        console.error("Standort konnte nicht geladen werden:", err);
      }
    );
  }, []);

  return (
    <div style={{ height: "400px", width: "100%", position: "relative" }}>
      <MapContainer
        center={position || [51.1657, 10.4515]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        />

        <LocateButton setPosition={setPosition} />

        {targetPosition && (
        <Marker position={targetPosition}>
          <Popup>{placeName || "Ausgewähltes Ziel"}</Popup>
        </Marker>
      )}
        <MapClickHandler setTargetPosition={setTargetPosition} 
        setPlaceName={setPlaceName}/>
      </MapContainer>
    </div>
  );
}