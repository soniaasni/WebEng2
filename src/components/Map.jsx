import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

export default function Map() {
  const [position, setPosition] = useState(null);

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

        {position && (
          <Marker position={position}>
            <Popup>Dein aktueller Standort</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}