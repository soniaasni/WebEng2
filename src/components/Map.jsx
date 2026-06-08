import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

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

// Grüner Start-Marker (A)
const startIcon = L.divIcon({
  className: "",
  html: `<div style="
    background: #22c55e;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 13px;
    font-family: sans-serif;
  ">A</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
});

// Roter Ziel-Marker (B)
const targetIcon = L.divIcon({
  className: "",
  html: `<div style="
    background: #ef4444;
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "><span style="
    display: block;
    transform: rotate(45deg);
    color: white;
    font-weight: 700;
    font-size: 13px;
    font-family: sans-serif;
    text-align: center;
    line-height: 24px;
  ">B</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [8, 30],
  popupAnchor: [7, -32],
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

function FlyToPosition({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position]);

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

function RoutingMachine({
  startPosition,
  targetPosition,
  shouldRoute,
  setShouldRoute,
  setRouteInfo,
  setRouteError,
  setRouteLoading,
}) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!shouldRoute) return;

    if (!startPosition) {
      setRouteError("Bitte Standortfreigabe erlauben.");
      setRouteInfo(null);
      setShouldRoute(false);
      return;
    }

    if (!targetPosition) {
      setRouteError("Bitte zuerst ein Ziel auswählen.");
      setRouteInfo(null);
      setShouldRoute(false);
      return;
    }

    // Alte Route entfernen
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startPosition[0], startPosition[1]),
        L.latLng(targetPosition[0], targetPosition[1]),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: "https://routing.openstreetmap.de/routed-bike/route/v1",
        profile: "bike",
      }),
      // Eigene Marker übernehmen — LRM-Waypoint-Marker deaktivieren
      createMarker: () => null,
      // Blaue Route mit Outline für gute Sichtbarkeit
      lineOptions: {
        styles: [
          { color: "#1e40af", weight: 9, opacity: 0.25 },
          { color: "#3b82f6", weight: 5, opacity: 0.9 },
        ],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
    });

    routingControl.on("routesfound", (event) => {
      const route = event.routes[0];
      setRouteInfo({
        distanceKm: (route.summary.totalDistance / 1000).toFixed(1),
        durationMin: Math.round(route.summary.totalTime / 60),
      });
      setRouteLoading(false);
      setRouteError("");
      setShouldRoute(false);
    });

    routingControl.on("routingerror", () => {
      setRouteLoading(false);
      setRouteInfo(null);
      setRouteError("Route konnte nicht berechnet werden.");
      setShouldRoute(false);
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [shouldRoute]);

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
    headers: { "Accept-Language": "de" },
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
    headers: { "Accept-Language": "de" },
  });

  const data = await response.json();

  if (!data || data.length === 0) return null;

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}

export default function Map({
  searchPlace,
  onSearchError,
  userPosition,
  targetPosition,
  setTargetPosition,
  shouldRoute,
  setShouldRoute,
  setRouteInfo,
  setRouteError,
  setRouteLoading,
  routeInfo,
}) {
  const [placeName, setPlaceName] = useState("");
  const [wikiInfo, setWikiInfo] = useState(null);
  const requestId = useRef(0);
  const markerRef = useRef(null);

  // Popup nach Wikipedia-Laden öffnen
  useEffect(() => {
    if (wikiInfo && wikiInfo !== "loading") {
      markerRef.current?.openPopup();
    }
  }, [wikiInfo]);

  // Pin + Wikipedia beim Standort-Button
  useEffect(() => {
    if (!userPosition) return;

    const currentId = ++requestId.current;
    setTargetPosition(userPosition);
    setPlaceName("Ort wird geladen...");
    setWikiInfo("loading");

    if (!navigator.onLine) {
      setPlaceName("Kein Internet");
      setWikiInfo("offline");
      return;
    }

    async function loadLocationInfo() {
      try {
        const name = await fetchPlaceName(userPosition[0], userPosition[1]);
        if (requestId.current !== currentId) return;
        setPlaceName(name);

        const wiki = await fetchWikipediaInfo(name);
        if (requestId.current !== currentId) return;
        setWikiInfo(wiki ?? "not_found");
      } catch {
        if (requestId.current !== currentId) return;
        setPlaceName("Ort konnte nicht geladen werden");
        setWikiInfo("error");
      }
    }

    loadLocationInfo();
  }, [userPosition]);

  // Route auto-aktualisieren wenn neues Ziel gewählt und Route bereits aktiv
  useEffect(() => {
    if (!targetPosition || !routeInfo) return;
    setRouteLoading(true);
    setShouldRoute(true);
  }, [targetPosition]);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={userPosition || [51.1657, 10.4515]}
        zoom={13}
        closePopupOnClick={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        />

        <FlyToPosition position={userPosition} />

        <SearchPlaceHandler
          searchPlace={searchPlace}
          setTargetPosition={setTargetPosition}
          setPlaceName={setPlaceName}
          setWikiInfo={setWikiInfo}
          onSearchError={onSearchError}
          requestId={requestId}
        />

        <RoutingMachine
          startPosition={userPosition}
          targetPosition={targetPosition}
          shouldRoute={shouldRoute}
          setShouldRoute={setShouldRoute}
          setRouteInfo={setRouteInfo}
          setRouteError={setRouteError}
          setRouteLoading={setRouteLoading}
        />

        {/* Grüner A-Marker an der Startposition (nur wenn Route aktiv) */}
        {userPosition && routeInfo && (
          <Marker position={userPosition} icon={startIcon}>
            <Popup>
              <strong>Dein Standort</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.85em", color: "#64748b" }}>
                Startpunkt der Route
              </p>
            </Popup>
          </Marker>
        )}

        {/* Roter B-Marker am Zielort */}
        {targetPosition && (
          <Marker
            position={targetPosition}
            icon={targetIcon}
            ref={markerRef}
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
