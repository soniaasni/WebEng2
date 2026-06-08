import { useEffect, useState } from "react";
import {
  App as Framework7App,
  View,
  Page,
  Navbar,
  Block,
  Searchbar,
  Button,
} from "framework7-react";

import Map from "./components/Map";
import OfflineBanner from "./components/OfflineBanner";

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

      console.log("Standort über Button aktualisiert:", coords);
    },
    (err) => {
      console.error("Standort konnte nicht geladen werden:", err);

      if (err.code === 1) {
        showLocationError(
          "Standortzugriff verweigert. Bitte aktiviere die Standortfreigabe."
        );
      } else if (err.code === 2) {
        showLocationError("Standort konnte nicht ermittelt werden.");
      } else if (err.code === 3) {
        showLocationError("Zeitüberschreitung beim Abrufen des Standorts.");
      } else {
        showLocationError("Standort konnte nicht geladen werden.");
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
};

  return (
    <Framework7App name="WebEng2 Map App" theme="auto">
      <View main>
        <Page className="app-page">
          <Navbar title="WebEng2 Map App" />

          <Block className="top-content">
            <OfflineBanner />

            <div className="search-location-row">
              <div className="search-area">
                <Searchbar
                  placeholder="Ort suchen"
                  value={searchValue}
                  onInput={(event) => setSearchValue(event.target.value)}
                  onSubmit={handleSearch}
                  disableButtonText="Abbrechen"
                />

                <Button fill  className="search-button" onClick={handleSearch}>
                  Suchen
                </Button>
              </div>

              <div className="action-row">
                <Button
                  fill
                  small
                  className="route-button"
                  onClick={() => {
                    setRouteError("");
                    setRouteInfo(null);

                    if (!userPosition) {
                      setRouteError("Bitte Standortfreigabe erlauben.");
                      setRouteLoading(false);
                      return;
                    }

                    if (!targetPosition) {
                      setRouteError("Bitte zuerst ein Ziel auswählen.");
                      setRouteLoading(false);
                      return;
                    }

                    setRouteLoading(true);
                    setShouldRoute(true);
                  }}
                >
                  Route berechnen
                </Button>

                <Button
                  fill
                  className="location-button"
                  onClick={handleLocateUser}
                >
                  📍 Standort anzeigen
                </Button>
              </div>
              
              {routeLoading && (
                <p className="route-info">
                  Route wird berechnet…
                </p>
              )}

              {routeInfo && !routeLoading && (
                <div className="route-info">
                  <strong>Route</strong>
                  <span className="route-places">{routeInfo.from} → {routeInfo.to}</span>
                  <span className="route-stats">{routeInfo.distanceKm} km &nbsp;·&nbsp; {routeInfo.durationMin} Min.</span>
                </div>
              )}

              {routeError && (
                <p className="route-error">
                  {routeError}
                </p>
              )}
            </div>

            {locationError && (
              <p className="location-error">
                {locationError}
              </p>
            )}

            {searchError && (
              <p style={{ color: "#ef4444", marginTop: "8px" }}>
                {searchError}
              </p>
            )}
          </Block>

          <div className="map-fill">
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
            />
          </div>
        </Page>
      </View>
    </Framework7App>
  );
}

export default App;