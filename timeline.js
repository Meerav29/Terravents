// Terravents — Timeline scrubber and playback

import { DEFAULT_START_DATE, DEFAULT_END_DATE } from './config.js';
import { filterMarkersByDate } from './globe.js';

// --- State ---
const startDate = new Date(DEFAULT_START_DATE);
const endDate   = new Date(DEFAULT_END_DATE);
const totalMs   = endDate - startDate;

let isPlaying    = false;
let playInterval = null;

// --- DOM refs ---
const scrubber   = document.getElementById('timeline-scrubber');
const label      = document.getElementById('timeline-label');
const playBtn    = document.getElementById('play-btn');
const playIcon   = document.getElementById('play-icon');
const pauseIcon  = document.getElementById('pause-icon');

// --- Helpers ---

/** Map a [0-100] scrubber value to a Date */
function scrubberToDate(value) {
  return new Date(startDate.getTime() + (value / 100) * totalMs);
}

/** Map a Date to a [0-100] scrubber value */
function dateToScrubber(date) {
  return ((date - startDate) / totalMs) * 100;
}

/** Format a Date as "Mon YYYY" for the label */
function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Apply the current scrubber position to the globe and label */
function applyPosition(value) {
  const date = scrubberToDate(value);
  label.textContent = formatDate(date);
  filterMarkersByDate(date.toISOString());
}

// --- Playback ---

function advancePlayhead() {
  let current = parseFloat(scrubber.value);
  // Advance ~1 month as a fraction of total range
  const oneMonthFraction = (30.44 * 24 * 60 * 60 * 1000) / totalMs * 100;
  current += oneMonthFraction;
  if (current > 100) {
    current = 0; // loop back to start
  }
  scrubber.value = current;
  applyPosition(current);
}

function startPlayback() {
  if (playInterval) return;
  playInterval = setInterval(advancePlayhead, 800);
  isPlaying = true;
  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');
}

function stopPlayback() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
  isPlaying = false;
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
}

// --- Init ---

export function initTimeline() {
  // Set scrubber to end (most recent) by default
  scrubber.value = 100;
  applyPosition(100);

  // Scrubber input — update globe and label as user drags
  scrubber.addEventListener('input', () => {
    applyPosition(parseFloat(scrubber.value));
  });

  // Play/pause toggle
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      // If at the end, rewind to start before playing
      if (parseFloat(scrubber.value) >= 100) {
        scrubber.value = 0;
        applyPosition(0);
      }
      startPlayback();
    }
  });
}

// Bootstrap
initTimeline();
