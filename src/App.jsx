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

  return (
    <Framework7App name="WebEng2 Map App" theme="auto">
      <View main>
        <Page className="app-page">
          <Navbar title="WebEng2 Map App" />

          <Block className="top-content">
            <OfflineBanner />

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
            />
          </div>
        </Page>
      </View>
    </Framework7App>
  );
}

export default App;