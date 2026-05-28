import React from "react";
import ReactDOM from "react-dom/client";

import Framework7 from "framework7/lite-bundle";
import Framework7React from "framework7-react";

import "framework7/css/bundle";
import "leaflet/dist/leaflet.css";
import "./index.css";

import App from "./App.jsx";

Framework7.use(Framework7React);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service Worker Registrierung fehlgeschlagen:", err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);