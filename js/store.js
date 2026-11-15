// Attempt history. Persists to localStorage when available and always keeps an
// in-memory copy, so results still render in private windows or when storage is blocked.

const KEY = 'thomas-sim:v1:historico';
const MAX_ATTEMPTS = 100;
let memory = null;

function read() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(memory)) memory = [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(list) {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked: keep the in-memory copy only */
  }
}

/** All attempts, newest first. */
export function listAttempts() {
  return [...read()].sort((a, b) => b.data.localeCompare(a.data));
}

// Attempts made in test mode (e.g. #/gia?tempo=20): viewable now, never stored or listed.
const transient = [];

export function getAttempt(id) {
  return read().find((a) => a.id === id) || transient.find((a) => a.id === id) || null;
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
  if (persist) write([...read(), attempt].slice(-MAX_ATTEMPTS));
  else transient.push(attempt);
  return attempt;
}

export function clearHistory() {
  write([]);
}
