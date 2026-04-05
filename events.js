// Terravents — EONET event fetching and data normalization

import { EONET_BASE_URL, DEFAULT_EVENT_LIMIT, DEFAULT_STATUS } from './config.js';

/**
 * Fetch events from NASA EONET v3 API and return a normalized array.
 * @param {string} startDate  YYYY-MM-DD
 * @param {string} endDate    YYYY-MM-DD
 * @param {string[]} categories  Optional array of EONET category IDs
 * @returns {Promise<Array>}  Normalized event objects
 */
export async function fetchEvents(startDate, endDate, categories = []) {
  try {
    const params = new URLSearchParams({
      status: DEFAULT_STATUS,
      start: startDate,
      end: endDate,
      limit: DEFAULT_EVENT_LIMIT,
    });

    if (categories.length > 0) {
      params.set('category', categories.join(','));
    }

    const url = `${EONET_BASE_URL}/events?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`EONET API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return normalizeEvents(data.events || []);
  } catch (err) {
    console.error('Failed to fetch EONET events:', err);
    return [];
  }
}

/**
 * Normalize raw EONET event objects into a flat, consistent shape.
 * Skips events with no geometry.
 * EONET geometry coordinates are [lng, lat] — we swap them here.
 */
function normalizeEvents(rawEvents) {
  return rawEvents
    .filter(event => event.geometry && event.geometry.length > 0)
    .map(event => {
      const geo = event.geometry[0];
      // EONET uses GeoJSON coordinate order: [longitude, latitude]
      const [lng, lat] = geo.coordinates;
      return {
        id: event.id,
        title: event.title,
        category: event.categories?.[0]?.id || 'manmade',
        date: geo.date,
        lat,
        lng,
        closed: event.closed || null,
      };
    });
}
