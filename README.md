# Terravents

**Earth's natural history, visualized.**

A cinematic, data-forward historical natural events explorer built as a static web app. Explore thousands of real natural disasters — wildfires, storms, volcanoes, earthquakes, floods, and more — plotted on an interactive 3D globe, sourced live from NASA's EONET API.

---

## Features

- **3D Interactive Globe** — WebGL-powered globe with atmosphere glow, auto-rotation, and smooth camera controls
- **Live NASA EONET Data** — Fetches up to 500 real natural events from the last 5 years (no API key required)
- **12 Event Categories** — Wildfires, Severe Storms, Volcanoes, Earthquakes, Floods, Sea/Lake Ice, Landslides, Drought, Dust & Haze, Snow, Water Color, Manmade — each color-coded
- **Timeline Scrubber** — Scrub through time to watch events unfold; animated playback at 1 month per step
- **Filter Controls** — Toggle categories on/off, filter to active-only events; filters + timeline work simultaneously
- **Event Drawer** — Click any marker to open a detail panel with:
  - NASA GIBS satellite imagery (true-color MODIS) centered on the event
  - Wikipedia article summary and thumbnail
  - Event dates and status
- **Category Legend** — Floating bottom-left legend for quick reference
- **Splash Screen** — Cinematic landing overlay that dismisses into the globe

---

## How to Run

No build step. No npm. Just open the file:

```
open index.html
```

Or serve it with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then navigate to `http://localhost:8080`.

> **Requires WebGL.** Works in Chrome, Firefox, Edge, and Safari with hardware acceleration enabled.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Globe | [Globe.gl](https://globe.gl/) via CDN |
| Styling | [Tailwind CSS](https://tailwindcss.com) via CDN |
| Events Data | [NASA EONET v3 API](https://eonet.gsfc.nasa.gov/) |
| Satellite Imagery | [NASA GIBS WMTS](https://earthdata.nasa.gov/esdis/eso/standards-and-references/nasas-global-imagery-browse-services-gibs) |
| Satellite Map | [Leaflet.js](https://leafletjs.com/) via CDN |
| Event Context | [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) |
| Language | Vanilla JS (ES modules) |

---

## File Structure

```
terravents/
├── index.html      # Shell, layout, CDN imports
├── globe.js        # Globe.gl init, marker rendering, camera controls
├── events.js       # EONET API fetching, data normalization
├── timeline.js     # Timeline scrubber UI and playback logic
├── filters.js      # Category/date/status filter UI and state
├── drawer.js       # Side drawer: NASA imagery + Wikipedia content
├── config.js       # Constants: category colors, API base URLs, defaults
├── style.css       # Custom CSS (Tailwind handles most styling)
└── PLANNING.md     # Architecture and API reference
```

---

## APIs Used

All APIs are free and require no authentication:

- **NASA EONET v3** — `https://eonet.gsfc.nasa.gov/api/v3/events`
- **NASA GIBS WMS** — `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi`
- **Wikipedia REST** — `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
