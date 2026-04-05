// Terravents — Globe initialization and marker rendering

import { CATEGORY_COLORS } from './config.js';

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
let globeInstance = null;
let allEvents = [];
let visibleEvents = [];
let autoRotateTimer = null;
let isUserInteracting = false;
let drawerOpen = false;

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
    // Dark globe texture
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
  allEvents = events;
  visibleEvents = events;
  _applyMarkers(visibleEvents);
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
    .onPointClick((point, _event, _coords) => {
      if (typeof window.__onMarkerClick === 'function') {
        window.__onMarkerClick(point);
      } else {
        console.log('Marker clicked:', point);
      }
    })
    .onPointHover((point) => {
      // Update hovered state for radius change
      events.forEach(e => { e._hovered = false; });
      if (point) point._hovered = true;
      globeInstance.pointRadius(d => d._hovered ? 0.6 : 0.4);
    });
}

// --- Filter markers by date (called by timeline.js) ---
export function filterMarkersByDate(date) {
  if (!globeInstance) return;
  const d = new Date(date);
  visibleEvents = allEvents.filter(e => {
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

// --- Set visible events directly (called by filters.js) ---
export function setVisibleEvents(events) {
  _applyMarkers(events);
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

// --- Bootstrap ---
initGlobe();
