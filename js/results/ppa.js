// PPA scoring (DISC) and the three-graph dashboard.

import { render, esc, fmtDate, pageHeader, btnPrimary, btnSecondary, card } from '../lib/dom.js';
import { loadJSON, PATHS } from '../lib/data.js';
import { makeChart, theme } from '../lib/charts.js';

export const FATORES = ['D', 'I', 'S', 'C'];
export const NOMES = { D: 'Dominância', I: 'Influência', S: 'Estabilidade', C: 'Conformidade' };

/**
 * @param respostas { [questaoId]: { mais: id_opcao, menos: id_opcao } }
 * Graph I = MAIS, Graph II = MENOS (raw, plotted inverted), Graph III = MAIS − MENOS.
 */
export function scorePpa(data, respostas) {
  const fatorDe = {};
  for (const q of data.questoes) for (const o of q.opcoes) fatorDe[o.id_opcao] = o.fator;

  const mais = { D: 0, I: 0, S: 0, C: 0 };
  const menos = { D: 0, I: 0, S: 0, C: 0 };
  for (const r of Object.values(respostas)) {
    if (r.mais && fatorDe[r.mais]) mais[fatorDe[r.mais]] += 1;
    if (r.menos && fatorDe[r.menos]) menos[fatorDe[r.menos]] += 1;
  }
  const autoimagem = Object.fromEntries(FATORES.map((f) => [f, mais[f] - menos[f]]));
  const soma = (o) => Object.values(o).reduce((a, b) => a + b, 0);

  return {
    mais,
    menos,
    autoimagem,
    verificacao: { soma_mais: soma(mais), soma_menos: soma(menos), esperado: data.questoes.length },
    respostas,
  };
}

/** Factors above the midline in Graph III, strongest first. */
export function dominantes(autoimagem) {
  return FATORES.filter((f) => autoimagem[f] > 0).sort((a, b) => autoimagem[b] - autoimagem[a]);
}

export function resumo(resultado) {
  const dom = dominantes(resultado.autoimagem);
  const vals = FATORES.map((f) => `${f} ${resultado.autoimagem[f] > 0 ? '+' : ''}${resultado.autoimagem[f]}`).join(' · ');
  return `Perfil ${dom.length ? dom.join('') : 'equilibrado'} (${vals})`;
}

function lineChart(canvas, { values, mid, reverse = false, min, max, color }) {
  const t = theme();
  return makeChart(canvas, {
    type: 'line',
    data: {
      labels: FATORES,
      datasets: [
        {
          label: 'Perfil',
          data: FATORES.map((f) => values[f]),
          borderColor: color,
          backgroundColor: color,
          pointRadius: 6,
          pointHoverRadius: 7,
          borderWidth: 3,
          tension: 0,
          clip: false,
        },
        {
          label: 'Linha média',
          data: FATORES.map(() => mid),
          borderColor: t.mid,
          borderDash: [6, 5],
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      layout: { padding: { top: 8, bottom: 4, right: 8 } },
      plugins: { legend: { display: false }, tooltip: { filter: (item) => item.datasetIndex === 0 } },
      scales: {
        y: { reverse, min, max, ticks: { stepSize: 2 } },
        x: { grid: { display: false }, ticks: { font: { weight: '700', size: 14 } } },
      },
    },
  });
}

export async function show(attempt) {
  const data = await loadJSON(PATHS.ppa);
  const r = attempt.resultado;
  const n = r.verificacao.esperado;
  const mid = n / 4;
  const dom = dominantes(r.autoimagem);
  const ok = r.verificacao.soma_mais === n && r.verificacao.soma_menos === n;
  const mins = Math.round((r.duracao_ms || 0) / 60000);

  const peak = (o) => Math.max(...Object.values(o));
  const top12 = Math.max(12, Math.ceil(Math.max(peak(r.mais), peak(r.menos)) / 2) * 2);
  const range3 = Math.max(12, Math.ceil(Math.max(...Object.values(r.autoimagem).map(Math.abs)) / 2) * 2);

  const interp = FATORES.map((f) => {
    const v = r.autoimagem[f];
    const nivel = v > 0 ? 'acima' : v < 0 ? 'abaixo' : 'na';
    const texto = v >= 0 ? data.interpretacao[f].alto : data.interpretacao[f].baixo;
    return `
      <div class="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
        <div class="flex items-baseline justify-between">
          <h3 class="font-semibold"><span class="text-brand-700 dark:text-brand-100">${f}</span> · ${esc(NOMES[f])}</h3>
          <span class="text-sm tabular-nums text-slate-500">${v > 0 ? '+' : ''}${v}</span>
        </div>
        <p class="mt-1 text-xs uppercase tracking-wide text-slate-400">${nivel} da linha média</p>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">${esc(v === 0 ? 'Fator neutro: nem se destaca nem é evitado no seu perfil.' : texto)}</p>
      </div>`;
  }).join('');

  const graph = (id, title, sub) => `
    <section class="${card}">
      <h2 class="font-semibold">${title}</h2>
      <p class="mt-0.5 text-xs text-slate-500">${sub}</p>
      <div class="mt-3 h-64"><canvas id="${id}"></canvas></div>
    </section>`;

  const root = render(`
    ${pageHeader('Resultados PPA', `${esc(fmtDate(attempt.data))} · ${mins || '<1'} min`)}
    <section class="${card} mb-6">
      <p class="text-xs uppercase tracking-wide text-slate-400">Fatores predominantes (Autoimagem)</p>
      <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">${dom.length ? dom.map((f) => `${f} · ${NOMES[f]}`).join('  ›  ') : 'Perfil equilibrado'}</p>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">${dom.length ? esc(data.interpretacao[dom[0]].alto) : 'Nenhum fator se destaca acima da linha média.'}</p>
    </section>
    <div class="grid gap-5 lg:grid-cols-3">
      ${graph('g1', 'I · Máscara de Trabalho', 'Escolhas MAIS. Como acredita que deve comportar-se no trabalho.')}
      ${graph('g2', 'II · Comportamento sob Pressão', 'Escolhas MENOS, em escala invertida. O comportamento instintivo.')}
      ${graph('g3', 'III · Autoimagem', 'MAIS − MENOS. O gráfico principal lido pelos recrutadores.')}
    </div>

    <section class="${card} mt-6">
      <h2 class="font-semibold">Contagens</h2>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full text-center text-sm tabular-nums">
          <thead class="text-xs uppercase tracking-wide text-slate-400"><tr><th class="py-1 text-left"></th>${FATORES.map((f) => `<th class="py-1">${f}</th>`).join('')}<th class="py-1">Total</th></tr></thead>
          <tbody>
            <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-1.5 text-left">MAIS</td>${FATORES.map((f) => `<td>${r.mais[f]}</td>`).join('')}<td class="font-semibold">${r.verificacao.soma_mais}</td></tr>
            <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-1.5 text-left">MENOS</td>${FATORES.map((f) => `<td>${r.menos[f]}</td>`).join('')}<td class="font-semibold">${r.verificacao.soma_menos}</td></tr>
            <tr class="border-t border-slate-100 font-semibold dark:border-slate-800"><td class="py-1.5 text-left">MAIS − MENOS</td>${FATORES.map((f) => `<td>${r.autoimagem[f] > 0 ? '+' : ''}${r.autoimagem[f]}</td>`).join('')}<td></td></tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs ${ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}">
        ${ok ? `✓ Verificação: ${n} escolhas MAIS e ${n} escolhas MENOS.` : `⚠ Verificação falhou: esperava ${n}/${n}, obteve ${r.verificacao.soma_mais}/${r.verificacao.soma_menos}.`}
      </p>
    </section>

    <section class="mt-6">
      <h2 class="mb-3 font-semibold">Interpretação por fator</h2>
      <div class="grid gap-3 sm:grid-cols-2">${interp}</div>
      <p class="mt-4 text-xs text-slate-400">Interpretação simplificada para treino. O relatório oficial usa normas e conversões próprias que não são reproduzidas aqui.</p>
    </section>

    <div class="mt-6 flex flex-wrap gap-3">
      <a href="#/ppa" class="${btnPrimary}">Repetir teste</a>
      <a href="#/" class="${btnSecondary}">Início</a>
    </div>`);

  const t = theme();
  lineChart(root.querySelector('#g1'), { values: r.mais, mid, min: 0, max: top12, color: t.brand });
  lineChart(root.querySelector('#g2'), { values: r.menos, mid, reverse: true, min: 0, max: top12, color: '#b45309' });
  lineChart(root.querySelector('#g3'), { values: r.autoimagem, mid: 0, min: -range3, max: range3, color: t.good });
}
