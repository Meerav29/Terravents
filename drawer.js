// Terravents — Event detail drawer: NASA satellite imagery + Wikipedia context

import {
  CATEGORY_COLORS,
  GIBS_BASE_URL,
  GIBS_LAYER_TRUE_COLOR,
  WIKI_SEARCH_URL,
  WIKI_SUMMARY_URL,
} from './config.js';
import { pauseAutoRotate, resumeAutoRotate, flyTo } from './globe.js';

// Human-readable category labels
const CATEGORY_LABELS = {
  wildfires:    'Wildfires',
  severeStorms: 'Severe Storms',
  volcanoes:    'Volcanoes',
  seaLakeIce:   'Sea/Lake Ice',
  earthquakes:  'Earthquakes',
  floods:       'Floods',
  landslides:   'Landslides',
  drought:      'Drought',
  dustHaze:     'Dust & Haze',
  manmade:      'Manmade',
  snow:         'Snow',
  waterColor:   'Water Color',
};

let currentLeafletMap = null;
let currentEvent = null;

// --- DOM refs ---
const drawer        = document.getElementById('event-drawer');
const drawerContent = document.getElementById('drawer-content');

// --- Open drawer ---
export function openDrawer(event) {
  currentEvent = event;

  // Build the initial shell (wiki loads async)
  drawerContent.innerHTML = buildDrawerHTML(event);

  // Slide in
  drawer.classList.remove('drawer-closed');
  drawer.classList.add('drawer-open');

  // Pause globe rotation
  pauseAutoRotate();

  // Fly to event location
  flyTo(event.lat, event.lng);

  // Init Leaflet satellite map after DOM is painted
  requestAnimationFrame(() => {
    initSatelliteMap(event);
  });

  // Load Wikipedia asynchronously
  loadWikipedia(event.title);

  // Wire close button
  const closeBtn = document.getElementById('drawer-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
}

// --- Close drawer ---
export function closeDrawer() {
  drawer.classList.remove('drawer-open');
  drawer.classList.add('drawer-closed');
  resumeAutoRotate();

  // Destroy Leaflet map to free memory
  if (currentLeafletMap) {
    currentLeafletMap.remove();
    currentLeafletMap = null;
  }
  currentEvent = null;
}

// --- Build static HTML shell ---
function buildDrawerHTML(event) {
  const color    = CATEGORY_COLORS[event.category] || '#ffffff';
  const label    = CATEGORY_LABELS[event.category] || event.category;
  const dateStr  = event.date ? event.date.slice(0, 10) : 'Unknown date';
  const closedStr = event.closed ? event.closed.slice(0, 10) : null;

  return `
    <!-- Header -->
    <div class="flex items-start justify-between p-5 border-b border-white/10">
      <div class="flex-1 min-w-0 pr-3">
        <h2 class="text-base font-semibold text-white leading-snug mb-2">${escHtml(event.title)}</h2>
        <span
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
          style="background-color:${color}22; color:${color}; border: 1px solid ${color}55;"
        >
          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background-color:${color};"></span>
          ${escHtml(label)}
        </span>
      </div>
      <button
        id="drawer-close-btn"
        class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
        title="Close"
        aria-label="Close drawer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Dates -->
    <div class="px-5 py-3 border-b border-white/10 flex items-center gap-4 text-xs text-white/50">
      <span>
        <span class="text-white/30 mr-1">Started</span>
        <span class="text-white/70 font-mono">${dateStr}</span>
      </span>
      ${closedStr ? `
      <span>
        <span class="text-white/30 mr-1">Closed</span>
        <span class="text-white/70 font-mono">${closedStr}</span>
      </span>` : `
      <span class="text-green-400/70 font-medium">Active</span>`}
    </div>

    <!-- NASA Satellite View -->
    <div class="px-5 pt-4 pb-2">
      <p class="text-xs text-white/40 uppercase tracking-wider font-medium mb-2">NASA Satellite View</p>
      <div
        id="satellite-map"
        class="w-full rounded-lg overflow-hidden border border-white/10"
        style="height: 200px; background: #0a0a0a;"
      >
        <div class="flex items-center justify-center h-full text-xs text-white/30">Loading map…</div>
      </div>
      <p class="text-xs text-white/25 mt-1.5">MODIS Terra true-color imagery · ${dateStr}</p>
    </div>

    <!-- Wikipedia Section -->
    <div class="px-5 py-4">
      <p class="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">About This Event</p>
      <div id="wiki-content">
        <div class="flex items-center gap-2 text-xs text-white/30">
          <div class="loading-spinner"></div>
          <span>Searching Wikipedia…</span>
        </div>
      </div>
    </div>
  `;
}

// --- Leaflet satellite map ---
function initSatelliteMap(event) {
  const mapEl = document.getElementById('satellite-map');
  if (!mapEl || typeof L === 'undefined') return;

  // Clear placeholder text
  mapEl.innerHTML = '';

  // Destroy any previous instance
  if (currentLeafletMap) {
    currentLeafletMap.remove();
    currentLeafletMap = null;
  }

  const map = L.map(mapEl, {
    center: [event.lat, event.lng],
    zoom: 7,
    zoomControl: true,
    attributionControl: false,
    scrollWheelZoom: false,
  });
  currentLeafletMap = map;

  // Event date for GIBS tile
  const dateStr = event.date ? event.date.slice(0, 10) : new Date().toISOString().slice(0, 10);

  // NASA GIBS WMTS tile layer (EPSG:4326 — use L.TileLayer with custom options)
  // GIBS uses TMS-style tiles in geographic projection; Leaflet needs a projection shim.
  // We use a WMS fallback for simplicity (GIBS supports WMS too).
  const gibsWmsUrl = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
  L.tileLayer.wms(gibsWmsUrl, {
    layers: GIBS_LAYER_TRUE_COLOR,
    format: 'image/jpeg',
    transparent: false,
    version: '1.1.1',
    time: dateStr,
    tileSize: 512,
    crs: L.CRS.EPSG4326,
  }).addTo(map);

  // Marker for the event position
  const markerColor = CATEGORY_COLORS[event.category] || '#ffffff';
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width: 12px; height: 12px;
      border-radius: 50%;
      background: ${markerColor};
      border: 2px solid #fff;
      box-shadow: 0 0 6px ${markerColor};
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  L.marker([event.lat, event.lng], { icon }).addTo(map);

  // Trigger resize after drawer animation settles
  setTimeout(() => map.invalidateSize(), 350);
}

// --- Wikipedia fetch ---
async function loadWikipedia(title) {
  const wikiEl = document.getElementById('wiki-content');
  if (!wikiEl) return;

  try {
    // Step 1: search for the article
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: title,
      format: 'json',
      origin: '*',
      srlimit: '1',
    });
    const searchRes = await fetch(`${WIKI_SEARCH_URL}?${searchParams}`);
    if (!searchRes.ok) throw new Error('Wikipedia search failed');
    const searchData = await searchRes.json();

    const results = searchData?.query?.search;
    if (!results || results.length === 0) {
      showWikiFallback(wikiEl);
      return;
    }

    // Step 2: fetch summary for first result
    const pageTitle = encodeURIComponent(results[0].title);
    const summaryRes = await fetch(`${WIKI_SUMMARY_URL}/${pageTitle}`);
    if (!summaryRes.ok) throw new Error('Wikipedia summary fetch failed');
    const summary = await summaryRes.json();

    const extract = summary.extract || '';
    if (extract.length < 100) {
      showWikiFallback(wikiEl);
      return;
    }

    // Step 3: render
    const thumb     = summary.thumbnail?.source || null;
    const wikiUrl   = summary.content_urls?.desktop?.page || null;
    const wikiTitle = summary.title || results[0].title;

    wikiEl.innerHTML = `
      ${thumb ? `<img src="${escHtml(thumb)}" alt="${escHtml(wikiTitle)}" class="w-full rounded-lg mb-3 object-cover" style="max-height: 140px;" />` : ''}
      <h3 class="text-sm font-semibold text-white mb-1.5">${escHtml(wikiTitle)}</h3>
      <p class="text-xs text-white/60 leading-relaxed mb-3">${escHtml(extract.slice(0, 500))}${extract.length > 500 ? '…' : ''}</p>
      ${wikiUrl ? `
      <a
        href="${escHtml(wikiUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        Read more on Wikipedia
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>` : ''}
    `;
  } catch (err) {
    console.warn('Wikipedia fetch error:', err);
    showWikiFallback(wikiEl);
  }
}

function showWikiFallback(el) {
  el.innerHTML = `<p class="text-xs text-white/35 italic">No Wikipedia article found for this event.</p>`;
}

// --- Utility: escape HTML special chars ---
function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Close on outside click ---
document.addEventListener('click', (e) => {
  if (!currentEvent) return;
  // If click is inside the drawer, ignore
  if (drawer.contains(e.target)) return;
  // If click is on the globe canvas, close
  const globeEl = document.getElementById('globe');
  if (globeEl && globeEl.contains(e.target)) {
    closeDrawer();
  }
});
