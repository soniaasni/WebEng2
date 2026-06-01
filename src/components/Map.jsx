import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Button } from "framework7-react";
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


function MapClickHandler({
  setTargetPosition,
  setPlaceName,
  setWikiInfo,
  onSearchError,
  requestId,
}) {
  useMapEvents({
    async click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      const currentId = ++requestId.current;

      setTargetPosition(coords);
      setPlaceName("Ort wird geladen...");
      setWikiInfo("loading");
      onSearchError?.("");

      if (!navigator.onLine) {
        setPlaceName("Kein Internet");
        setWikiInfo("offline");
        return;
      }

      try {
        const name = await fetchPlaceName(e.latlng.lat, e.latlng.lng);

        if (requestId.current !== currentId) return;

        setPlaceName(name);

        const wiki = await fetchWikipediaInfo(name);

        if (requestId.current !== currentId) return;

        setWikiInfo(wiki ?? "not_found");
      } catch (error) {
        if (requestId.current !== currentId) return;

        console.error("Reverse Geocoding fehlgeschlagen:", error);
        setPlaceName("Ort konnte nicht geladen werden");
        setWikiInfo("error");
      }
    },
  });

  return null;
}

function SearchPlaceHandler({
  searchPlace,
  setTargetPosition,
  setPlaceName,
  setWikiInfo,
  onSearchError,
  requestId,
}) {
  const map = useMap();

  useEffect(() => {
    if (!searchPlace) return;

    async function search() {
      const currentId = ++requestId.current;

      if (!navigator.onLine) {
        onSearchError?.("Suche ist offline nicht verfügbar.");
        setWikiInfo("offline");
        return;
      }

      try {
        const result = await fetchCoordinatesForPlace(searchPlace);

        if (requestId.current !== currentId) return;

        if (!result) {
          onSearchError?.("Kein passender Ort gefunden.");
          return;
        }

        const coords = [result.lat, result.lon];

        setTargetPosition(coords);
        setPlaceName(result.displayName);
        setWikiInfo("loading");
        onSearchError?.("");

        map.setView(coords, 14);

        const wiki = await fetchWikipediaInfo(result.displayName);

        if (requestId.current !== currentId) return;

        setWikiInfo(wiki ?? "not_found");

        console.log("Ort über Suche gefunden:", result);
      } catch (error) {
        if (requestId.current !== currentId) return;

        console.error("Ortssuche fehlgeschlagen:", error);
        onSearchError?.("Ortssuche konnte nicht ausgeführt werden.");
        setWikiInfo("error");
      }
    }

    search();
  }, [searchPlace]);

  return null;
}

async function fetchWikipediaInfo(placeName) {
  const searchTerm = placeName.split(",")[0].trim();

  const url =
    `https://de.wikipedia.org/w/api.php?action=query` +
    `&prop=extracts&exintro=true&explaintext=true&redirects=1` +
    `&titles=${encodeURIComponent(searchTerm)}&format=json&origin=*`;

  const response = await fetch(url);
  const data = await response.json();

  const pages = data.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];

  if (page.missing !== undefined || page.pageid === undefined) return null;

  const extract = page.extract?.trim();
  if (!extract) return null;

  if (
    extract.startsWith(searchTerm + " steht für") ||
    extract.includes("Begriffsklärung")
  ) {
    return null;
  }

  const shortExtract =
    extract.length > 250 ? extract.slice(0, 250).trimEnd() + " …" : extract;

  return {
    title: page.title,
    extract: shortExtract,
    url: `https://de.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
  };
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

async function fetchCoordinatesForPlace(placeName) {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(placeName)}` +
    `&format=json&limit=1&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "de",
    },
  });

  const data = await response.json();

  if (!data || data.length === 0) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}

export default function Map({ searchPlace, onSearchError }) {
  const [placeName, setPlaceName] = useState("");
  const [position, setPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  const [wikiInfo, setWikiInfo] = useState(null);
  const requestId = useRef(0);


  return (
    <div className="map-wrapper">
      <MapContainer
        center={position || [51.1657, 10.4515]}
        zoom={13}
        closePopupOnClick={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        />


        <SearchPlaceHandler
          searchPlace={searchPlace}
          setTargetPosition={setTargetPosition}
          setPlaceName={setPlaceName}
          setWikiInfo={setWikiInfo}
          onSearchError={onSearchError}
          requestId={requestId}
        />

        {targetPosition && (
          <Marker
            position={targetPosition}
            eventHandlers={{
              add: (e) => e.target.openPopup(),
              move: (e) => e.target.openPopup(),
            }}
          >
            <Popup minWidth={220}>
              <strong>{placeName || "Ausgewähltes Ziel"}</strong>

              {wikiInfo === "loading" && (
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.85em" }}>
                  Wikipedia wird geladen…
                </p>
              )}

              {wikiInfo === "offline" && (
                <p style={{ margin: "6px 0 0", color: "#f97316", fontSize: "0.85em" }}>
                  Wikipedia ist offline nicht verfügbar.
                </p>
              )}

              {wikiInfo === "not_found" && (
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.85em" }}>
                  Kein Wikipedia-Artikel gefunden.
                </p>
              )}

              {wikiInfo === "error" && (
                <p style={{ margin: "6px 0 0", color: "#ef4444", fontSize: "0.85em" }}>
                  Wikipedia nicht erreichbar.
                </p>
              )}

              {wikiInfo && typeof wikiInfo === "object" && (
                <div style={{ marginTop: "6px", fontSize: "0.85em" }}>
                  <p style={{ margin: "0 0 4px" }}>{wikiInfo.extract}</p>
                  <a href={wikiInfo.url} target="_blank" rel="noopener noreferrer">
                    Weiterlesen auf Wikipedia
                  </a>
                </div>
              )}
            </Popup>
          </Marker>
        )}

        <MapClickHandler
          setTargetPosition={setTargetPosition}
          setPlaceName={setPlaceName}
          setWikiInfo={setWikiInfo}
          onSearchError={onSearchError}
          requestId={requestId}
        />
      </MapContainer>
    </div>
  );
}