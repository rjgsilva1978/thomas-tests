// Attempt history. Persists to localStorage when available and always keeps an
// in-memory copy, so results still render in private windows or when storage is blocked.
//
// Two collections share the origin's storage quota: the main history (full tests) and the
// partial store (GIA section practice). When a write fails (quota), the oldest partial runs are
// dropped and the write is retried; main history entries are never dropped.

const KEY = 'thomas-sim:v1:historico';
const MAX_ATTEMPTS = 100;
const KEY_PARTIAL = 'thomas-sim:v1:gia-parcial';
const MAX_PARTIALS = 50;

function tryStore(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

/** A persisted list with an in-memory copy. `evict()` frees space; returns false if it cannot. */
function collection(key, cap, evict) {
  let memory = null;

  function read() {
    if (memory) return memory;
    try {
      const raw = localStorage.getItem(key);
      memory = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(memory)) memory = [];
    } catch {
      memory = [];
    }
    return memory;
  }

  function write(list) {
    memory = list;
    while (!tryStore(key, memory)) {
      if (!evict()) break; // nothing left to drop: keep the in-memory copy only
    }
  }

  /** Remove the oldest entry (by date) and persist the shrunk list. */
  function dropOldest() {
    const list = read();
    if (!list.length) return false;
    let oldest = 0;
    list.forEach((a, i) => { if (a.data < list[oldest].data) oldest = i; });
    memory = list.filter((_, i) => i !== oldest);
    tryStore(key, memory);
    return true;
  }

  return { read, write, dropOldest, cap };
}

const partial = collection(KEY_PARTIAL, MAX_PARTIALS, () => partial.dropOldest());
const main = collection(KEY, MAX_ATTEMPTS, () => partial.dropOldest());

// Attempts made in test mode (e.g. #/gia?tempo=20): viewable now, never stored or listed.
const transient = [];

const byDateDesc = (a, b) => b.data.localeCompare(a.data);

/** All attempts, newest first. */
export function listAttempts() {
  return [...main.read()].sort(byDateDesc);
}

export function getAttempt(id) {
  return (
    main.read().find((a) => a.id === id) ||
    partial.read().find((a) => a.id === id) ||
    transient.find((a) => a.id === id) ||
    null
  );
}

export function lastAttempt(teste) {
  return listAttempts().find((a) => a.teste === teste) || null;
}

/**
 * Save a finished attempt and return it with its generated id.
 * With { persist: false } the attempt is kept for this session only and stays out of the history.
 */
export function saveAttempt(teste, resultado, { persist = true } = {}) {
  const attempt = {
    id: `${teste}-${Date.now().toString(36)}`,
    teste,
    data: new Date().toISOString(),
    resultado,
  };
  if (persist) main.write([...main.read(), attempt].slice(-main.cap));
  else transient.push(attempt);
  return attempt;
}

export function clearHistory() {
  main.write([]);
}

// ------------------------------------------------------------------ GIA section practice

/** Save a GIA practice run (own storage key). { persist: false } keeps it for this session only. */
export function savePartial(resultado, { persist = true } = {}) {
  const attempt = {
    id: `gia-parcial-${Date.now().toString(36)}`,
    teste: 'gia',
    parcial: true,
    data: new Date().toISOString(),
    resultado,
  };
  if (persist) partial.write([...partial.read(), attempt].slice(-partial.cap));
  else transient.push(attempt);
  return attempt;
}

/** Practice runs, newest first. */
export function listPartials() {
  return [...partial.read()].sort(byDateDesc);
}

export function clearPartials() {
  partial.write([]);
}

/** Item ids of `sub` seen in the `nRuns` most recent runs (full + practice) that included it. */
export function recentItemIds(sub, nRuns = 5) {
  const runs = [...main.read(), ...partial.read()]
    .filter((a) => a.resultado?.ordem?.includes(sub))
    .sort(byDateDesc)
    .slice(0, nRuns);
  const ids = new Set();
  for (const a of runs) {
    for (const r of a.resultado.registos?.[sub] || []) if (r?.id != null) ids.add(r.id);
  }
  return ids;
}
