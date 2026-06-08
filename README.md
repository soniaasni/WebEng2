# WebEng2
Eine Progressive Web App auf Basis von React, die den aktuellen Standort auf einer OpenStreetMap-Karte anzeigt, per Reverse Geocoding Ortsinformationen ermittelt, Wikipedia-Daten visualisiert und die Route zum ausgewählten Ziel darstellt.

Prüfungsaufgabe - Web-Engineering II
Epic:
„Entwickeln Sie eine Web-Applikation die innerhalb eines Location-Based-Service eine Karte darstellt. 
Innerhalb der Karte soll eine Position (oder aktueller Standort) mit ihren Geo-Koordinaten ausgewählt 
werden können. Über diese Koordinaten soll mittels Reverse-Geocoding*1 der Ort ermittelt und über 
Wikipedia*2 die entsprechenden Information zur Örtlichkeit ausgelesen und visualisiert werden" 
Anschließend soll die Fahrroute*5 von der gegenwärtigen Position zum ausgewählten Ort dargestellt 
werden.
▪Die Web-Applikation soll möglichst gemäß den Vorgaben einer PWA entsprechend (Progressive-Web-Appli
cation, mobile first, responsive,...) umgesetzt werden.
▪Die App soll über "React/JSX", sowie über ein User Experience (Mobility/UI) wie z.B. "Framework7, Ionic oder 
Material UI" und dessen Standardkomponenten umgesetzt werden. Die Karten sollen über OpenStreetMap*3 
ggf. Leaflet*4 eingebunden werden. 
▪Bilden Sie dazu kleine Sprint-Teams (ca. 4-7 Personen pro Sprint-Team) und zerlegen sie die Epic in die ent
sprechenden User-Stories und Sprints (Produkt-Backlog, Sprint-Backlog), so dass die Teams eine gleich
mäßige Auslastung haben.
▪Definieren Sie einen Scrum-Master (wenn nötig ggf. ein Team von 2 Personen) der das Produkt-Inkrement 
kontrolliert und dem Team beim Sprint-Inkrement beratend und unterstützend zur Seite steht, die (online)
Kommunikation untereinander aufrecht erhält, das Ziel ständig kontrolliert und den Product-Owner informiert.
▪Die fertige Lösung soll auf einem GitHub-Repository lauffähig veröffentlicht und auf CD/DVD dem Sekretariat 
übergeben werden. Der Scrum-Master ist für die vollständige Auslieferung der PWA zum Ende des Vorlesungs
quartals oder nach individueller zeitlicher Absprache mit dem Dozenten verantwortlich.

## Live-Demo

Die App ist auf GitHub Pages deployed und direkt aufrufbar:

**https://soniaasni.github.io/WebEng2/**

> Der GitHub Actions Workflow deployt automatisch bei jedem Push auf `develop`.

---

## PWA installieren

Die App kann als Progressive Web App auf dem Gerät installiert werden:

**Android (Chrome):**
1. App im Browser öffnen
2. Menü (⋮) → „App installieren" oder „Zum Startbildschirm hinzufügen"

**iOS (Safari):**
1. App im Safari öffnen
2. Teilen-Symbol → „Zum Home-Bildschirm"

**Desktop (Chrome/Edge):**
1. In der Adressleiste erscheint ein Installations-Symbol (⊕)
2. Darauf klicken → „Installieren"

---

## React MVP starten und testen

1. Projektverzeichnis öffnen:

```bash
cd "pwd\WebEng2"
```

2. Abhängigkeiten installieren (falls noch nicht geschehen):

```bash
npm install
```

3. Dev-Server starten:

```bash
npm start
```

4. Browser öffnen:

- Öffne `http://localhost:5173`
- Die React-App sollte mit einem Formular und einer Liste erscheinen.

5. Funktion testen:

- Füge ein neues Element ein und bestätige mit `Hinzufügen`.
- Entferne ein Element mit dem `Entfernen`-Button.

> Falls `npm start` nicht funktioniert, verwende alternativ `npm run dev`.

## App auf dem Handy testen (Standort)

Mobile Browser erlauben Geolocation nur über HTTPS. Der Dev-Server läuft daher über HTTPS — Handy und PC müssen im selben WLAN sein.

**Einmalige Vorbereitung (Windows-Firewall, als Administrator):**

```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173,5174,5175 -Action Allow -Profile Any
```

**Zugriff vom Handy:**

1. `npm start` ausführen — in der Konsolenausgabe erscheint die Network-URL, z. B.:
   ```
   ➜  Network: https://172.17.8.97:5173/
   ```
2. Die **WLAN-IP** (`ipconfig` → Drahtlos-LAN-Adapter WLAN) im Handy-Browser aufrufen
3. Zertifikatswarnung einmalig akzeptieren ("Trotzdem weiter" / "Advanced → Proceed")
4. Auf **"Standort anzeigen"** tippen → Standortberechtigung erlauben → Karte springt zum aktuellen Standort

