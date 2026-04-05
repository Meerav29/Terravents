# Terravents — Planning Document

## Concept

Terravents is a cinematic, data-forward historical natural events explorer built as a static web app. Users land on a 3D globe, see Earth's natural events plotted as glowing markers, and can animate events unfolding over time or filter/browse by category, date range, and region. Clicking an event opens a side drawer with NASA satellite imagery of the location and a Wikipedia summary for context.

This is a portfolio piece — prioritize visual quality, clean code structure, and impressive UX over feature breadth.

-----

## Stack

|Layer            |Choice                                             |Reason                                            |
|-----------------|---------------------------------------------------|--------------------------------------------------|
|Globe            |[Globe.gl](https://globe.gl/) via CDN              |WebGL 3D globe, easy marker/arc API, no build step|
|Styling          |[Tailwind CSS](https://cdn.tailwindcss.com) via CDN|Consistent with Map Dash, utility-first           |
|Events data      |NASA EONET v3 API                                  |Free, no key, real natural event history          |
|Satellite imagery|NASA GIBS WMTS                                     |Free tile service, same system as NASA Worldview  |
|Event context    |Wikipedia REST API                                 |Free, no key, simple fetch                        |
|Language         |Vanilla JS (ES modules)                            |No build step, clean file separation              |

No npm. No build step. Open `index.html` and it works.

-----

## File Structure

```
terravents/
├── index.html          # Shell, layout, CDN imports
├── globe.js            # Globe.gl init, marker rendering, camera controls
├── events.js           # EONET API fetching, data normalization
├── timeline.js         # Timeline scrubber UI and playback logic
├── filters.js          # Category/date/status filter UI and state
├── drawer.js           # Side drawer: NASA imagery + Wikipedia content
├── config.js           # Constants: category colors, API base URLs, defaults
├── style.css           # Minimal custom CSS (Tailwind handles most styling)
├── PLANNING.md         # This file
└── TASKS.md            # Implementation phases for Claude Code
```

-----

## APIs

### NASA EONET v3

**Base URL:** `https://eonet.gsfc.nasa.gov/api/v3`

No API key required.

**Key endpoints:**

|Endpoint         |Use                        |
|-----------------|---------------------------|
|`/events`        |Fetch natural events (JSON)|
|`/events/geojson`|Same data in GeoJSON format|
|`/categories`    |List all event categories  |

**Key query parameters:**

|Param          |Example                    |Description                                         |
|---------------|---------------------------|----------------------------------------------------|
|`status`       |`open`, `closed`, `all`    |Default is `open`. Use `all` for historical explorer|
|`start` / `end`|`2020-01-01` / `2020-12-31`|Date range filter (YYYY-MM-DD)                      |
|`category`     |`wildfires`, `severeStorms`|Comma-separated, OR logic                           |
|`limit`        |`500`                      |Cap results                                         |
|`days`         |`30`                       |Prior N days from today                             |

**Example fetch for historical explorer:**

```
https://eonet.gsfc.nasa.gov/api/v3/events?status=all&start=2020-01-01&end=2020-12-31&limit=500
```

**Event object shape:**

```json
{
  "id": "EONET_5765",
  "title": "Bobcat Fire, California",
  "categories": [{ "id": "wildfires", "title": "Wildfires" }],
  "geometry": [
    {
      "date": "2020-09-06T00:00:00Z",
      "type": "Point",
      "coordinates": [-117.97, 34.2]
    }
  ],
  "closed": "2020-11-03T00:00:00Z"
}
```

Note: `geometry` is an array — events can have multiple positions over time (storm tracks etc). Use the first geometry point for initial marker placement.

**EONET Category IDs** (use these exactly in API calls):

- `wildfires`
- `severeStorms`
- `volcanoes`
- `seaLakeIce`
- `earthquakes`
- `floods`
- `landslides`
- `drought`
- `dustHaze`
- `manmade`
- `snow`
- `waterColor`

-----

### NASA GIBS (Satellite Imagery)

**Base WMTS URL:** `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/`

GIBS provides daily satellite imagery tiles. Used to show what the affected area looked like from space around the time of the event.

**Relevant layers:**

- `MODIS_Terra_CorrectedReflectance_TrueColor` — true color daily imagery
- `VIIRS_SNPP_CorrectedReflectance_TrueColor` — higher res true color

**Tile URL pattern:**

```
https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{layer}/default/{date}/250m/{z}/{y}/{x}.jpg
```

Where `{date}` is `YYYY-MM-DD` and matches the event date.

In the drawer, display GIBS imagery as a small embedded Leaflet map (lightweight, 2D) centered on the event coordinates, using the event date. This avoids complexity of embedding tiles directly in the 3D globe.

-----

### Wikipedia REST API

**Base URL:** `https://en.wikipedia.org/api/rest_v1`

No API key required.

**Search endpoint:**

```
GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}
```

**Strategy for matching events:**

1. Use the EONET event title (e.g. "Bobcat Fire, California") as the search term
1. Try Wikipedia search API first: `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json&origin=*`
1. Take the first result and fetch its summary
1. If no result or summary is too short (<100 chars), show a fallback message

**Summary object shape:**

```json
{
  "title": "Bobcat Fire",
  "extract": "The Bobcat Fire was a wildfire...",
  "thumbnail": { "source": "https://..." },
  "content_urls": { "desktop": { "page": "https://en.wikipedia.org/wiki/Bobcat_Fire" } }
}
```

-----

## Event Category Colors

Define these in `config.js`:

```js
export const CATEGORY_COLORS = {
  wildfires:     '#f97316', // orange
  severeStorms:  '#3b82f6', // blue
  volcanoes:     '#ef4444', // red
  earthquakes:   '#a855f7', // purple
  floods:        '#06b6d4', // cyan
  seaLakeIce:    '#e2e8f0', // white/light
  landslides:    '#92400e', // brown
  drought:       '#ca8a04', // yellow
  dustHaze:      '#d4b483', // tan
  snow:          '#f1f5f9', // light blue-white
  waterColor:    '#0ea5e9', // sky blue
  manmade:       '#6b7280', // gray
};
```

-----

## Globe Configuration

- **Background:** Black (`#000000`) — space aesthetic
- **Globe texture:** Use a minimal dark earth tile (ESRI dark basemap or similar)
- **Marker style:** Glowing dots, sized by category importance, colored per `CATEGORY_COLORS`
- **Camera:** Start slightly tilted, auto-rotate slowly on load, stop on user interaction
- **Atmosphere:** Enable Globe.gl's built-in atmosphere glow

-----

## UI Layout

```
+--------------------------------------------------+
|  TERRAVENTS                    [filter controls] |
+--------------------------------------------------+
|                                                  |
|              3D Globe (full screen)              |
|         (markers plotted on surface)             |
|                                                  |
+--------------------------------------------------+
|  [timeline scrubber]    [play] [year label]      |
+--------------------------------------------------+
```

Side drawer slides in from the right on marker click:

```
+----------------------+
| Event Title          |
| Category badge       |
| Date                 |
|                      |
| [Mini satellite map] |
|                      |
| Wikipedia summary    |
| [Read more →]        |
+----------------------+
```

-----

## Default State

- Date range: Last 5 years (dynamic: today minus 5 years → today)
- Status: `all` (open + closed)
- Categories: all selected
- Limit: 500 events
- Playback: paused

-----

## Constraints & Notes

- **CORS:** EONET and Wikipedia both support CORS — safe to fetch from browser
- **WebGL required:** Globe.gl needs WebGL. App should detect and show a friendly error if unavailable
- **No auth:** Zero API keys required for MVP. Everything is public
- **Performance:** 500 markers is fine for Globe.gl. If going higher, consider clustering
- **Mobile:** Not a priority for this portfolio piece — optimize for desktop
