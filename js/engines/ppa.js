// PPA engine: 24 tetrads, one MAIS and one MENOS choice per tetrad (ipsative, forced choice).

import { render, esc, fmtClock, btnPrimary, btnSecondary, card } from '../lib/dom.js';
import { loadJSON, PATHS } from '../lib/data.js';
import { shuffle } from '../lib/shuffle.js';
import { stopwatch } from '../lib/timer.js';
import { saveAttempt } from '../store.js';
import { scorePpa } from '../results/ppa.js';

export async function start(ctx) {
  const data = await loadJSON(PATHS.ppa);

  render(`
    <div class="mx-auto max-w-2xl ${card}">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-100">Thomas PPA</p>
      <h1 class="mt-1 text-2xl font-bold">Instruções</h1>
      <div class="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
        <p>${esc(data.instrucoes)}</p>
        <p>Em cada um dos ${data.questoes.length} grupos tem de escolher <strong>exatamente uma</strong> palavra em <strong>MAIS</strong> e <strong>uma</strong> palavra diferente em <strong>MENOS</strong>.</p>
        <p>Não há limite de tempo, mas responda com a primeira impressão: normalmente demora 6 a 8 minutos. Não existem respostas certas ou erradas.</p>
      </div>
      <button id="go" class="${btnPrimary} mt-6 w-full sm:w-auto">Começar</button>
    </div>`).querySelector('#go').addEventListener('click', () => run(ctx, data));
}

function run(ctx, data) {
  ctx.setActiveTest(true);
  // Shuffle words inside each tetrad so the D/I/S/C position never gives the factor away.
  const blocks = data.questoes.map((q) => ({ id: q.id, opcoes: shuffle(q.opcoes) }));
  const respostas = Object.fromEntries(blocks.map((b) => [b.id, { mais: null, menos: null }]));
  let i = 0;
  let advanceTimer = null;
  let clockEl = null;
  const watch = stopwatch((ms) => { if (clockEl) clockEl.textContent = fmtClock(ms); });
  ctx.onCleanup(() => { watch.stop(); clearTimeout(advanceTimer); });

  function done(id) {
    const r = respostas[id];
    return r.mais && r.menos;
  }

  function show() {
    const b = blocks[i];
    const r = respostas[b.id];
    const completed = blocks.filter((x) => done(x.id)).length;
    const pct = Math.round((completed / blocks.length) * 100);

    const rows = b.opcoes.map((o) => {
      const toggle = (col) => {
        const other = col === 'mais' ? 'menos' : 'mais';
        const on = r[col] === o.id_opcao;
        const blocked = r[other] === o.id_opcao;
        const label = col === 'mais' ? 'Mais' : 'Menos';
        return `
          <td class="px-2 py-2 text-center">
            <button class="ppa-toggle mx-auto grid h-11 w-11 place-items-center rounded-full border-2 border-slate-300 text-sm font-bold text-transparent transition hover:border-brand-500 dark:border-slate-600"
              data-col="${col}" data-opt="${esc(o.id_opcao)}" aria-pressed="${on}" ${blocked ? 'disabled' : ''}
              aria-label="${label}: ${esc(o.palavra)}">✓</button>
          </td>`;
      };
      return `
        <tr class="border-t border-slate-100 dark:border-slate-800">
          ${toggle('mais')}
          <td class="px-3 py-2 text-lg font-medium text-slate-900 dark:text-white">${esc(o.palavra)}</td>
          ${toggle('menos')}
        </tr>`;
    }).join('');

    const root = render(`
      <div class="mx-auto max-w-xl">
        <div class="mb-6">
          <div class="mb-2 flex justify-between text-sm text-slate-500">
            <span>Grupo ${i + 1} de ${blocks.length}</span>
            <span>Tempo: <span id="clock" class="tabular-nums">0:00</span></span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded-full bg-brand-700 transition-all dark:bg-brand-500" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="${card} fade-in">
          <p class="mb-3 text-center text-sm text-slate-500">No trabalho, qual destas palavras <strong>mais</strong> e qual <strong>menos</strong> o descreve?</p>
          <table class="w-full">
            <thead>
              <tr class="text-xs font-semibold uppercase tracking-wider">
                <th class="w-20 pb-2 text-green-700 dark:text-green-400">Mais</th>
                <th class="pb-2"></th>
                <th class="w-20 pb-2 text-red-700 dark:text-red-400">Menos</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="mt-6 flex justify-between">
          <button id="back" class="${btnSecondary}" ${i === 0 ? 'disabled' : ''}>← Voltar</button>
          <button id="next" class="${btnPrimary}" ${done(b.id) ? '' : 'disabled'}>${i === blocks.length - 1 ? 'Terminar' : 'Seguinte →'}</button>
        </div>
      </div>`);

    clockEl = root.querySelector('#clock');
    clockEl.textContent = fmtClock(watch.elapsed());

    root.querySelectorAll('.ppa-toggle').forEach((btn) =>
      btn.addEventListener('click', () => pick(btn.dataset.col, btn.dataset.opt)));
    root.querySelector('#back').addEventListener('click', () => go(i - 1));
    root.querySelector('#next').addEventListener('click', () => next());
  }

  function pick(col, opt) {
    const r = respostas[blocks[i].id];
    const other = col === 'mais' ? 'menos' : 'mais';
    if (r[other] === opt) return; // Rule 2: the same word cannot be both MAIS and MENOS.
    const wasDone = done(blocks[i].id);
    r[col] = opt;
    show();
    // Auto-advance only when this click completes the tetrad.
    if (!wasDone && done(blocks[i].id)) {
      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(next, 300);
    }
  }

  function go(k) {
    clearTimeout(advanceTimer);
    if (k < 0 || k >= blocks.length) return;
    i = k;
    show();
  }

  function next() {
    clearTimeout(advanceTimer);
    if (!done(blocks[i].id)) return;
    const firstOpen = blocks.findIndex((x) => !done(x.id));
    if (i < blocks.length - 1) return go(i + 1);
    if (firstOpen !== -1) return go(firstOpen);
    finish();
  }

  function finish() {
    watch.stop();
    const resultado = { ...scorePpa(data, respostas), duracao_ms: watch.elapsed() };
    ctx.finish(saveAttempt('ppa', resultado));
  }

  show();
}
