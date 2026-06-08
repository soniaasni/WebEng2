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

// Lazy Load: Leaflet + LRM (~818 KB) laden erst nach dem ersten Render
const Map = lazy(() => import("./components/Map"));
import OfflineBanner from "./components/OfflineBanner";

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m} Min.` : `${h}h`;
}

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
  const [searchValue, setSearchValue] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [userPosition, setUserPosition] = useState(null);
  const [shouldRoute, setShouldRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [targetPosition, setTargetPosition] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Eigener Startort
  const [startText, setStartText] = useState("");
  const [routeStartPosition, setRouteStartPosition] = useState(null);
  const [startError, setStartError] = useState("");
  const [startLoading, setStartLoading] = useState(false);

  const handleSearch = (event) => {
    event?.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) {
      setSearchError("Bitte gib einen Ortsnamen ein.");
      return;
    }
    setSearchError("");
    setSubmittedSearch(trimmed);
  };

  const showLocationError = (message) => {
    setLocationError(message);
    setTimeout(() => setLocationError(""), 4000);
  };

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
        if (err.code === 1) showLocationError("Standortzugriff verweigert. Bitte aktiviere die Standortfreigabe.");
        else if (err.code === 2) showLocationError("Standort konnte nicht ermittelt werden.");
        else if (err.code === 3) showLocationError("Zeitüberschreitung beim Abrufen des Standorts.");
        else showLocationError("Standort konnte nicht geladen werden.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleRouteClick = async () => {
    setRouteError("");
    setRouteInfo(null);
    setStartError("");

    if (!targetPosition) {
      setRouteError("Bitte zuerst ein Ziel auswählen.");
      return;
    }

    if (startText.trim()) {
      // Eigener Startort geocodieren
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
      setRouteStartPosition(null);
      if (!userPosition) {
        setRouteError("Bitte Standortfreigabe erlauben oder Startort eingeben.");
        return;
      }
    }

    setRouteLoading(true);
    setShouldRoute(true);
  };

  return (
    <Framework7App name="WebEng2 Map App" theme="md">
      <View main>
        <Page className="app-page">
          <Navbar title="WebEng2 Map App">
            <span slot="left" style={{ display: "flex", alignItems: "center", paddingLeft: "8px" }}>
              <img src="img/Icon.png" alt="App Icon" style={{ width: "28px", height: "28px", borderRadius: "6px" }} />
            </span>
          </Navbar>

          <Block className="top-content">
            <OfflineBanner />

            <div className="controls-card">
              {/* Ziel-Suche */}
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

              {searchError && (
                <p className="field-error">{searchError}</p>
              )}

              {/* Eigener Startort */}
              <div className="start-row">
                <input
                  className="start-input"
                  type="text"
                  placeholder="Start auswählen (leer = GPS-Standort)"
                  value={startText}
                  onChange={(e) => setStartText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRouteClick()}
                />
                {startText && (
                  <button className="start-clear" onClick={() => { setStartText(""); setRouteStartPosition(null); setStartError(""); }}>✕</button>
                )}
              </div>

              {startError && <p className="field-error">{startError}</p>}

              {/* Aktions-Buttons */}
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

              {locationError && (
                <p className="location-error">{locationError}</p>
              )}

              {routeLoading && (
                <p className="route-info-loading">Route wird berechnet…</p>
              )}

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

              {routeError && (
                <p className="route-error">{routeError}</p>
              )}
            </div>
          </Block>

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
