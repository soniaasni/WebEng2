import { useState, lazy, Suspense } from "react";
import {
  App as Framework7App,
  View,
  Page,
  Navbar,
  Block,
  Searchbar,
  Button,
} from "framework7-react";

// Lazy Loading: Karte und Leaflet werden erst geladen, wenn sie gebraucht werden
// Das macht die App schneller beim Start
const Map = lazy(() => import("./components/Map"));
import OfflineBanner from "./components/OfflineBanner";

// Hilfsfunktion: Konvertiert Minuten in lesbares Format (z.B. "2h 30 Min.")
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m} Min.` : `${h}h`;
}

// Hilfsfunktion: Sucht Koordinaten für einen Ortsnamen mit OpenStreetMap
async function geocodePlace(text) {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(text)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "de" } });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
}

function App() {
  // Zustand für Zielsuche
  const [searchValue, setSearchValue] = useState("");      // Text in Suchfeld
  const [submittedSearch, setSubmittedSearch] = useState(""); // Gesuchter Ort
  const [searchError, setSearchError] = useState("");      // Fehlermeldung bei Suche

  // Zustand für Standort des Benutzers
  const [locationError, setLocationError] = useState("");   // Fehler beim GPS
  const [userPosition, setUserPosition] = useState(null);   // GPS-Koordinaten [lat, lon]

  // Zustand für Route
  const [shouldRoute, setShouldRoute] = useState(false);    // Route berechnen?
  const [routeInfo, setRouteInfo] = useState(null);         // Route: Distanz, Dauer, Start/Ziel
  const [routeError, setRouteError] = useState("");         // Fehler bei Routenberechnung
  const [targetPosition, setTargetPosition] = useState(null); // Ziel-Koordinaten
  const [routeLoading, setRouteLoading] = useState(false);  // Lädt Route gerade?

  // Zustand für benutzerdefinierten Startort
  const [startText, setStartText] = useState("");           // Text "Start auswählen"
  const [routeStartPosition, setRouteStartPosition] = useState(null); // Start-Koordinaten
  const [startError, setStartError] = useState("");         // Fehler beim Startort
  const [startLoading, setStartLoading] = useState(false);  // Geocoding lädt gerade?

  // Behandelt Zielsuche: validiert Input und speichert den Suchtext
  const handleSearch = (event) => {
    event?.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) {
      setSearchError("Bitte gib einen Ortsnamen ein.");
      return;
    }
    setSearchError("");
    setSubmittedSearch(trimmed); // Trigger für Karte
  };

  // Zeigt Fehlermeldung kurz an, dann ausblenden
  const showLocationError = (message) => {
    setLocationError(message);
    setTimeout(() => setLocationError(""), 4000);
  };

  // Holt den GPS-Standort des Benutzers
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      showLocationError("Geolocation wird von diesem Browser nicht unterstützt.");
      return;
    }
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(coords);
        setLocationError("");
      },
      (err) => {
        // Verschiedene Fehler abfangen
        if (err.code === 1) showLocationError("Standortzugriff verweigert. Bitte aktiviere die Standortfreigabe.");
        else if (err.code === 2) showLocationError("Standort konnte nicht ermittelt werden.");
        else if (err.code === 3) showLocationError("Zeitüberschreitung beim Abrufen des Standorts.");
        else showLocationError("Standort konnte nicht geladen werden.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Berechnet die Route: validiert, geocodiert Startort, sendet an Karte
  const handleRouteClick = async () => {
    setRouteError("");
    setRouteInfo(null);
    setStartError("");

    // Ziel muss auf der Karte ausgewählt sein
    if (!targetPosition) {
      setRouteError("Bitte zuerst ein Ziel auswählen.");
      return;
    }

    // Wenn Startort eingegeben: geocodieren
    if (startText.trim()) {
      setStartLoading(true);
      try {
        const result = await geocodePlace(startText.trim());
        setStartLoading(false);
        if (!result) {
          setStartError("Startort nicht gefunden. Bitte genauer eingeben.");
          return;
        }
        setRouteStartPosition([result.lat, result.lon]);
      } catch {
        setStartLoading(false);
        setStartError("Startort konnte nicht geladen werden.");
        return;
      }
    } else {
      // Kein Startort eingegeben: GPS verwenden
      setRouteStartPosition(null);
      if (!userPosition) {
        setRouteError("Bitte Standortfreigabe erlauben oder Startort eingeben.");
        return;
      }
    }

    // Starte Routenberechnung in der Karte
    setRouteLoading(true);
    setShouldRoute(true);
  };

  // Haupt-UI mit Framework7
  return (
    <Framework7App name="WebEng2 Map App" theme="md">
      <View main>
        <Page className="app-page">
          {/* Kopfzeile */}
          <Navbar title="WebEng2 Map App">
            <span slot="left" style={{ display: "flex", alignItems: "center", paddingLeft: "8px" }}>
              <img src="img/Icon.png" alt="App Icon" style={{ width: "28px", height: "28px", borderRadius: "6px" }} />
            </span>
          </Navbar>

          {/* Oberes Bedienfeld */}
          <Block className="top-content">
            <OfflineBanner />

            <div className="controls-card">
              {/* Feld zur Zielsuche */}
              <div className="search-area">
                <Searchbar
                  placeholder="Ziel suchen"
                  value={searchValue}
                  onInput={(e) => setSearchValue(e.target.value)}
                  onSubmit={handleSearch}
                  disableButtonText="Abbrechen"
                />
                <Button fill className="search-button" onClick={handleSearch}>
                  Suchen
                </Button>
              </div>

              {/* Fehler bei Zielsuche anzeigen */}
              {searchError && (
                <p className="field-error">{searchError}</p>
              )}

              {/* Feld für benutzerdefinierten Startort (optional) */}
              <div className="start-row">
                <input
                  className="start-input"
                  type="text"
                  placeholder="Start auswählen (leer = GPS-Standort)"
                  value={startText}
                  onChange={(e) => setStartText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRouteClick()}
                />
                {/* Löschen-Button (nur wenn Text vorhanden) */}
                {startText && (
                  <button className="start-clear" onClick={() => { setStartText(""); setRouteStartPosition(null); setStartError(""); }}>✕</button>
                )}
              </div>

              {/* Fehler bei Startort anzeigen */}
              {startError && <p className="field-error">{startError}</p>}

              {/* Aktionsbuttons */}
              <div className="action-row">
                <Button
                  fill
                  className="route-button"
                  onClick={handleRouteClick}
                  disabled={startLoading}
                >
                  {startLoading ? "Lade…" : "Route berechnen"}
                </Button>
                <Button
                  outline
                  className="location-button"
                  onClick={handleLocateUser}
                >
                  📍 Standort
                </Button>
              </div>

              {/* Fehler beim GPS anzeigen */}
              {locationError && (
                <p className="location-error">{locationError}</p>
              )}

              {/* Laden-Status */}
              {routeLoading && (
                <p className="route-info-loading">Route wird berechnet…</p>
              )}

              {/* Routeninformationen anzeigen */}
              {routeInfo && !routeLoading && (
                <div className="route-info">
                  <div className="route-info-header">
                    <span className="route-label">Route</span>
                    <span className="route-stats">
                      {routeInfo.distanceKm} km &nbsp;·&nbsp; {formatDuration(routeInfo.durationMin)}
                    </span>
                  </div>
                  <span className="route-places">
                    {routeInfo.from} → {routeInfo.to}
                  </span>
                </div>
              )}

              {/* Fehler bei Routenberechnung anzeigen */}
              {routeError && (
                <p className="route-error">{routeError}</p>
              )}
            </div>
          </Block>

          {/* Interaktive Karte (lazy loaded) */}
          <div className="map-fill">
            <Suspense fallback={<div className="map-loading">Karte wird geladen…</div>}>
              <Map
                searchPlace={submittedSearch}
                onSearchError={setSearchError}
                userPosition={userPosition}
                setUserPosition={setUserPosition}
                targetPosition={targetPosition}
                setTargetPosition={setTargetPosition}
                shouldRoute={shouldRoute}
                setShouldRoute={setShouldRoute}
                setRouteInfo={setRouteInfo}
                setRouteError={setRouteError}
                setRouteLoading={setRouteLoading}
                routeInfo={routeInfo}
                routeStartPosition={routeStartPosition}
                routeStartLabel={startText.trim() || null}
              />
            </Suspense>
          </div>
        </Page>
      </View>
    </Framework7App>
  );
}

export default App;