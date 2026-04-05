// Terravents — Configuration

export const CATEGORY_COLORS = {
  wildfires:    '#f97316', // orange
  severeStorms: '#3b82f6', // blue
  volcanoes:    '#ef4444', // red
  earthquakes:  '#a855f7', // purple
  floods:       '#06b6d4', // cyan
  seaLakeIce:   '#e2e8f0', // white/light
  landslides:   '#92400e', // brown
  drought:      '#ca8a04', // yellow
  dustHaze:     '#d4b483', // tan
  snow:         '#f1f5f9', // light blue-white
  waterColor:   '#0ea5e9', // sky blue
  manmade:      '#6b7280', // gray
};

// EONET API
export const EONET_BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3';

// NASA GIBS WMTS
export const GIBS_BASE_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best';
export const GIBS_LAYER_TRUE_COLOR = 'MODIS_Terra_CorrectedReflectance_TrueColor';

// Wikipedia
export const WIKI_SEARCH_URL = 'https://en.wikipedia.org/w/api.php';
export const WIKI_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

// Default date range: last 5 years from today
const today = new Date();
const fiveYearsAgo = new Date(today);
fiveYearsAgo.setFullYear(today.getFullYear() - 5);

export const DEFAULT_END_DATE = today.toISOString().split('T')[0];
export const DEFAULT_START_DATE = fiveYearsAgo.toISOString().split('T')[0];

export const DEFAULT_EVENT_LIMIT = 500;
export const DEFAULT_STATUS = 'all';
