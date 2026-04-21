const SOIL_TYPE_ALIASES: Record<string, string> = {
  loam: 'loamy',
  loamy: 'loamy',
  loamy_soil: 'loamy',
  alluvial: 'alluvial',
  alluvial_soil: 'alluvial',
  sandy: 'sandy',
  sand: 'sandy',
  sandy_soil: 'sandy',
  sandy_loam: 'sandy_loam',
  clay: 'clay',
  clayey: 'clay',
  clay_soil: 'clay',
  black: 'black_soil',
  black_soil: 'black_soil',
  red: 'red',
  red_soil: 'red',
  laterite: 'laterite',
  lateritic: 'laterite',
  laterite_soil: 'laterite',
};

const SOIL_TYPE_LABELS: Record<string, string> = {
  loamy: 'Loamy',
  alluvial: 'Alluvial Soil',
  sandy: 'Sandy Soil',
  sandy_loam: 'Sandy Loam',
  clay: 'Clay Soil',
  black_soil: 'Black Soil',
  red: 'Red Soil',
  laterite: 'Laterite Soil',
};

export function normalizeSoilType(value?: string | null): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!normalized) return 'loamy';
  return SOIL_TYPE_ALIASES[normalized] || normalized;
}

export function formatSoilTypeLabel(value?: string | null): string {
  const key = normalizeSoilType(value);
  const known = SOIL_TYPE_LABELS[key];
  if (known) return known;
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
