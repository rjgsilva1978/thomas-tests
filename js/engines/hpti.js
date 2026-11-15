// HPTI engine: one statement per screen, 7-point Likert scale, auto-advance.

import { render, esc, btnPrimary, btnSecondary, card } from '../lib/dom.js';
import { loadJSON, PATHS } from '../lib/data.js';
import { shuffle } from '../lib/shuffle.js';
import { saveAttempt } from '../store.js';
import { scoreHpti } from '../results/hpti.js';

export async function start(ctx) {
  const data = await loadJSON(PATHS.hpti);

  render(`
    <div class="mx-auto max-w-2xl ${card}">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-100">Thomas HPTI</p>
      <h1 class="mt-1 text-2xl font-bold">Instruções</h1>
      <div class="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
        <p>Vai ver ${data.afirmacoes.length} afirmações sobre a forma como trabalha. Indique o seu grau de concordância com cada uma, numa escala de 1 (<em>${esc(data.escala[0])}</em>) a 7 (<em>${esc(data.escala[6])}</em>).</p>
        <p>Não há respostas certas nem erradas, e não há limite de tempo. Responda de forma rápida e honesta, pensando no seu comportamento habitual no trabalho.</p>
        <p>Ao clicar numa opção avança automaticamente. Pode voltar atrás para corrigir.</p>
      </div>
      <button id="go" class="${btnPrimary} mt-6 w-full sm:w-auto">Começar</button>
    </div>`).querySelector('#go').addEventListener('click', () => run(ctx, data));
}

function run(ctx, data) {
  ctx.setActiveTest(true);
  const items = shuffle(data.afirmacoes);
  const answers = new Array(items.length).fill(null);
  const startedAt = Date.now();
  let i = 0;
  let locked = false;

  function show() {
    const item = items[i];
    const pct = Math.round((answers.filter((a) => a !== null).length / items.length) * 100);
    const buttons = data.escala.map((label, k) => {
      const v = k + 1;
      const on = answers[i] === v;
      return `
        <button data-v="${v}" aria-pressed="${on}"
          class="group flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition sm:flex-col sm:gap-1 sm:px-1 sm:py-4 sm:text-center
          ${on ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'}">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${on ? 'bg-white/20' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}">${v}</span>
          <span class="text-sm leading-tight sm:text-xs">${esc(label)}</span>
        </button>`;
    }).join('');

    const root = render(`
      <div class="mx-auto max-w-3xl">
        <div class="mb-6">
          <div class="mb-2 flex justify-between text-sm text-slate-500">
            <span>Afirmação ${i + 1} de ${items.length}</span><span>${pct}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full rounded-full bg-brand-700 transition-all dark:bg-brand-500" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="${card} fade-in px-6 py-10 text-center sm:px-10">
          <p class="text-xl font-medium leading-relaxed text-slate-900 dark:text-white sm:text-2xl">${esc(item.texto)}</p>
        </div>
        <div class="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-7">${buttons}</div>
        <div class="mt-6 flex justify-between">
          <button id="back" class="${btnSecondary}" ${i === 0 ? 'disabled' : ''}>← Voltar</button>
          ${answers[i] !== null && i < items.length - 1 ? `<button id="next" class="${btnSecondary}">Seguinte →</button>` : ''}
        </div>
      </div>`);

    root.querySelectorAll('[data-v]').forEach((b) =>
      b.addEventListener('click', () => choose(Number(b.dataset.v))));
    root.querySelector('#back')?.addEventListener('click', () => { if (i > 0) { i--; show(); } });
    root.querySelector('#next')?.addEventListener('click', () => { i++; show(); });
  }

  function choose(v) {
    if (locked) return;
    locked = true;
    answers[i] = v;
    // Brief visual confirmation, then advance.
    document.querySelectorAll('[data-v]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === v)));
    setTimeout(() => {
      locked = false;
      const nextEmpty = answers.indexOf(null);
      if (nextEmpty === -1) return finish();
      i = i < items.length - 1 ? i + 1 : nextEmpty;
      show();
    }, 150);
  }

  function finish() {
    const respostas = items.map((it, k) => ({ id: it.id, valor: answers[k] }));
    const resultado = { ...scoreHpti(data, respostas), duracao_ms: Date.now() - startedAt };
    ctx.finish(saveAttempt('hpti', resultado));
  }

  show();
}
