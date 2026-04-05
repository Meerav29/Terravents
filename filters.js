// Terravents — Category and status filter UI + state

import { CATEGORY_COLORS } from './config.js';
import { getAllEvents, setFilteredBase } from './globe.js';

// Human-readable labels for each EONET category ID
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

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

// --- Filter state ---
let selectedCategories = new Set(ALL_CATEGORIES);
let activeOnly = false;

// --- Core filter logic ---

function getFilteredEvents() {
  return getAllEvents().filter(event => {
    if (!selectedCategories.has(event.category)) return false;
    if (activeOnly && event.closed !== null) return false;
    return true;
  });
}

function applyFilters() {
  setFilteredBase(getFilteredEvents());
}

// --- UI helpers ---

function setCategoryButtonState(id) {
  const btn = document.getElementById(`cat-btn-${id}`);
  if (!btn) return;
  const active = selectedCategories.has(id);
  const dot = btn.querySelector('.cat-dot');
  if (dot) dot.style.opacity = active ? '1' : '0.25';
  btn.style.opacity = active ? '1' : '0.45';
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
}

function setAllCategoryButtonStates() {
  ALL_CATEGORIES.forEach(id => setCategoryButtonState(id));
}

function setActiveOnlyUI(on) {
  const btn  = document.getElementById('active-only-toggle');
  const knob = document.getElementById('active-only-knob');
  if (!btn || !knob) return;
  btn.setAttribute('aria-checked', on ? 'true' : 'false');
  if (on) {
    btn.style.backgroundColor = '#3b82f6';
    btn.style.borderColor = '#60a5fa';
    knob.style.transform = 'translateX(16px)';
    knob.style.backgroundColor = '#ffffff';
  } else {
    btn.style.backgroundColor = '';
    btn.style.borderColor = '';
    knob.style.transform = 'translateX(0)';
    knob.style.backgroundColor = 'rgba(255,255,255,0.35)';
  }
}

// --- Build and mount the filter UI ---

export function initFilters() {
  const container = document.getElementById('filter-controls');
  if (!container) return;

  container.innerHTML = `
    <div class="relative" id="filters-wrapper">
      <!-- Filters toggle button -->
      <button
        id="filters-toggle-btn"
        class="flex items-center gap-2 px-3 py-1.5 text-xs text-white/70 border border-white/20 rounded hover:border-white/50 hover:text-white transition-colors select-none"
        title="Show/hide filters"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        <span>Filters</span>
        <svg id="filters-chevron" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 flex-shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown panel -->
      <div
        id="filters-panel"
        class="hidden absolute right-0 top-full mt-2 bg-gray-950 border border-white/10 rounded-lg shadow-2xl z-50 p-4"
        style="width: 288px;"
      >
        <!-- Category header + quick actions -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-white/40 uppercase tracking-wider font-medium">Categories</span>
          <div class="flex items-center gap-1">
            <button
              id="select-all-btn"
              class="text-xs text-white/50 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
            >All</button>
            <span class="text-white/20 text-xs select-none">·</span>
            <button
              id="clear-all-btn"
              class="text-xs text-white/50 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
            >None</button>
          </div>
        </div>

        <!-- Category toggle grid -->
        <div class="grid grid-cols-2 gap-0.5 mb-3">
          ${ALL_CATEGORIES.map(id => `
            <button
              id="cat-btn-${id}"
              data-category="${id}"
              aria-pressed="true"
              class="cat-toggle flex items-center gap-2 px-2 py-1.5 rounded text-xs text-white/75 hover:bg-white/5 transition-colors text-left w-full"
            >
              <span
                class="cat-dot rounded-full flex-shrink-0"
                style="width:10px;height:10px;background-color:${CATEGORY_COLORS[id]};"
              ></span>
              <span class="truncate">${CATEGORY_LABELS[id]}</span>
            </button>
          `).join('')}
        </div>

        <!-- Active only toggle -->
        <div class="border-t border-white/10 pt-3 flex items-center justify-between">
          <label class="text-xs text-white/60 select-none cursor-pointer" for="active-only-toggle">
            Active events only
          </label>
          <button
            id="active-only-toggle"
            class="relative flex-shrink-0 rounded-full border transition-colors cursor-pointer"
            style="width:36px;height:20px;background-color:transparent;border-color:rgba(255,255,255,0.2);"
            role="switch"
            aria-checked="false"
            title="Show only ongoing (active) events"
          >
            <span
              id="active-only-knob"
              class="absolute rounded-full"
              style="width:12px;height:12px;top:3px;left:3px;background-color:rgba(255,255,255,0.35);transition:transform 0.2s ease,background-color 0.2s ease;"
            ></span>
          </button>
        </div>
      </div>
    </div>
  `;

  // --- Wire up interactions ---

  const toggleBtn = document.getElementById('filters-toggle-btn');
  const panel     = document.getElementById('filters-panel');
  const chevron   = document.getElementById('filters-chevron');

  // Open / close panel
  toggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !panel.classList.contains('hidden');
    if (isOpen) {
      panel.classList.add('hidden');
      chevron.style.transform = '';
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      panel.classList.remove('hidden');
      chevron.style.transform = 'rotate(180deg)';
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  });

  // Close when clicking outside the wrapper
  document.addEventListener('click', e => {
    const wrapper = document.getElementById('filters-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      panel.classList.add('hidden');
      chevron.style.transform = '';
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Category toggle buttons
  document.querySelectorAll('.cat-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.category;
      if (selectedCategories.has(id)) {
        selectedCategories.delete(id);
      } else {
        selectedCategories.add(id);
      }
      setCategoryButtonState(id);
      applyFilters();
    });
  });

  // Select all
  document.getElementById('select-all-btn').addEventListener('click', () => {
    ALL_CATEGORIES.forEach(id => selectedCategories.add(id));
    setAllCategoryButtonStates();
    applyFilters();
  });

  // Clear all
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    selectedCategories.clear();
    setAllCategoryButtonStates();
    applyFilters();
  });

  // Active-only toggle
  document.getElementById('active-only-toggle').addEventListener('click', () => {
    activeOnly = !activeOnly;
    setActiveOnlyUI(activeOnly);
    applyFilters();
  });
}

// Bootstrap
initFilters();
