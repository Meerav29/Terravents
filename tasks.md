# Terravents — Implementation Tasks

Work through these phases in order. Complete each phase fully before moving to the next. Each phase has a clear "done when" checklist — do not move on until all items are checked.

Read `PLANNING.md` fully before starting. It contains all API details, endpoints, data shapes, color config, and layout specs you need.

-----

## Phase 1 — Project Scaffold & Globe

**Goal:** Get a spinning 3D globe on screen with correct layout and styling.

### Tasks

- [ ] Create `index.html` with full page layout (header bar, globe container, timeline bar at bottom)
- [ ] Load Globe.gl, Tailwind CSS, and any other CDN deps in `index.html`
- [ ] Create `config.js` with `CATEGORY_COLORS`, API base URLs, and default date range constants
- [ ] Create `globe.js` — initialize Globe.gl in the `#globe` container
  - Black background, atmosphere glow enabled
  - Slow auto-rotation on load
  - Stop rotation on user mouse interaction, resume after 3s idle
  - WebGL detection: if unavailable, show a centered error message overlay
- [ ] Create empty placeholder files: `events.js`, `timeline.js`, `filters.js`, `drawer.js`, `style.css`
- [ ] Wire up `globe.js` import in `index.html`

### Done when

- [ ] Opening `index.html` in a browser shows a full-screen spinning dark globe
- [ ] Header bar visible at top with "TERRAVENTS" title
- [ ] Timeline bar visible at bottom (empty for now)
- [ ] No console errors

-----

## Phase 2 — EONET Data Fetching & Marker Rendering

**Goal:** Fetch real events from EONET and plot them as colored markers on the globe.

### Tasks

- [ ] Create `events.js` with a `fetchEvents(startDate, endDate, categories)` function
  - Constructs URL: `https://eonet.gsfc.nasa.gov/api/v3/events?status=all&start={}&end={}&limit=500`
  - Returns normalized array of event objects: `{ id, title, category, date, lat, lng, closed }`
  - Use the first geometry point for `lat`/`lng`
  - Skip events with no geometry
  - Log fetch errors gracefully, return empty array on failure
- [ ] On app load, fetch events for the default date range (last 5 years) from `config.js`
- [ ] In `globe.js`, add a `renderMarkers(events)` function
  - Use Globe.gl's `pointsData` layer
  - Color each point using `CATEGORY_COLORS` from `config.js` based on event category
  - Point radius: 0.4, altitude: 0.01
  - On hover: increase radius to 0.6, show tooltip with event title
  - On click: call `openDrawer(event)` (stubbed for now — just `console.log`)

### Done when

- [ ] Markers appear on globe at correct geographic positions
- [ ] Marker colors match categories (orange wildfires, blue storms, red volcanoes, etc.)
- [ ] Hovering a marker shows its title in a tooltip
- [ ] Clicking a marker logs the event object to console
- [ ] No console errors (network errors logged gracefully)

-----

## Phase 3 — Timeline Scrubber & Playback

**Goal:** Add a timeline at the bottom that filters visible markers by date and supports animated playback.

### Tasks

- [ ] Create `timeline.js` with the following:
  - A date range scrubber (single handle — the "current view date")
  - A play/pause button
  - A year/month label showing the current timeline position
  - Playback advances the scrubber automatically (1 month per 800ms)
  - Playback loops back to start when it reaches end date
- [ ] Timeline scrubber range = the full default date range from `config.js`
- [ ] As scrubber moves, call `globe.filterMarkersByDate(date)` which shows only events that started on or before `date` and were not yet closed before `date`
- [ ] Style the timeline bar: dark background, minimal — scrubber track, play button left, date label right

### Done when

- [ ] Scrubbing the timeline changes which markers are visible on the globe
- [ ] Pressing play animates the globe, markers appearing progressively as time advances
- [ ] Date label updates in real time as scrubber moves
- [ ] Pause stops playback at current position
- [ ] No performance issues with 500 markers filtering

-----

## Phase 4 — Filter Controls

**Goal:** Let users filter by event category and toggle open/closed events.

### Tasks

- [ ] Create `filters.js` with filter state: selected categories (default: all), status toggle
- [ ] Add filter UI to the header bar (right side):
  - Category toggle buttons — one per EONET category, colored dot + label
  - "Active only" toggle switch (shows only events with `closed: null`)
- [ ] When filters change, re-run `renderMarkers()` with filtered event set
- [ ] "Select all" / "Clear all" quick actions for categories
- [ ] Filters and timeline work together — apply both simultaneously

### Done when

- [ ] Toggling a category removes/restores those markers instantly
- [ ] "Active only" toggle hides closed events
- [ ] Filter state persists while scrubbing the timeline
- [ ] UI is clean and doesn't crowd the globe

-----

## Phase 5 — Event Drawer (NASA Imagery + Wikipedia)

**Goal:** Clicking a marker opens a side drawer with satellite imagery and Wikipedia context.

### Tasks

- [ ] Create `drawer.js` with `openDrawer(event)` and `closeDrawer()` functions
- [ ] Drawer slides in from the right (CSS transition), 380px wide, dark background
- [ ] Drawer content:
  - Event title (large)
  - Category badge (colored, matching marker color)
  - Date and closed date (if applicable)
  - "NASA Satellite View" section: embed a small Leaflet 2D map (400x220px) centered on event coordinates, using NASA GIBS true color tiles for the event date (see PLANNING.md for tile URL pattern)
  - "About this event" section: Wikipedia summary text + thumbnail if available + "Read more on Wikipedia →" link
  - Close button (top right)
- [ ] Wikipedia fetch logic (in `drawer.js`):
1. Search: `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={eventTitle}&format=json&origin=*`
1. Take first result, fetch: `https://en.wikipedia.org/api/rest_v1/page/summary/{pageTitle}`
1. Display `extract` text, `thumbnail.source` image if present
1. If no result or extract < 100 chars: show "No Wikipedia article found for this event."
- [ ] Clicking globe outside a marker closes the drawer
- [ ] Globe auto-rotation stops when drawer is open, resumes when closed
- [ ] Globe camera animates (fly-to) to center on clicked event coordinates

### Done when

- [ ] Clicking any marker opens the drawer smoothly
- [ ] NASA GIBS satellite map loads and shows correct location
- [ ] Wikipedia content loads for major events (wildfires, storms, etc.)
- [ ] Fallback message shown when no Wikipedia article exists
- [ ] Drawer closes cleanly, globe resumes normal behavior
- [ ] No console errors on drawer open/close

-----

## Phase 6 — Polish & Portfolio Finishing Touches

**Goal:** Make it look and feel impressive as a portfolio piece.

### Tasks

- [ ] Add a landing splash: on first load, show a brief overlay with the Terravents name, tagline ("Earth's natural history, visualized"), and a "Explore" button that dismisses it and starts auto-rotation
- [ ] Add a legend: small floating legend (bottom-left) showing category colors
- [ ] Add loading state: while EONET fetch is in progress, show a subtle spinner or "Loading events…" message over the globe
- [ ] Add event count: in the header, show "X events" updating as filters change
- [ ] Smooth marker transitions: when timeline scrubs, markers fade in rather than pop
- [ ] Responsive header: collapse filter buttons into a hamburger menu if viewport < 1024px
- [ ] `README.md`: write a clean project README with screenshots placeholder, feature list, and "how to run" (just open index.html)
- [ ] Final check: test in Chrome and Firefox, verify no console errors, verify GIBS tiles load, verify Wikipedia works for at least 5 different event types

### Done when

- [ ] Splash screen appears and dismisses cleanly
- [ ] Legend is visible and accurate
- [ ] Loading state shows during data fetch
- [ ] Event count reflects current filter state
- [ ] App feels polished — smooth transitions, no jank, no layout shifts
- [ ] README is written

-----

## Notes for Claude Code

- Always read `PLANNING.md` before starting a new phase — it has API details, data shapes, and config values you need
- Keep files single-responsibility — don't add globe logic to `events.js` etc.
- Use `async/await` for all API calls, with try/catch
- Tailwind for all layout/spacing/color. Only use `style.css` for things Tailwind can't do (like Globe.gl container sizing or CSS transitions)
- Do not add any npm packages or build steps — everything via CDN
- Globe.gl CDN: `https://unpkg.com/globe.gl`
- Leaflet CDN: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` + CSS
- Test each phase by verifying the "Done when" checklist before moving on
