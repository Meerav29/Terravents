// Terravents — Globe initialization and marker rendering

import { CATEGORY_COLORS, DEFAULT_START_DATE, DEFAULT_END_DATE } from './config.js';
import { fetchEvents } from './events.js';
import { openDrawer } from './drawer.js';

// --- WebGL detection ---
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// --- State ---
let globeInstance   = null;
let allEvents       = [];      // Full event list from EONET (never mutated after load)
let filteredBase    = [];      // Subset after category/status filter (set by filters.js)
let visibleEvents   = [];      // Subset after date filter (what is actually rendered)
let currentDateIso  = null;    // Last date passed to filterMarkersByDate
let autoRotateTimer = null;
let isUserInteracting = false;
let drawerOpen      = false;

// --- Init ---
export function initGlobe() {
  if (!hasWebGL()) {
    document.getElementById('webgl-error').classList.remove('hidden');
    return null;
  }

  const container = document.getElementById('globe');

  globeInstance = Globe()(container)
    .backgroundColor('#000000')
    .showAtmosphere(true)
    .atmosphereColor('rgba(100, 160, 255, 0.3)')
    .atmosphereAltitude(0.15)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
    .width(container.clientWidth)
    .height(container.clientHeight);

  // Auto-rotation
  globeInstance.controls().autoRotate = true;
  globeInstance.controls().autoRotateSpeed = 0.4;

  // Stop rotation on user interaction, resume after 3s idle
  const controls = globeInstance.controls();

  container.addEventListener('pointerdown', () => {
    isUserInteracting = true;
    controls.autoRotate = false;
    if (autoRotateTimer) {
      clearTimeout(autoRotateTimer);
      autoRotateTimer = null;
    }
  });

  container.addEventListener('pointerup', () => {
    isUserInteracting = false;
    scheduleAutoRotateResume();
  });

  container.addEventListener('wheel', () => {
    controls.autoRotate = false;
    if (autoRotateTimer) clearTimeout(autoRotateTimer);
    scheduleAutoRotateResume();
  });

  // Resize handling
  window.addEventListener('resize', () => {
    globeInstance
      .width(container.clientWidth)
      .height(container.clientHeight);
  });

  return globeInstance;
}

function scheduleAutoRotateResume() {
  if (autoRotateTimer) clearTimeout(autoRotateTimer);
  autoRotateTimer = setTimeout(() => {
    if (!isUserInteracting && !drawerOpen) {
      globeInstance.controls().autoRotate = true;
    }
  }, 3000);
}

// --- Marker rendering ---
export function renderMarkers(events) {
  allEvents    = events;
  filteredBase = events; // reset category filter base to full set
  if (currentDateIso) {
    filterMarkersByDate(currentDateIso);
  } else {
    visibleEvents = events;
    _applyMarkers(visibleEvents);
  }
}

function _applyMarkers(events) {
  if (!globeInstance) return;

  globeInstance
    .pointsData(events)
    .pointLat(d => d.lat)
    .pointLng(d => d.lng)
    .pointColor(d => CATEGORY_COLORS[d.category] || '#ffffff')
    .pointRadius(d => d._hovered ? 0.6 : 0.4)
    .pointAltitude(0.01)
    .pointLabel(d => `
      <div style="
        background: rgba(0,0,0,0.8);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        padding: 6px 10px;
        font-family: sans-serif;
        font-size: 13px;
        color: #fff;
        max-width: 220px;
        line-height: 1.4;
      ">
        <strong>${d.title}</strong><br/>
        <span style="color: ${CATEGORY_COLORS[d.category] || '#aaa'}; font-size: 11px;">
          ${d.category}
        </span>
        <span style="color: #aaa; font-size: 11px; margin-left: 8px;">${d.date ? d.date.slice(0, 10) : ''}</span>
      </div>
    `)
    .onPointClick((point) => {
      openDrawer(point);
    })
    .onPointHover((point) => {
      events.forEach(e => { e._hovered = false; });
      if (point) point._hovered = true;
      globeInstance.pointRadius(d => d._hovered ? 0.6 : 0.4);
    });

  // Update the event count in the header
  updateEventCount(events.length);
}

// --- Filter markers by date (called by timeline.js) ---
export function filterMarkersByDate(date) {
  if (!globeInstance) return;
  currentDateIso = typeof date === 'string' ? date : date.toISOString();
  const d = new Date(currentDateIso);
  visibleEvents = filteredBase.filter(e => {
    const start = new Date(e.date);
    if (start > d) return false;
    if (e.closed) {
      const closed = new Date(e.closed);
      if (closed < d) return false;
    }
    return true;
  });
  _applyMarkers(visibleEvents);
}

// --- Update category/status-filtered base (called by filters.js) ---
export function setFilteredBase(events) {
  filteredBase = events;
  if (currentDateIso) {
    filterMarkersByDate(currentDateIso);
  } else {
    visibleEvents = filteredBase;
    _applyMarkers(visibleEvents);
  }
}

// --- Expose full event list so filters.js can compute its subset ---
export function getAllEvents() {
  return allEvents;
}

// --- Fly-to a coordinate ---
export function flyTo(lat, lng) {
  if (!globeInstance) return;
  globeInstance.pointOfView({ lat, lng, altitude: 1.5 }, 1200);
}

// --- Rotation control for drawer ---
export function pauseAutoRotate() {
  drawerOpen = true;
  if (globeInstance) globeInstance.controls().autoRotate = false;
  if (autoRotateTimer) { clearTimeout(autoRotateTimer); autoRotateTimer = null; }
}

export function resumeAutoRotate() {
  drawerOpen = false;
  scheduleAutoRotateResume();
}

// --- Event count badge ---
function updateEventCount(count) {
  const el = document.getElementById('event-count');
  if (el) el.textContent = `${count.toLocaleString()} event${count !== 1 ? 's' : ''}`;
}

// --- Category legend ---
function buildLegend() {
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

  const container = document.getElementById('legend-items');
  if (!container) return;

  container.innerHTML = Object.entries(CATEGORY_COLORS)
    .map(([id, color]) => `
      <div class="flex items-center gap-1.5">
        <span class="flex-shrink-0 rounded-full" style="width:8px;height:8px;background-color:${color};"></span>
        <span class="text-xs text-white/50 whitespace-nowrap">${CATEGORY_LABELS[id] || id}</span>
      </div>
    `)
    .join('');
}

// --- Splash screen dismiss ---
function initSplash() {
  const overlay    = document.getElementById('splash-overlay');
  const exploreBtn = document.getElementById('splash-explore-btn');
  if (!overlay || !exploreBtn) return;

  exploreBtn.addEventListener('click', () => {
    overlay.classList.add('dismissed');
    // Start globe auto-rotation once splash is dismissed
    if (globeInstance) {
      globeInstance.controls().autoRotate = true;
    }
  });
}

// --- Bootstrap ---
(async () => {
  const globe = initGlobe();
  if (!globe) return;

  // Pause auto-rotation while splash is showing
  if (globeInstance) {
    globeInstance.controls().autoRotate = false;
  }

  // Init splash dismiss
  initSplash();

  // Build the category legend
  buildLegend();

  // Show loading overlay while fetching
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');

  const events = await fetchEvents(DEFAULT_START_DATE, DEFAULT_END_DATE);

  // Brief fade-in effect: temporarily dim globe canvas while markers load
  const globeEl = document.getElementById('globe');
  if (globeEl) globeEl.classList.add('markers-hidden');
  renderMarkers(events);
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (globeEl) globeEl.classList.remove('markers-hidden');
    }, 100);
  });

  if (loadingOverlay) loadingOverlay.classList.add('hidden');
})();
