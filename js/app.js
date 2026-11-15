// Entry point: hash router, home screen and history screen.

import { render, esc, setTestMode, fmtDate, pageHeader, btnPrimary, btnSecondary, card } from './lib/dom.js';
import { destroyCharts, makeChart, theme } from './lib/charts.js';
import { listAttempts, lastAttempt, getAttempt, clearHistory } from './store.js';
import * as gia from './engines/gia.js';
import * as ppa from './engines/ppa.js';
import * as hpti from './engines/hpti.js';
import * as giaResults from './results/gia.js';
import * as ppaResults from './results/ppa.js';
import * as hptiResults from './results/hpti.js';

const RESULTS = { gia: giaResults, ppa: ppaResults, hpti: hptiResults };

const TESTS = [
  {
    key: 'gia',
    nome: 'Thomas GIA',
    titulo: 'Avaliação de Inteligência Geral',
    descricao: 'Cinco subtestes cronometrados: raciocínio, velocidade percetiva, precisão numérica, significado das palavras e orientação espacial.',
    duracao: '≈ 20 min',
    engine: gia,
  },
  {
    key: 'ppa',
    nome: 'Thomas PPA',
    titulo: 'Análise de Perfil Pessoal (DISC)',
    descricao: '24 grupos de 4 adjetivos. Em cada um escolhe o que MAIS e o que MENOS o descreve no trabalho.',
    duracao: '≈ 8 min',
    engine: ppa,
  },
  {
    key: 'hpti',
    nome: 'Thomas HPTI',
    titulo: 'Indicador de Traços de Alto Potencial',
    descricao: '30 afirmações numa escala de 1 a 7 que avaliam seis traços de personalidade ligados à liderança.',
    duracao: '≈ 5 min',
    engine: hpti,
  },
];

// ---------------------------------------------------------------- routing

let cleanups = [];
let activeTest = false;
let currentHash = '';
let suppressNext = false;

function setActiveTest(on) {
  activeTest = on;
  setTestMode(on);
}

window.addEventListener('beforeunload', (e) => {
  if (activeTest) {
    e.preventDefault();
    e.returnValue = '';
  }
});

window.addEventListener('hashchange', () => {
  if (suppressNext) {
    suppressNext = false;
    return;
  }
  if (activeTest && !confirm('Sair do teste? As respostas dadas até agora serão perdidas.')) {
    suppressNext = true;
    location.hash = currentHash;
    return;
  }
  route();
});

function runCleanups() {
  for (const fn of cleanups.splice(0)) {
    try { fn(); } catch (e) { console.error(e); }
  }
  destroyCharts();
}

function makeContext(params) {
  return {
    params,
    onCleanup: (fn) => cleanups.push(fn),
    setActiveTest,
    /** Called by an engine when the attempt is saved: leave test mode and show results. */
    finish(attempt) {
      setActiveTest(false);
      location.hash = `#/resultados/${attempt.id}`;
    },
  };
}

async function route() {
  runCleanups();
  setActiveTest(false);
  currentHash = location.hash || '#/';
  const [path, query] = currentHash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query || '');
  const ctx = makeContext(params);

  try {
    const test = TESTS.find((t) => path === `/${t.key}`);
    if (test) return await test.engine.start(ctx);

    const m = path.match(/^\/resultados\/(.+)$/);
    if (m) return showResult(decodeURIComponent(m[1]), ctx);

    if (path === '/historico') return showHistory();
    return showHome();
  } catch (err) {
    console.error(err);
    setActiveTest(false);
    render(`
      <div class="${card}">
        <h1 class="text-lg font-semibold text-red-700 dark:text-red-400">Ocorreu um erro</h1>
        <p class="mt-2 text-sm">${esc(err.message)}</p>
        <p class="mt-2 text-sm text-slate-500">Se abriu o ficheiro diretamente (file://), sirva a pasta com um servidor local, por exemplo <code>python3 -m http.server</code>.</p>
        <a href="#/" class="${btnSecondary} mt-4">Voltar ao início</a>
      </div>`);
  }
}

// ---------------------------------------------------------------- screens

function showHome() {
  const cards = TESTS.map((t) => {
    const last = lastAttempt(t.key);
    const lastHtml = last
      ? `<a href="#/resultados/${esc(last.id)}" class="mt-4 block rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800">
           <span class="block text-xs uppercase tracking-wide text-slate-400">Última tentativa · ${esc(fmtDate(last.data))}</span>
           ${esc(RESULTS[t.key].resumo(last.resultado))}
         </a>`
      : `<p class="mt-4 text-sm text-slate-400">Ainda sem tentativas.</p>`;
    return `
      <article class="${card} flex flex-col">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-100">${esc(t.nome)}</p>
            <h2 class="mt-1 text-lg font-semibold text-slate-900 dark:text-white">${esc(t.titulo)}</h2>
          </div>
          <span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">${esc(t.duracao)}</span>
        </div>
        <p class="mt-3 flex-1 text-sm text-slate-600 dark:text-slate-400">${esc(t.descricao)}</p>
        ${lastHtml}
        <a href="#/${t.key}" class="${btnPrimary} mt-4">Iniciar treino</a>
      </article>`;
  }).join('');

  render(`
    ${pageHeader('Treino de testes psicométricos', 'Pratique os três testes Thomas num formato próximo do real. Os resultados ficam apenas neste navegador.')}
    <div class="grid gap-5 md:grid-cols-3">${cards}</div>
    <div class="mt-8 grid gap-4 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-3">
      <p><strong class="text-slate-800 dark:text-slate-200">Ambiente calmo.</strong> Faça os testes sem interrupções. No GIA não é possível voltar atrás nem pausar.</p>
      <p><strong class="text-slate-800 dark:text-slate-200">Rato ou toque.</strong> Tal como no teste real, responde-se apenas clicando nas opções.</p>
      <p><strong class="text-slate-800 dark:text-slate-200">Seja espontâneo.</strong> No PPA e no HPTI não há respostas certas; responda como se comporta no trabalho.</p>
    </div>`);
}

function showResult(id, ctx) {
  const attempt = getAttempt(id);
  if (!attempt) {
    render(`
      <div class="${card}">
        <p>Não foi encontrada esta tentativa. O histórico pode ter sido limpo.</p>
        <a href="#/" class="${btnSecondary} mt-4">Voltar ao início</a>
      </div>`);
    return;
  }
  return RESULTS[attempt.teste].show(attempt, ctx);
}

function showHistory() {
  const attempts = listAttempts();
  const nome = Object.fromEntries(TESTS.map((t) => [t.key, t.nome]));

  const rows = attempts.map((a) => `
    <tr class="border-t border-slate-100 dark:border-slate-800">
      <td class="py-2 pr-3 sm:whitespace-nowrap">${esc(fmtDate(a.data))}</td>
      <td class="py-2 pr-3 font-medium">${esc(nome[a.teste] || a.teste)}</td>
      <td class="py-2 pr-3 text-slate-600 dark:text-slate-400">${esc(RESULTS[a.teste]?.resumo(a.resultado) || '')}</td>
      <td class="whitespace-nowrap py-2 pl-1 text-right"><a class="font-medium text-brand-600 hover:underline dark:text-brand-100" href="#/resultados/${esc(a.id)}">Ver</a></td>
    </tr>`).join('');

  const giaRuns = attempts.filter((a) => a.teste === 'gia').reverse();

  const root = render(`
    ${pageHeader('Histórico', 'Tentativas guardadas neste navegador.')}
    ${giaRuns.length >= 2 ? `
      <section class="${card} mb-6">
        <h2 class="font-semibold">Evolução no GIA</h2>
        <div class="mt-3 h-64"><canvas id="gia-trend" aria-label="Evolução da pontuação no GIA"></canvas></div>
      </section>` : ''}
    <section class="${card}">
      ${attempts.length ? `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs uppercase tracking-wide text-slate-400"><tr><th class="pb-2 pr-3">Data</th><th class="pb-2 pr-3">Teste</th><th class="pb-2 pr-3">Resultado</th><th class="pb-2"></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <button id="clear" class="${btnSecondary} mt-5 text-sm">Limpar histórico</button>`
      : `<p class="text-slate-500">Ainda não há tentativas. <a href="#/" class="text-brand-600 underline dark:text-brand-100">Escolha um teste</a> para começar.</p>`}
    </section>`);

  root.querySelector('#clear')?.addEventListener('click', () => {
    if (confirm('Apagar todas as tentativas guardadas? Esta ação não pode ser desfeita.')) {
      clearHistory();
      showHistory();
    }
  });

  if (giaRuns.length >= 2) {
    const t = theme();
    makeChart(root.querySelector('#gia-trend'), {
      type: 'line',
      data: {
        labels: giaRuns.map((a) => new Date(a.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })),
        datasets: [
          { label: 'Pontuação', data: giaRuns.map((a) => a.resultado.total.pontuacao), borderColor: t.brand, backgroundColor: t.brand, tension: 0.2 },
          { label: 'Precisão (%)', data: giaRuns.map((a) => a.resultado.total.precisao), borderColor: t.good, backgroundColor: t.good, tension: 0.2, yAxisID: 'y1' },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Pontuação' } },
          y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: 'Precisão %' } },
        },
      },
    });
  }
}

route();
