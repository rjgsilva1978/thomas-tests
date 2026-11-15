// GIA scoring, results dashboard and mistake review.

import { render, esc, fmtDate, fmtNum, pageHeader, btnPrimary, btnSecondary, card } from '../lib/dom.js';
import { makeChart, theme } from '../lib/charts.js';
import { SUBTESTES, renderItem, explain } from '../engines/gia-items.js';
import { listPartials } from '../store.js';

function stats(regs, penalizacao) {
  const certas = regs.filter((r) => r.correta).length;
  const omissoes = regs.filter((r) => r.resposta === null).length;
  const respondidas = regs.length - omissoes;
  const erradas = respondidas - certas;
  const rts = regs.filter((r) => r.rt !== null).map((r) => r.rt);
  return {
    certas,
    erradas,
    omissoes,
    respondidas,
    pontuacao: Math.round((certas - penalizacao * erradas) * 100) / 100,
    precisao: respondidas ? Math.round((certas / respondidas) * 1000) / 10 : null,
    rt_medio: rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null,
  };
}

export function scoreGia({ ordem, tempos, penalizacao, registos, esgotados, override }) {
  const subtestes = {};
  for (const s of ordem) {
    subtestes[s] = { nome: SUBTESTES[s].nome, tempo_seg: tempos[s], esgotado: !!esgotados[s], ...stats(registos[s] || [], penalizacao) };
  }
  const all = ordem.flatMap((s) => registos[s] || []);
  return { ordem, penalizacao, modo_teste: !!override, subtestes, total: stats(all, penalizacao), registos };
}

export function resumo(r) {
  return `Pontuação ${fmtNum(r.total.pontuacao, 2)} · ${r.total.certas} certas · precisão ${fmtNum(r.total.precisao)}%`;
}

const secs = (ms) => (ms === null ? '—' : `${fmtNum(ms / 1000, 2)} s`);

export function show(attempt) {
  const r = attempt.resultado;
  const t = r.total;

  const kpi = (label, value, hint = '') => `
    <div class="${card}">
      <p class="text-xs uppercase tracking-wide text-slate-400">${label}</p>
      <p class="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">${value}</p>
      ${hint ? `<p class="mt-1 text-xs text-slate-500">${hint}</p>` : ''}
    </div>`;

  const parcial = !!r.parcial;
  const older = parcial ? listPartials().filter((a) => a.id !== attempt.id && a.data < attempt.data) : [];
  const sign = (n, d) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtNum(Math.abs(n), d)}`;
  const tone = (n) => (n > 0 ? 'text-green-700 dark:text-green-400' : n < 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-500');
  function deltaCell(s) {
    const x = r.subtestes[s];
    const prev = older.find((a) => a.resultado?.subtestes?.[s]);
    const p = prev?.resultado.subtestes[s];
    if (!p) return '<td class="pl-2 text-slate-400">—</td>';
    const dp = Math.round((x.pontuacao - p.pontuacao) * 100) / 100;
    const dq = x.precisao === null || p.precisao === null ? null : Math.round((x.precisao - p.precisao) * 10) / 10;
    return `<td class="whitespace-nowrap pl-2 text-xs"><span class="${tone(dp)}">${sign(dp, 2)} pts</span>${dq === null ? '' : ` · <span class="${tone(dq)}">${sign(dq, 1)} pp</span>`}</td>`;
  }

  const rows = r.ordem.map((s) => {
    const x = r.subtestes[s];
    return `
      <tr class="border-t border-slate-100 dark:border-slate-800">
        <td class="py-2 pr-3 text-left font-medium">${esc(x.nome)}${x.esgotado ? ' <span title="Respondeu a todo o banco de perguntas antes do fim do tempo" class="text-amber-600">*</span>' : ''}</td>
        <td class="px-2 text-green-700 dark:text-green-400">${x.certas}</td>
        <td class="px-2 text-red-700 dark:text-red-400">${x.erradas}</td>
        <td class="px-2 text-slate-500">${x.omissoes}</td>
        <td class="px-2 font-semibold">${fmtNum(x.pontuacao, 2)}</td>
        <td class="px-2">${x.precisao === null ? '—' : `${fmtNum(x.precisao)}%`}</td>
        <td class="${parcial ? 'px-2' : 'pl-2'}">${secs(x.rt_medio)}</td>
        ${parcial ? deltaCell(s) : ''}
      </tr>`;
  }).join('');

  const erros = r.ordem.flatMap((s) => (r.registos[s] || []).filter((x) => !x.correta).map((x) => ({ ...x, sub: s })));
  const tabs = [['todos', `Todos (${erros.length})`], ...r.ordem.map((s) => [s, `${SUBTESTES[s].nome} (${erros.filter((e) => e.sub === s).length})`])];

  const root = render(`
    ${pageHeader('Resultados GIA', `${parcial ? `Treino por secções · ${esc(r.ordem.map((s) => SUBTESTES[s].nome).join(', '))} · ` : ''}${esc(fmtDate(attempt.data))}${r.modo_teste ? ' · modo de teste (tempos reduzidos)' : ''}`)}
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      ${kpi('Pontuação', fmtNum(t.pontuacao, 2), `+1 certa · −${r.penalizacao} errada`)}
      ${kpi('Total de acertos', t.certas, `${t.respondidas} respondidas`)}
      ${kpi('Taxa de precisão', t.precisao === null ? '—' : `${fmtNum(t.precisao)}%`, 'certas ÷ respondidas')}
      ${kpi('Tempo médio', secs(t.rt_medio), 'por resposta')}
    </div>

    <section class="${card} mt-6">
      <h2 class="font-semibold">Por subteste</h2>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full text-center text-sm tabular-nums">
          <thead class="text-xs uppercase tracking-wide text-slate-400">
            <tr><th class="pb-2 text-left">Subteste</th><th class="pb-2">Certas</th><th class="pb-2">Erradas</th><th class="pb-2">Omissões</th><th class="pb-2">Pontos</th><th class="pb-2">Precisão</th><th class="pb-2">Tempo médio</th>${parcial ? '<th class="pb-2" title="Variação face ao treino anterior desta secção">Δ vs anterior</th>' : ''}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="mt-5 h-64"><canvas id="bars" aria-label="Respostas certas, erradas e omissões por subteste"></canvas></div>
      <p class="mt-3 text-xs text-slate-400">A penalização por erro é uma convenção deste simulador para desencorajar respostas ao acaso; não é a fórmula oficial. Sem grupo normativo, não são apresentados percentis.${r.ordem.some((s) => r.subtestes[s].esgotado) ? ' * Banco de perguntas esgotado antes do fim do tempo.' : ''}</p>
    </section>

    <section class="mt-6">
      <h2 class="font-semibold">Revisão de erros</h2>
      <p class="mt-1 text-sm text-slate-500">Respostas erradas e omissões. A verde a resposta certa, a vermelho a sua.</p>
      <div id="tabs" class="mt-3 flex flex-wrap gap-2">
        ${tabs.map(([k, label], i) => `<button data-tab="${k}" class="rounded-full border px-3 py-1 text-sm ${i === 0 ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 dark:border-slate-700'}">${esc(label)}</button>`).join('')}
      </div>
      <div id="review" class="mt-4 space-y-4"></div>
    </section>

    <div class="mt-6 flex flex-wrap gap-3">
      ${parcial
        ? `<a href="#/gia?secoes=${esc(r.ordem.join(','))}" class="${btnPrimary}">Repetir treino</a>
      <a href="#/historico/gia-secoes?s=${esc(r.ordem[0])}" class="${btnSecondary}">Comparar secções</a>`
        : `<a href="#/gia" class="${btnPrimary}">Repetir teste</a>`}
      <a href="#/historico" class="${btnSecondary}">Histórico</a>
      <a href="#/" class="${btnSecondary}">Início</a>
    </div>`);

  const reviewEl = root.querySelector('#review');
  function showTab(key) {
    const list = key === 'todos' ? erros : erros.filter((e) => e.sub === key);
    reviewEl.innerHTML = list.length
      ? list.map((e) => `
          <article class="${card}">
            <div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span class="font-semibold">${esc(SUBTESTES[e.sub].nome)}</span>
              <span class="${e.resposta === null ? 'text-slate-500' : 'text-red-700 dark:text-red-400'}">
                ${e.resposta === null ? 'Sem resposta (tempo esgotado)' : `A sua resposta: <strong>${esc(e.resposta)}</strong>`} · Certa: <strong class="text-green-700 dark:text-green-400">${esc(e.item.resposta_correta)}</strong>
              </span>
            </div>
            <div class="gia-stage mt-3 px-3 py-6">${renderItem(e.sub, e.item, { mode: 'review', ordem: e.ordem, resposta: e.resposta })}</div>
            ${explain(e.sub, e.item) ? `<p class="mt-3 text-sm text-slate-600 dark:text-slate-400">${esc(explain(e.sub, e.item))}</p>` : ''}
          </article>`).join('')
      : `<p class="text-sm text-slate-500">Sem erros nesta secção. 🎯</p>`;
    root.querySelectorAll('[data-tab]').forEach((b) => {
      const on = b.dataset.tab === key;
      b.className = `rounded-full border px-3 py-1 text-sm ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 dark:border-slate-700'}`;
    });
  }
  root.querySelector('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) showTab(b.dataset.tab);
  });
  showTab('todos');

  const th = theme();
  makeChart(root.querySelector('#bars'), {
    type: 'bar',
    data: {
      labels: r.ordem.map((s) => SUBTESTES[s].nome),
      datasets: [
        { label: 'Certas', data: r.ordem.map((s) => r.subtestes[s].certas), backgroundColor: th.good },
        { label: 'Erradas', data: r.ordem.map((s) => r.subtestes[s].erradas), backgroundColor: th.bad },
        { label: 'Omissões', data: r.ordem.map((s) => r.subtestes[s].omissoes), backgroundColor: th.neutral },
      ],
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }, y: { stacked: true } },
    },
  });
}
