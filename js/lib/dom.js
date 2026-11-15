// Tiny DOM helpers: HTML escaping, rendering into #app, and test-mode handling.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape any value for safe interpolation into HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

export const app = () => document.getElementById('app');

/** Replace the content of #app with an HTML string and return the root element. */
export function render(html) {
  const root = app();
  root.innerHTML = html;
  window.scrollTo({ top: 0 });
  return root;
}

/** Toggle the distraction-free layout used while a test is running. */
export function setTestMode(on) {
  document.body.classList.toggle('test-mode', on);
}

export function fmtClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function fmtNum(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** Standard page heading used across non-test screens. */
export function pageHeader(title, subtitle = '') {
  return `
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">${esc(title)}</h1>
      ${subtitle ? `<p class="mt-1 text-slate-600 dark:text-slate-400">${subtitle}</p>` : ''}
    </div>`;
}

export const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40';
export const btnSecondary =
  'inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';
export const card =
  'rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';
