// HPTI scoring and results dashboard.

import { render, esc, fmtDate, pageHeader, btnPrimary, btnSecondary, card } from '../lib/dom.js';
import { loadJSON, PATHS } from '../lib/data.js';

export const ZONAS = {
  baixo: { nome: 'Baixo', cor: '#f59e0b', tint: 'rgba(245,158,11,0.16)', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  moderado: { nome: 'Moderado', cor: '#eab308', tint: 'rgba(234,179,8,0.10)', chip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
  otimo: { nome: 'Ótimo', cor: '#16a34a', tint: 'rgba(22,163,74,0.14)', chip: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
  excessivo: { nome: 'Excessivo', cor: '#dc2626', tint: 'rgba(220,38,38,0.14)', chip: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
};

/**
 * Sum per trait: positive items score v, reverse-keyed items score 8 − v.
 * @param respostas [{ id, valor }]
 */
export function scoreHpti(data, respostas) {
  const byId = Object.fromEntries(data.afirmacoes.map((a) => [a.id, a]));
  const tracos = {};
  for (const [key, t] of Object.entries(data.tracos)) {
    tracos[key] = { nome: t.nome, pontos: 0, n: 0 };
  }
  for (const { id, valor } of respostas) {
    const a = byId[id];
    if (!a || valor == null) continue;
    const pts = a.polaridade === '-' ? 8 - valor : valor;
    tracos[a.traco].pontos += pts;
    tracos[a.traco].n += 1;
  }
  for (const [key, t] of Object.entries(tracos)) {
    const banda = data.tracos[key].bandas.find((b) => t.pontos >= b.min && t.pontos <= b.max);
    t.zona = banda?.zona ?? null;
    t.texto = banda?.texto ?? '';
    t.min = t.n;
    t.max = t.n * 7;
  }
  return { tracos, respostas };
}

export function resumo(resultado) {
  const list = Object.values(resultado.tracos);
  const otimo = list.filter((t) => t.zona === 'otimo').length;
  const exc = list.filter((t) => t.zona === 'excessivo').length;
  return `${otimo} de ${list.length} traços na zona ótima${exc ? ` · ${exc} excessivo${exc > 1 ? 's' : ''}` : ''}`;
}

export async function show(attempt) {
  const data = await loadJSON(PATHS.hpti);
  const { tracos } = attempt.resultado;

  const rows = Object.entries(tracos).map(([key, t]) => {
    const bands = data.tracos[key].bandas;
    const span = t.max - t.min;
    const pos = (v) => ((v - t.min) / span) * 100;
    const shade = bands.map((b) => {
      const z = ZONAS[b.zona];
      const left = pos(b.min - 0.5 < t.min ? t.min : b.min - 0.5);
      const right = pos(b.max + 0.5 > t.max ? t.max : b.max + 0.5);
      return `<div class="absolute inset-y-0" style="left:${left}%;width:${right - left}%;background:${z.tint}" title="${esc(z.nome)}: ${b.min}–${b.max}"></div>`;
    }).join('');
    const z = ZONAS[t.zona] || ZONAS.moderado;
    const w = Math.max(2, pos(t.pontos));

    return `
      <div class="py-4 first:pt-0 last:pb-0">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="font-semibold text-slate-900 dark:text-white">${esc(t.nome)}</h3>
          <div class="flex items-center gap-2 text-sm">
            <span class="font-semibold tabular-nums">${t.pontos} <span class="font-normal text-slate-400">/ ${t.max}</span></span>
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold ${z.chip}">${esc(z.nome)}</span>
          </div>
        </div>
        <div class="relative mt-2 h-7 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800" role="img" aria-label="${esc(t.nome)}: ${t.pontos} de ${t.max}, zona ${esc(z.nome)}">
          ${shade}
          <div class="absolute inset-y-1 left-0 rounded-r-md" style="width:${w}%;background:${z.cor}"></div>
        </div>
        <div class="relative mt-1 h-4 text-[11px] text-slate-400 tabular-nums" aria-hidden="true">
          ${bands.map((b) => `<span class="absolute" style="left:${pos(Math.max(b.min - 0.5, t.min))}%">${b.min}–${b.max}</span>`).join('')}
        </div>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">${esc(t.texto)}</p>
      </div>`;
  }).join('');

  const mins = Math.round((attempt.resultado.duracao_ms || 0) / 60000);

  render(`
    ${pageHeader('Resultados HPTI', `${esc(fmtDate(attempt.data))} · ${mins || '<1'} min`)}
    <div class="mb-4 flex flex-wrap gap-3 text-xs">
      ${Object.entries(ZONAS).map(([k, z]) => {
        const b = Object.values(data.tracos)[0].bandas.find((x) => x.zona === k);
        return `<span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm" style="background:${z.cor}"></span>${esc(z.nome)}${b ? ` <span class="text-slate-400">(${b.min}–${b.max})</span>` : ''}</span>`;
      }).join('')}
    </div>
    <section class="${card} divide-y divide-slate-100 dark:divide-slate-800">${rows}</section>
    <section class="${card} mt-6 text-sm text-slate-600 dark:text-slate-400">
      <h2 class="font-semibold text-slate-900 dark:text-white">Como ler este relatório</h2>
      <p class="mt-2">No HPTI, mais não é sempre melhor. A zona <strong>Ótima</strong> indica um nível forte mas equilibrado do traço. Pontuações <strong>excessivas</strong> podem tornar-se descarriladoras (por exemplo, microgestão ou imprudência). As afirmações formuladas pela negativa são pontuadas de forma inversa (8 − resposta).</p>
      <p class="mt-2">Os limites das zonas são uma convenção deste simulador e não as normas oficiais.</p>
    </section>
    <div class="mt-6 flex flex-wrap gap-3">
      <a href="#/hpti" class="${btnPrimary}">Repetir teste</a>
      <a href="#/" class="${btnSecondary}">Início</a>
    </div>`);
}
