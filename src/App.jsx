import { useState } from "react";
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

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation wird von diesem Browser nicht unterstützt.");
      return;
    setLocationError("");
    }

  const showLocationError = (message) => {
    setLocationError(message);

    setTimeout(() => {
      setLocationError("");
    }, 3000);
  };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setLocationError("");
        setUserPosition(newPosition);

        console.log("Standort gefunden:", newPosition);
      },
      (err) => {
        console.error("Standort konnte nicht geladen werden:", err);

        if (err.code === 1) {
          showLocationError(
            "Standortzugriff verweigert. Bitte aktiviere die Standortfreigabe."
          );
        } else if (err.code === 2) {
          setLocationError("Standort konnte nicht ermittelt werden.");
        } else if (err.code === 3) {
          setLocationError("Zeitüberschreitung beim Abrufen des Standorts.");
        } else {
          setLocationError("Standort konnte nicht geladen werden.");
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

                <Button fill onClick={handleSearch}>
                  Suchen
                </Button>
              </div>

              <Button
                fill
                className="location-button"
                onClick={handleLocateUser}
              >
                📍 Standort anzeigen
              </Button>
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
            />
          </div>
        </Page>
      </View>
    </Framework7App>
  );
}

export default App;