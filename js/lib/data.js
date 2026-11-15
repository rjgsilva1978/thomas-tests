// Loads static JSON from /data with a small in-memory cache.
// Paths are relative so the app works under a GitHub Pages sub-path (/<repo>/).

const cache = new Map();

export function loadJSON(path) {
  if (!cache.has(path)) {
    const p = fetch(path, { cache: 'no-cache' }).then((res) => {
      if (!res.ok) throw new Error(`Não foi possível carregar ${path} (HTTP ${res.status})`);
      return res.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path);
}

export const PATHS = {
  config: 'data/config.json',
  gia: 'data/gia/perguntas.json',
  ppa: 'data/ppa/tetrades.json',
  hpti: 'data/hpti/afirmacoes.json',
};
