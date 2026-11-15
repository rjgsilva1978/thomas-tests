// GIA engine: five timed subtests, auto-advance on click, no going back.
// Flow: overview → (instructions + worked example → timed block → time-up screen) × 5 → results.

import { render, esc, fmtClock, btnPrimary, card } from '../lib/dom.js';
import { loadJSON, PATHS } from '../lib/data.js';
import { shuffle } from '../lib/shuffle.js';
import { countdown } from '../lib/timer.js';
import { validateGia, validItems, GIA_SUBTESTES } from '../lib/validate.js';
import { saveAttempt } from '../store.js';
import { SUBTESTES, prepare, optionsFor, isCorrect, renderItem, explain } from './gia-items.js';
import { scoreGia } from '../results/gia.js';

export async function start(ctx) {
  const [config, bank] = await Promise.all([loadJSON(PATHS.config), loadJSON(PATHS.gia)]);
  const cfg = config.gia;
  const ordem = (cfg.ordem || GIA_SUBTESTES).filter((s) => SUBTESTES[s]);

  // Skip invalid items (useful when the bank is AI-generated) and report them in the console.
  const problems = validateGia(bank);
  if (problems.length) console.warn('[GIA] Itens inválidos ignorados:', problems);
  const items = Object.fromEntries(ordem.map((s) => [s, validItems(bank, s)]));

  // Dev/testing override: #/gia?tempo=20 sets every subtest to 20 seconds.
  const override = Number(ctx.params.get('tempo')) || null;
  const tempos = Object.fromEntries(ordem.map((s) => [s, override || cfg.tempos_seg[s]]));

  let aborted = false;
  let timer = null;
  ctx.onCleanup(() => { aborted = true; timer?.stop(); });

  const totalMin = Math.round(Object.values(tempos).reduce((a, b) => a + b, 0) / 60);
  const lista = ordem.map((s, k) => `
    <li class="flex justify-between gap-4 py-2">
      <span><span class="text-slate-400">${k + 1}.</span> ${esc(SUBTESTES[s].nome)}</span>
      <span class="tabular-nums text-slate-500">${fmtClock(tempos[s] * 1000)} · ${items[s].length} itens</span>
    </li>`).join('');

  render(`
    <div class="mx-auto max-w-2xl ${card}">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-100">Thomas GIA</p>
      <h1 class="mt-1 text-2xl font-bold">Antes de começar</h1>
      <div class="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
        <p>O GIA tem cinco subtestes cronometrados (cerca de ${totalMin} minutos de teste). Antes de cada um verá as instruções e um exemplo resolvido.</p>
        <p>Trabalhe de forma <strong>rápida</strong> e <strong>precisa</strong>: ambas contam. Ao clicar numa resposta passa logo à seguinte. <strong>Não é possível voltar atrás</strong> nem pausar o tempo.</p>
        <p>Pontuação do simulador: +1 por resposta certa, −${cfg.penalizacao_erro} por resposta errada e 0 por omissão.</p>
      </div>
      <ul class="mt-5 divide-y divide-slate-100 text-sm dark:divide-slate-800">${lista}</ul>
      ${problems.length ? `<p class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">${problems.length} item(ns) inválido(s) no banco de perguntas foram ignorados. Corra <code>node tools/validate.mjs</code> para ver os detalhes.</p>` : ''}
      ${override ? `<p class="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:bg-sky-500/10 dark:text-sky-300">Modo de teste: ${override} s por subteste. Este resultado não fica no histórico.</p>` : ''}
      <button id="go" class="${btnPrimary} mt-6 w-full sm:w-auto">Começar</button>
    </div>`);

  await click('#go');
  if (aborted) return;
  ctx.setActiveTest(true);

  const registos = {};
  const esgotados = {};
  for (let k = 0; k < ordem.length; k++) {
    const sub = ordem[k];
    await instructions(sub, k);
    if (aborted) return;
    const out = await timed(sub, k);
    if (aborted) return;
    registos[sub] = out.registos;
    esgotados[sub] = out.esgotado;
    await timeUp(sub, k, out.esgotado);
    if (aborted) return;
  }

  const resultado = scoreGia({ ordem, tempos, penalizacao: cfg.penalizacao_erro, registos, esgotados, override });
  // Test-mode runs (shortened timers) are shown but not added to the history.
  ctx.finish(saveAttempt('gia', resultado, { persist: !override }));

  // ----------------------------------------------------------- screens

  function click(selector) {
    return new Promise((resolve) => document.querySelector(selector)?.addEventListener('click', resolve, { once: true }));
  }

  function header(sub, k, right = '') {
    return `
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Teste ${k + 1} de ${ordem.length}</p>
          <h1 class="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">${esc(SUBTESTES[sub].nome)}</h1>
        </div>
        ${right}
      </div>`;
  }

  async function instructions(sub, k) {
    const def = SUBTESTES[sub];
    const ex = def.exemplo;
    render(`
      <div class="mx-auto max-w-3xl">
        ${header(sub, k)}
        <div class="${card}">
          <ol class="list-decimal space-y-2 pl-5 text-slate-600 dark:text-slate-300">
            ${def.instrucoes.map((p) => `<li>${esc(p)}</li>`).join('')}
          </ol>
          <p class="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Exemplo (resposta assinalada a verde)</p>
          <div class="gia-stage mt-2 px-4 py-8">${renderItem(sub, ex, { mode: 'example' })}</div>
          <p class="mt-3 text-sm text-slate-600 dark:text-slate-400">${esc(explain(sub, ex))}</p>
          <div class="mt-6 flex flex-wrap items-center gap-4">
            <button id="go" class="${btnPrimary}">Começar (${fmtClock(tempos[sub] * 1000)})</button>
            <span class="text-sm text-slate-500">O tempo começa a contar assim que clicar.</span>
          </div>
        </div>
      </div>`);
    await click('#go');
  }

  function timed(sub, k) {
    return new Promise((resolve) => {
      const pool = shuffle(items[sub]);
      const out = [];
      let idx = 0;
      let current = null;
      let fase = null;
      let shownAt = 0;
      let locked = false;
      let ended = false;

      const root = render(`
        <div class="mx-auto max-w-3xl">
          ${header(sub, k, `
            <div class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-slate-900" aria-label="Tempo restante">
              <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>
              <span id="clock" class="text-xl font-semibold tabular-nums">${fmtClock(tempos[sub] * 1000)}</span>
            </div>`)}
          <div id="stage" class="gia-stage flex min-h-[22rem] flex-col justify-center px-4 py-10 sm:px-8"></div>
        </div>`);
      const stage = root.querySelector('#stage');
      const clock = root.querySelector('#clock');

      function paint() {
        stage.innerHTML = `<div class="fade-in">${renderItem(sub, current.item, { mode: 'test', ordem: current.ordem, fase })}</div>`;
      }

      function present() {
        if (idx >= pool.length) return end('esgotado');
        current = prepare(sub, pool[idx++]);
        fase = sub === 'raciocinio' ? 'premissa' : null;
        shownAt = performance.now();
        locked = false;
        paint();
      }

      function answer(i) {
        if (locked || ended) return;
        locked = true;
        const value = optionsFor(sub, current.item, current.ordem)[i];
        out.push({
          id: current.item.id,
          item: current.item,
          ordem: current.ordem,
          resposta: value,
          correta: isCorrect(current.item, value),
          rt: Math.round(performance.now() - shownAt),
        });
        current = null;
        setTimeout(present, 60); // auto-advance well within the 150 ms budget
      }

      function end(reason) {
        if (ended) return;
        ended = true;
        timer?.stop();
        stage.removeEventListener('click', onClick);
        // The item on screen when time runs out is an omission (no penalty).
        if (reason === 'tempo' && current) {
          out.push({ id: current.item.id, item: current.item, ordem: current.ordem, resposta: null, correta: false, rt: null });
        }
        resolve({ registos: out, esgotado: reason === 'esgotado' });
      }

      function onClick(e) {
        if (fase === 'premissa' && e.target.closest('[data-reveal]')) {
          fase = 'pergunta';
          paint();
          return;
        }
        const btn = e.target.closest('[data-i]');
        if (btn) answer(Number(btn.dataset.i));
      }

      stage.addEventListener('click', onClick);
      timer = countdown(tempos[sub], {
        onTick: (ms) => {
          clock.textContent = fmtClock(ms);
          clock.classList.toggle('text-red-600', ms <= 15000);
        },
        onEnd: () => end('tempo'),
      });
      present();
    });
  }

  async function timeUp(sub, k, esgotado) {
    const last = k === ordem.length - 1;
    render(`
      <div class="mx-auto max-w-xl ${card} text-center">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">${esc(SUBTESTES[sub].nome)}</p>
        <h1 class="mt-2 text-2xl font-bold">${esgotado ? 'Respondeu a todas as perguntas disponíveis' : 'Tempo esgotado'}</h1>
        <p class="mt-3 text-slate-600 dark:text-slate-400">${last ? 'Concluiu o último subteste. Veja agora os seus resultados.' : `A seguir: <strong>${esc(SUBTESTES[ordem[k + 1]].nome)}</strong>.`}</p>
        ${esgotado ? '<p class="mt-2 text-xs text-slate-500">O banco de perguntas deste subteste é pequeno. Pode alargá-lo seguindo docs/gerar-perguntas-gia.md.</p>' : ''}
        <button id="go" class="${btnPrimary} mt-6">${last ? 'Ver resultados' : 'Continuar'}</button>
      </div>`);
    await click('#go');
  }
}
