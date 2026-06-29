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

// ═══════════════════════════════════════════════════════════ 
// Leaflet Marker-Icons: Fix für Vite/React
// ═══════════════════════════════════════════════════════════ 
// Ohne diesen Fix zeigen sich Marker-Icons nicht korrekt
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ═══════════════════════════════════════════════════════════ 
// Marker-Icons: Grüner Kreis für Start (A), roter Pfeil für Ziel (B)
// ═══════════════════════════════════════════════════════════ 

// Grüner Start-Marker
const startIcon = L.divIcon({
  className: "",
  html: `<div style="
    background: #22c55e;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],        // Mittelpunkt des Icons
  popupAnchor: [0, -18],       // Popup-Position relativ zum Icon
});

// Roter Ziel-Marker (Pfeil-Form)
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
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [8, 30],         // Spitze des Pfeils
  popupAnchor: [7, -32],       // Popup über der Spitze
});

// ═══════════════════════════════════════════════════════════ 
// MapClickHandler: Behandelt Klicks auf die Karte
// ═══════════════════════════════════════════════════════════ 
function MapClickHandler({
  setTargetPosition,        // Speichert Ziel-Koordinaten
  setPlaceName,             // Speichert Ortsname
  setWikiInfo,              // Speichert Wikipedia-Info
  onSearchError,            // Zeigt Fehler an
  requestId,                // Verhindert Race-Conditions
}) {
  useMapEvents({
    async click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      const currentId = ++requestId.current;

      // Sofort Marker setzen
      setTargetPosition(coords);
      setPlaceName("Ort wird geladen...");
      setWikiInfo("loading");
      onSearchError?.("");

      // Wenn offline: zeige es an
      if (!navigator.onLine) {
        setPlaceName("Kein Internet");
        setWikiInfo("offline");
        return;
      }

      try {
        // Finde Ortsnamen für die Koordinaten (Reverse Geocoding)
        const { displayName, searchTerm } = await fetchLocationInfo(e.latlng.lat, e.latlng.lng);
        if (requestId.current !== currentId) return; // Request ist veraltet
        setPlaceName(displayName);

        // Lade Wikipedia-Info
        const wiki = await fetchWikipediaInfo(searchTerm);
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

// ═══════════════════════════════════════════════════════════ 
// FlyToPosition: Karte fliegt zu einem Standort
// ═══════════════════════════════════════════════════════════ 
function FlyToPosition({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16); // Zoom-Stufe 16
    }
  }, [position]);

  return null;
}

// ═══════════════════════════════════════════════════════════ 
// SearchPlaceHandler: Sucht einen Ort und zeigt ihn auf der Karte
// ═══════════════════════════════════════════════════════════ 
function SearchPlaceHandler({
  searchPlace,              // Suchtext vom Benutzer
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

      // Offline-Check
      if (!navigator.onLine) {
        onSearchError?.("Suche ist offline nicht verfügbar.");
        setWikiInfo("offline");
        return;
      }

      try {
        // Finde Koordinaten für den Ortsnamen
        const result = await fetchCoordinatesForPlace(searchPlace);
        if (requestId.current !== currentId) return;

        if (!result) {
          onSearchError?.("Kein passender Ort gefunden.");
          return;
        }

        const coords = [result.lat, result.lon];
        const parts = result.displayName.split(",");
        const shortName = parts.slice(0, 2).join(",").trim();
        const wikiTerm = parts[0].trim();

        // Marker setzen
        setTargetPosition(coords);
        setPlaceName(shortName);
        setWikiInfo("loading");
        onSearchError?.("");
        map.setView(coords, 14); // Zoom-Stufe 14

        // Wikipedia-Info laden
        const wiki = await fetchWikipediaInfo(wikiTerm);
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

// ═══════════════════════════════════════════════════════════ 
// RoutingMachine: Berechnet und zeigt Route mit OSRM
// ═══════════════════════════════════════════════════════════ 
function RoutingMachine({
  startPosition,            // GPS-Standort
  startPositionOverride,    // Benutzerdefinierten Startort
  startLabel,               // Label für Startort
  targetPosition,           // Ziel
  shouldRoute,              // True = Route berechnen
  setShouldRoute,           // Schaltet Route aus
  setRouteInfo,             // Speichert Routendaten
  setRouteError,            // Zeigt Fehler
  setRouteLoading,          // Zeigt "lädt"-Status
  targetPlaceName,          // Name des Ziels
}) {
  const map = useMap();
  const routingControlRef = useRef(null); // Speichert Route-Kontrolle

  useEffect(() => {
    if (!shouldRoute) return;

    // Wähle Start: benutzerdef. oder GPS
    const effectiveStart = startPositionOverride || startPosition;

    if (!effectiveStart) {
      setRouteError("Bitte Standortfreigabe erlauben oder Startort eingeben.");
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

    // Neue Route berechnen mit OSRM
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(effectiveStart[0], effectiveStart[1]),
        L.latLng(targetPosition[0], targetPosition[1]),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1",
        profile: "car", // Auto-Route
      }),
      createMarker: () => null, // Keine eigenen Marker von LRM
      lineOptions: {
        styles: [
          { color: "#1e40af", weight: 9, opacity: 0.25 }, // Schatten
          { color: "#3b82f6", weight: 5, opacity: 0.9 },  // Vordergrund
        ],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false, // Verstecke LRM-Panel
    });

    // Wenn Route berechnet: Daten speichern
    routingControl.on("routesfound", (event) => {
      const route = event.routes[0];
      setRouteInfo({
        distanceKm: (route.summary.totalDistance / 1000).toFixed(1),
        durationMin: Math.round(route.summary.totalTime / 60),
        from: startLabel || "Dein Standort",
        to: targetPlaceName || "Ziel",
      });
      setRouteLoading(false);
      setRouteError("");
      setShouldRoute(false);
    });

    // Wenn Fehler: zeige ihn an
    routingControl.on("routingerror", () => {
      setRouteLoading(false);
      setRouteInfo(null);
      setRouteError("Route konnte nicht berechnet werden.");
      setShouldRoute(false);
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;
  }, [shouldRoute]);

  // Aufräumen beim Unmount
  useEffect(() => {
    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// ═══════════════════════════════════════════════════════════ 
// API-Funktionen: Wikipedia, Nominatim, OSRM
// ═══════════════════════════════════════════════════════════ 

// Hole Wikipedia-Artikel für einen Ortsnamen
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
  if (page.missing !== undefined || page.pageid === undefined) return null; // Artikel nicht gefunden

  const extract = page.extract?.trim();
  if (!extract) return null;

  // Filtere reine Begriffsklärungen
  if (
    extract.startsWith(searchTerm + " steht für") ||
    extract.includes("Begriffsklärung")
  ) {
    return null;
  }

  // Kürze auf 250 Zeichen
  const shortExtract =
    extract.length > 250 ? extract.slice(0, 250).trimEnd() + " …" : extract;

  return {
    title: page.title,
    extract: shortExtract,
    url: `https://de.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
  };
}

// Finde Ortsnamen für Koordinaten (Reverse Geocoding)
async function fetchLocationInfo(lat, lon) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?` +
    `lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  const response = await fetch(url, {
    headers: { "Accept-Language": "de" },
  });

  const data = await response.json();
  const addr = data.address || {};

  // Versuche beste Adresskomponenten zu finden
  const city =
    addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
  const road = addr.road;
  const houseNumber = addr.house_number;

  let displayName;
  if (road) {
    const street = houseNumber ? `${road} ${houseNumber}` : road;
    displayName = city ? `${street}, ${city}` : street;
  } else {
    displayName = city || data.display_name || "Unbekannter Ort";
  }

  return {
    displayName,
    searchTerm: city || road || data.display_name?.split(",")[0]?.trim() || "Unbekannter Ort",
  };
}

// Finde Koordinaten für einen Ortsnamen (Geocoding)
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

// ═══════════════════════════════════════════════════════════ 
// Hauptkomponente: Map
// ═══════════════════════════════════════════════════════════ 
export default function Map({
  searchPlace,              // Suchtext zum Anzeigen
  onSearchError,            // Fehler-Callback
  userPosition,             // GPS-Standort
  targetPosition,           // Ausgewähltes Ziel
  setTargetPosition,
  shouldRoute,              // Trigger für Routenberechnung
  setShouldRoute,
  setRouteInfo,
  setRouteError,
  setRouteLoading,
  routeInfo,                // Routendaten
  routeStartPosition,       // Benutzerdef. Startort
  routeStartLabel,          // Label für Startort
}) {
  const [placeName, setPlaceName] = useState(""); // Name des angeklickten Ortes
  const [wikiInfo, setWikiInfo] = useState(null); // Wikipedia-Info Status
  const requestId = useRef(0);                     // Verhindert Race-Conditions
  const markerRef = useRef(null);                  // Referenz zum Ziel-Marker

  // Öffne Popup wenn Wikipedia-Info geladen ist
  useEffect(() => {
    if (wikiInfo && wikiInfo !== "loading") {
      markerRef.current?.openPopup();
    }
  }, [wikiInfo]);

  // Wenn Nutzer "Standort"-Button klickt: Zeige Marker + Wikipedia
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
        const { displayName, searchTerm } = await fetchLocationInfo(userPosition[0], userPosition[1]);
        if (requestId.current !== currentId) return;
        setPlaceName(displayName);

        const wiki = await fetchWikipediaInfo(searchTerm);
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

  // Aktualisiere Routenbanner wenn Ortsname sich ändert
  useEffect(() => {
    if (
      !placeName ||
      placeName === "Ort wird geladen..." ||
      placeName === "Kein Internet" ||
      placeName === "Ort konnte nicht geladen werden"
    )
      return;
    setRouteInfo((prev) => (prev ? { ...prev, to: placeName } : null));
  }, [placeName]);

  // Auto-Neuberechnung wenn neues Ziel und Route bereits aktiv
  useEffect(() => {
    if (!targetPosition || !routeInfo) return;
    setRouteLoading(true);
    setShouldRoute(true);
  }, [targetPosition]);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={userPosition || [51.1657, 10.4515]} // Fallback: Mitte Deutschland
        zoom={13}
        closePopupOnClick={false}
        style={{ height: "100%", width: "100%" }}
      >
        {/* OSM Karte */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        />

        {/* Fliege zu Benutzer-Standort */}
        <FlyToPosition position={userPosition} />

        {/* Suche und zeige Ort */}
        <SearchPlaceHandler
          searchPlace={searchPlace}
          setTargetPosition={setTargetPosition}
          setPlaceName={setPlaceName}
          setWikiInfo={setWikiInfo}
          onSearchError={onSearchError}
          requestId={requestId}
        />

        {/* Route berechnen */}
        <RoutingMachine
          startPosition={userPosition}
          startPositionOverride={routeStartPosition}
          startLabel={routeStartLabel}
          targetPosition={targetPosition}
          shouldRoute={shouldRoute}
          setShouldRoute={setShouldRoute}
          setRouteInfo={setRouteInfo}
          setRouteError={setRouteError}
          setRouteLoading={setRouteLoading}
          targetPlaceName={placeName}
        />

        {/* Grüner Start-Marker (nur wenn Route berechnet) */}
        {routeInfo && (routeStartPosition || userPosition) && (
          <Marker position={routeStartPosition || userPosition} icon={startIcon}>
            <Popup>
              <strong>{routeStartPosition ? "Eigener Startort" : "Dein Standort"}</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.85em", color: "#64748b" }}>
                Startpunkt der Route
              </p>
            </Popup>
          </Marker>
        )}

        {/* Roter Ziel-Marker mit Wikipedia-Info */}
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

        {/* Klick-Handler */}
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