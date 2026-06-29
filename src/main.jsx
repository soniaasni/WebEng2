import React from "react";
import ReactDOM from "react-dom/client";

// Framework7: UI-Framework für Mobile/Desktop
import Framework7 from "framework7/lite-bundle";
import Framework7React from "framework7-react";

// Globale Styles für Framework7 und Leaflet (Karte)
import "framework7/css/bundle";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Hauptkomponente
import App from "./App.jsx";

// Framework7 mit React aktivieren
Framework7.use(Framework7React);

// Service Worker registrieren (offline Funktionalität)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // BASE_URL: '/' lokal, '/WebEng2/' auf GitHub Pages
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + "sw.js")
      .catch((err) => {
        console.error("Service Worker Registrierung fehlgeschlagen:", err);
      });
  });
}

// React rendern in #root Element
ReactDOM.createRoot(document.getElementById("root")).render(<App />);