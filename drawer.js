// Terravents — Event detail drawer with NASA imagery and Wikipedia

import { CATEGORY_COLORS, GIBS_BASE_URL, GIBS_LAYER_TRUE_COLOR, WIKI_SEARCH_URL, WIKI_SUMMARY_URL } from './config.js';
import { pauseAutoRotate, resumeAutoRotate, flyTo } from './globe.js';

// --- State ---
let leafletMap = null;
let currentEvent = null;

// --- DOM refs ---
const drawer = document.getElementById('event-drawer');
const drawerContent = document.getElementById('drawer-content');

// --- Category labels ---
const CATEGORY_LABELS = {
  wildfires:    'Wildfires',
  severeStorms: 'Severe Storms',
  volcanoes:    'Volcanoes',
  seaLakeIce:   'Sea / Lake Ice',
  earthquakes:  'Earthquakes',
  floods:       'Floods',
  landslides:   'Landslides',
  drought:      'Drought',
  dustHaze:     'Dust & Haze',
  manmade:      'Manmade',
  snow:         'Snow',
  waterColor:   'Water Color',
};

// --- Open drawer ---
export function openDrawer(event) {
  currentEvent = event;
  flyTo(event.lat, event.lng);
  pauseAutoRotate();
  renderDrawerShell(event);

  drawer.classList.remove('drawer-closed');
  drawer.classList.add('drawer-open');

  // Init Leaflet after the CSS transition finishes (300ms + buffer)
  setTimeout(() => initLeafletMap(event), 360);

  loadWikipedia(event);
}

// --- Close drawer ---
export function closeDrawer() {
  if (!currentEvent) return;
  currentEvent = null;

  drawer.classList.remove('drawer-open');
  drawer.classList.add('drawer-closed');

  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  resumeAutoRotate();
}

// --- Render the static shell (title, badge, dates, section placeholders) ---
function renderDrawerShell(event) {
  const color    = CATEGORY_COLORS[event.category] || '#ffffff';
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const dateStr  = event.date  ? event.date.slice(0, 10)   : 'Unknown';
  const closedStr = event.closed ? event.closed.slice(0, 10) : null;

  drawerContent.innerHTML = `
    <div class="p-5 flex flex-col gap-5">

      <!-- Title + close button -->
      <div class="flex items-start gap-3">
        <h2 class="flex-1 text-white font-bold text-lg leading-snug">${escapeHtml(event.title)}</h2>
        <button id="drawer-close-btn"
          class="flex-shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close drawer">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Category badge + dates -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
          style="background:${color}22;border:1px solid ${color}55;color:${color};">
          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:${color};"></span>
          ${escapeHtml(catLabel)}
        </span>
        <span class="text-xs text-white/50 font-mono">${escapeHtml(dateStr)}</span>
        ${closedStr
          ? `<span class="text-xs text-white/30 font-mono">→ ${escapeHtml(closedStr)}</span>`
          : `<span class="text-xs font-semibold" style="color:#4ade80;">● Active</span>`
        }
      </div>

      <!-- NASA Satellite View -->
      <div>
        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">NASA Satellite View</p>
        <div id="gibs-map"
          style="height:220px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:#0a0a0a;"></div>
        <p class="text-xs text-white/25 mt-1.5">MODIS Terra True Color · ${escapeHtml(dateStr)}</p>
      </div>

      <!-- Wikipedia / About -->
      <div>
        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">About this event</p>
        <div id="wiki-content" class="text-sm text-white/60 leading-relaxed">
          <span class="inline-flex items-center gap-2 text-white/30">
            <span class="loading-spinner flex-shrink-0"></span>
            <span>Loading Wikipedia…</span>
          </span>
        </div>
      </div>

    </div>
  `;

  document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
}

// --- Leaflet map with NASA GIBS MODIS tiles ---
function initLeafletMap(event) {
  const el = document.getElementById('gibs-map');
  if (!el || typeof L === 'undefined') return;

  // Clean up any previous instance
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }

  const eventDate = (event.date || new Date().toISOString()).slice(0, 10);

  leafletMap = L.map(el, {
    center: [event.lat, event.lng],
    zoom: 6,
    zoomControl: false,
    attributionControl: false,
  });

  // Dark basemap (EPSG:3857 — Leaflet default)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(leafletMap);

  // NASA GIBS MODIS Terra True Color (EPSG:3857 / GoogleMapsCompatible)
  // Tile URL: .../epsg3857/best/{layer}/default/{date}/GoogleMapsCompatible/{z}/{y}/{x}.jpg
  const gibsUrl = `${GIBS_BASE_URL.replace('epsg4326', 'epsg3857')}` +
    `/${GIBS_LAYER_TRUE_COLOR}/default/${eventDate}/GoogleMapsCompatible/{z}/{y}/{x}.jpg`;

  L.tileLayer(gibsUrl, {
    tileSize: 256,
    maxZoom: 9,
    opacity: 0.9,
    errorTileUrl: '', // silently skip missing tiles
  }).addTo(leafletMap);

  // Marker for the event location
  L.circleMarker([event.lat, event.lng], {
    radius: 7,
    color: '#ffffff',
    weight: 2,
    fillColor: CATEGORY_COLORS[event.category] || '#ffffff',
    fillOpacity: 0.9,
  }).addTo(leafletMap);

  leafletMap.invalidateSize();
}

// --- Wikipedia fetch and render ---
async function loadWikipedia(event) {
  const capturedId = event.id;

  const getEl = () => {
    // Only update DOM if this event is still the open one
    if (!currentEvent || currentEvent.id !== capturedId) return null;
    return document.getElementById('wiki-content');
  };

  try {
    // Step 1: Search
    const searchParams = new URLSearchParams({
      action:   'query',
      list:     'search',
      srsearch: event.title,
      srlimit:  '1',
      format:   'json',
      origin:   '*',
    });

    const searchRes = await fetch(`${WIKI_SEARCH_URL}?${searchParams}`);
    if (!searchRes.ok) throw new Error(`Search HTTP ${searchRes.status}`);
    const searchData = await searchRes.json();

    const hits = searchData?.query?.search;
    if (!hits?.length) { const el = getEl(); if (el) showWikiFallback(el); return; }

    // Step 2: Fetch summary for top result
    const pageTitle = hits[0].title;
    const sumRes = await fetch(`${WIKI_SUMMARY_URL}/${encodeURIComponent(pageTitle)}`);
    if (!sumRes.ok) throw new Error(`Summary HTTP ${sumRes.status}`);
    const sum = await sumRes.json();

    if (!sum.extract || sum.extract.length < 100) {
      const el = getEl(); if (el) showWikiFallback(el); return;
    }

    // Step 3: Render
    const el = getEl();
    if (!el) return; // drawer was closed while fetching

    const thumbHtml = sum.thumbnail?.source
      ? `<img src="${escapeAttr(sum.thumbnail.source)}" alt=""
           class="w-full rounded-md mb-3" style="max-height:160px;object-fit:cover;" />`
      : '';

    const wikiUrl  = sum.content_urls?.desktop?.page || '';
    const readMore = wikiUrl
      ? `<a href="${escapeAttr(wikiUrl)}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1">
           Read more on Wikipedia →
         </a>`
      : '';

    el.innerHTML = `${thumbHtml}<p class="mb-2">${escapeHtml(sum.extract)}</p>${readMore}`;

  } catch (err) {
    console.error('Wikipedia fetch error:', err);
    const el = getEl();
    if (el) showWikiFallback(el);
  }
}

function showWikiFallback(el) {
  el.innerHTML = '<p class="text-white/30 italic">No Wikipedia article found for this event.</p>';
}

// --- HTML escaping utils ---
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// --- Wire up globe callbacks (set before any click can occur) ---

// Marker click → open drawer
window.__onMarkerClick = openDrawer;

// Globe background click → close drawer (set in globe.js via __onGlobeClick)
window.__onGlobeClick = closeDrawer;
