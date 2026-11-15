// GIA section comparison: partial (practice) runs over time, with full runs as reference.

import { render, esc, fmtDate, fmtNum, pageHeader, btnPrimary, btnSecondary, card } from '../lib/dom.js';
import { makeChart, destroyCharts, theme } from '../lib/charts.js';
import { SUBTESTES } from '../engines/gia-items.js';
import { GIA_SUBTESTES } from '../lib/validate.js';
import { listAttempts, listPartials } from '../store.js';

const secs = (ms) => (ms === null || ms === undefined ? '—' : `${fmtNum(ms / 1000, 2)} s`);
const shortDate = (iso) => new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
const shortDateTime = (iso) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const tabCls = (on) => `rounded-full border px-3 py-1 text-sm ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 dark:border-slate-700'}`;

export function show(ctx) {
  const partials = listPartials();
  const fulls = listAttempts().filter((a) => a.teste === 'gia');
  const has = (a, s) => !!a.resultado?.subtestes?.[s];

  const requested = ctx?.params?.get('s');
  const first = GIA_SUBTESTES.find((s) => partials.some((a) => has(a, s))) || GIA_SUBTESTES[0];
  const active = GIA_SUBTESTES.includes(requested) ? requested : first;

  const runs = partials.filter((a) => has(a, active)); // newest first
  const chrono = [...runs].reverse();
  const fullRuns = fulls.filter((a) => has(a, active)).reverse();
  const nome = SUBTESTES[active].nome;

  const tabs = GIA_SUBTESTES.map((s) => `<button data-s="${s}" class="${tabCls(s === active)}">${esc(SUBTESTES[s].nome)}</button>`).join('');

  let body;
  if (!runs.length) {
    body = `
      <section class="${card} mt-6">
        <p class="text-slate-500">Ainda não há treinos da secção <strong>${esc(nome)}</strong>.</p>
        <a href="#/gia?secoes=${active}" class="${btnPrimary} mt-4">Treinar esta secção</a>
      </section>`;
  } else {
    const pts = runs.map((a) => a.resultado.subtestes[active].pontuacao);
    const best = Math.max(...pts);
    const avg = pts.reduce((a, b) => a + b, 0) / pts.length;
    const evo = pts.length >= 2 ? pts[0] - pts[pts.length - 1] : null; // runs is newest first
    const evoTxt = evo === null ? '—' : `${evo > 0 ? '+' : evo < 0 ? '−' : ''}${fmtNum(Math.abs(evo), 2)}`;
    const evoCls = evo === null || evo === 0 ? '' : evo > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
    const rows = runs.map((a) => {
      const x = a.resultado.subtestes[active];
      return `
        <tr class="border-t border-slate-100 dark:border-slate-800">
          <td class="py-2 pr-3 text-left sm:whitespace-nowrap">${esc(fmtDate(a.data))}</td>
          <td class="px-2 text-green-700 dark:text-green-400">${x.certas}</td>
          <td class="px-2 text-red-700 dark:text-red-400">${x.erradas}</td>
          <td class="px-2 text-slate-500">${x.omissoes}</td>
          <td class="px-2 font-semibold">${fmtNum(x.pontuacao, 2)}</td>
          <td class="px-2">${x.precisao === null ? '—' : `${fmtNum(x.precisao)}%`}</td>
          <td class="px-2">${secs(x.rt_medio)}</td>
          <td class="whitespace-nowrap pl-2 text-right"><a class="font-medium text-brand-600 hover:underline dark:text-brand-100" href="#/resultados/${esc(a.id)}">Ver</a></td>
        </tr>`;
    }).join('');
    body = `
      <section class="${card} mt-6">
        <h2 class="font-semibold">${esc(nome)}</h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Melhor pontuação <strong>${fmtNum(best, 2)}</strong> · média <strong>${fmtNum(avg, 2)}</strong> · evolução (último − primeiro) <strong class="${evoCls}">${evoTxt}</strong> · ${runs.length} ${runs.length === 1 ? 'treino' : 'treinos'}
        </p>
        <div class="mt-3 h-64"><canvas id="cmp" aria-label="Evolução da pontuação e precisão em ${esc(nome)}"></canvas></div>
        ${fullRuns.length ? '<p class="mt-3 text-xs text-slate-400">A linha tracejada é o teste completo (referência indicativa: as perguntas e a fadiga diferem do treino por secções).</p>' : ''}
      </section>

      <section class="${card} mt-6">
        <h2 class="font-semibold">Treinos de ${esc(nome)}</h2>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-center text-sm tabular-nums">
            <thead class="text-xs uppercase tracking-wide text-slate-400">
              <tr><th class="pb-2 pr-3 text-left">Data</th><th class="pb-2">Certas</th><th class="pb-2">Erradas</th><th class="pb-2">Omissões</th><th class="pb-2">Pontos</th><th class="pb-2">Precisão</th><th class="pb-2">Tempo médio</th><th class="pb-2"></th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <a href="#/gia?secoes=${active}" class="${btnPrimary} mt-5">Treinar esta secção</a>
      </section>`;
  }

  const root = render(`
    ${pageHeader('Comparar secções do GIA', 'Evolução de cada secção nos treinos por secções.')}
    <div id="tabs" class="flex flex-wrap gap-2">${tabs}</div>
    ${body}
    <div class="mt-6 flex flex-wrap gap-3">
      <a href="#/historico" class="${btnSecondary}">Histórico</a>
      <a href="#/" class="${btnSecondary}">Início</a>
    </div>`);

  root.querySelector('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]');
    if (b && b.dataset.s !== active) location.hash = `#/historico/gia-secoes?s=${b.dataset.s}`;
  });

  if (!runs.length) return;

  // Merged chronological axis; each series has null where it has no run on that point.
  const points = [
    ...chrono.map((a) => ({ data: a.data, kind: 'treino', x: a.resultado.subtestes[active] })),
    ...fullRuns.map((a) => ({ data: a.data, kind: 'completo', x: a.resultado.subtestes[active] })),
  ].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  const col = (kind, field) => points.map((p) => (p.kind === kind ? p.x[field] : null));
  const th = theme();
  destroyCharts();
  makeChart(root.querySelector('#cmp'), {
    type: 'line',
    data: {
      labels: points.map((p) => shortDate(p.data)),
      datasets: [
        { label: 'Treino — pontuação', data: col('treino', 'pontuacao'), borderColor: th.brand, backgroundColor: th.brand, tension: 0.2, spanGaps: true },
        { label: 'Teste completo — pontuação', data: col('completo', 'pontuacao'), borderColor: th.neutral, backgroundColor: th.neutral, borderDash: [6, 4], tension: 0.2, spanGaps: true },
        { label: 'Treino — precisão %', data: col('treino', 'precisao'), borderColor: th.good, backgroundColor: th.good, tension: 0.2, spanGaps: true, yAxisID: 'y1' },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { title: (items) => (items[0] ? shortDateTime(points[items[0].dataIndex].data) : '') } } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Pontuação' } },
        y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: 'Precisão %' } },
      },
    },
  });
}
