import { useState } from "react";
import {
  App as Framework7App,
  View,
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListItem,
  Button,
  Card,
  CardContent,
} from "framework7-react";

import Map from "./components/Map";
import OfflineBanner from "./components/OfflineBanner";

function App() {
  const [items, setItems] = useState(["Erstes Element", "Zweites Element"]);
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setItems((current) => [...current, trimmed]);
    setValue("");
  };

  const handleRemove = (index) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  return (
    <Framework7App name="WebEng2 Map App" theme="auto">
      <View main>
        <Page>
          <Navbar title="WebEng2 Map App" />

          <Block>
            <OfflineBanner />
          </Block>

          <BlockTitle>Karte</BlockTitle>

          <Card>
            <CardContent>
              <Map />

              <p style={{ marginTop: "12px" }}>
                <a
                  href="https://www.openstreetmap.org/fixthemap"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kartenfehler melden
                </a>
              </p>
            </CardContent>
          </Card>
        </Page>
      </View>
    </Framework7App>
  );
}

export default App;