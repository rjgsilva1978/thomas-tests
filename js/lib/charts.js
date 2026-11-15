// Thin wrapper over Chart.js (loaded globally from the CDN in index.html).
// Keeps track of live charts so the router can destroy them on navigation.

const live = new Set();

export const isDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export function theme() {
  const dark = isDark();
  return {
    text: dark ? '#cbd5e1' : '#475569',
    grid: dark ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.15)',
    mid: dark ? '#94a3b8' : '#64748b',
    brand: dark ? '#818cf8' : '#1e3a8a',
    good: '#16a34a',
    bad: '#dc2626',
    neutral: dark ? '#64748b' : '#94a3b8',
  };
}

export function makeChart(canvas, config) {
  if (!window.Chart || !canvas) return null;
  const t = theme();
  window.Chart.defaults.color = t.text;
  window.Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  window.Chart.defaults.borderColor = t.grid;
  const chart = new window.Chart(canvas, config);
  live.add(chart);
  return chart;
}

export function destroyCharts() {
  for (const c of live) c.destroy();
  live.clear();
}
