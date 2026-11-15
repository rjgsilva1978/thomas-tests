// GIA subtest definitions, instructions, worked examples and item renderers.
// Renderers are shared by the timed test, the instruction examples and the mistake review.

import { esc } from '../lib/dom.js';
import { shuffle } from '../lib/shuffle.js';
import { numericAnswer } from '../lib/validate.js';

export const SUBTESTES = {
  raciocinio: {
    nome: 'Raciocínio',
    instrucoes: [
      'Cada questão compara duas pessoas: quem é mais pesado ou mais leve, mais forte ou mais fraco, e assim por diante.',
      'Primeiro aparece apenas a afirmação. Leia-a com atenção e, quando estiver pronto(a), clique sobre ela. A afirmação desaparece e surge a pergunta com dois nomes.',
      'Clique no nome que responde corretamente. Atenção às negações e às perguntas invertidas: “mais rápido” pode ser seguido de “Quem é mais lento?”.',
    ],
    exemplo: {
      premissa: 'A Joana é mais alta do que a Marta.',
      pergunta: 'Quem é mais baixa?',
      opcoes: ['Joana', 'Marta'],
      resposta_correta: 'Marta',
      explicacao: 'Se a Joana é mais alta, a Marta é a mais baixa.',
    },
  },
  velocidade_percetiva: {
    nome: 'Velocidade Percetiva',
    instrucoes: [
      'Vai ver quatro pares de letras, uma linha por cima da outra. Cada coluna é um par.',
      'Conte quantos pares têm a mesma letra. Uma maiúscula e a sua minúscula contam como iguais (por exemplo, F e f).',
      'Clique no número de pares iguais, de 0 a 4. A linha de maiúsculas pode aparecer em cima ou em baixo.',
    ],
    exemplo: {
      pares: [['B', 'b'], ['H', 'n'], ['T', 't'], ['L', 'l']],
      maiusculas_em_cima: true,
      resposta_correta: 3,
    },
  },
  numerica: {
    nome: 'Precisão e Velocidade Numérica',
    instrucoes: [
      'Vai ver três números. Identifique mentalmente o maior e o menor.',
      'Depois decida qual deles, o maior ou o menor, está mais afastado do número que sobra (o do meio).',
      'Clique nesse número.',
    ],
    exemplo: { numeros: [4, 2, 8], resposta_correta: 8 },
  },
  palavras: {
    nome: 'Significado das Palavras',
    instrucoes: [
      'Vai ver três palavras. Duas estão relacionadas: têm o mesmo significado ou significados opostos.',
      'A terceira não tem relação com nenhuma das outras duas.',
      'Clique na palavra que não pertence ao grupo.',
    ],
    exemplo: {
      palavras: ['alto', 'baixo', 'cenoura'],
      resposta_correta: 'cenoura',
      explicacao: '“Alto” e “baixo” são opostos; “cenoura” não tem relação com nenhuma delas.',
    },
  },
  espacial: {
    nome: 'Orientação Espacial',
    instrucoes: [
      'Vai ver duas caixas, cada uma com dois símbolos “R”: um em cima e outro em baixo.',
      'Numa caixa, os símbolos são iguais se for possível rodar o de baixo até coincidir com o de cima. Se um deles for uma imagem em espelho (Я), não são iguais, por mais que o rode.',
      'Clique no número de caixas com símbolos iguais: 0, 1 ou 2.',
    ],
    exemplo: {
      caixa1: { topo: { rot: 0, espelho: false }, base: { rot: 90, espelho: false } },
      caixa2: { topo: { rot: 180, espelho: false }, base: { rot: 90, espelho: true } },
      resposta_correta: 1,
    },
  },
};

/** Per-attempt display state for an item: shuffled order of the options where order matters. */
export function prepare(sub, item) {
  if (sub === 'raciocinio') return { item, ordem: shuffle(item.opcoes) };
  if (sub === 'numerica') return { item, ordem: shuffle(item.numeros) };
  if (sub === 'palavras') return { item, ordem: shuffle(item.palavras) };
  return { item, ordem: null };
}

/** The list of answer values, in the order the buttons are shown. */
export function optionsFor(sub, item, ordem) {
  switch (sub) {
    case 'raciocinio': return ordem || item.opcoes;
    case 'numerica': return ordem || item.numeros;
    case 'palavras': return ordem || item.palavras;
    case 'velocidade_percetiva': return [0, 1, 2, 3, 4];
    case 'espacial': return [0, 1, 2];
    default: return [];
  }
}

export const isCorrect = (item, value) => String(value) === String(item.resposta_correta);

function glyph({ rot, espelho }) {
  const t = `rotate(${Number(rot) || 0}deg)${espelho ? ' scaleX(-1)' : ''}`;
  return `<span class="glyph-r" style="transform:${t}" aria-hidden="true">R</span>`;
}

/**
 * Render one item.
 * opts.mode: 'test' (clickable), 'example' (correct answer marked) or 'review' (user's answer marked).
 * opts.fase: for raciocínio in test mode, 'premissa' or 'pergunta'.
 */
export function renderItem(sub, item, { mode = 'test', ordem = null, fase = null, resposta } = {}) {
  const interactive = mode === 'test';
  const opts = optionsFor(sub, item, ordem);

  const buttons = (cls) => opts.map((v, i) => {
    let mark = '';
    if (!interactive) {
      if (isCorrect(item, v)) mark = 'mark-correct';
      else if (mode === 'review' && resposta !== null && resposta !== undefined && String(resposta) === String(v)) mark = 'mark-wrong';
    }
    return `<button type="button" class="gia-btn ${cls} ${mark}" ${interactive ? `data-i="${i}"` : 'tabindex="-1"'}>${esc(v)}</button>`;
  }).join('');

  switch (sub) {
    case 'raciocinio': {
      if (interactive && fase === 'premissa') {
        return `
          <button type="button" data-reveal class="block w-full cursor-pointer text-left">
            <div class="mx-auto max-w-xl rounded-lg bg-white px-6 py-8 text-center text-xl font-bold text-[#1b2a6b] shadow-sm sm:text-2xl">${esc(item.premissa)}</div>
            <p class="mt-6 text-center text-sm text-[#1b2a6b]/80 dark:text-indigo-200">Clique quando estiver pronto(a) para ver a pergunta.</p>
          </button>`;
      }
      const premissa = interactive ? '' : `<p class="mb-3 text-center text-sm text-[#1b2a6b]/80 dark:text-indigo-200">“${esc(item.premissa)}”</p>`;
      return `
        ${premissa}
        <div class="mx-auto max-w-xl rounded-lg bg-white px-6 py-6 text-center text-xl font-bold text-[#1b2a6b] shadow-sm sm:text-2xl">${esc(item.pergunta)}</div>
        <div class="mt-8 flex justify-center gap-4">${buttons('min-w-[8rem] px-6 py-4 text-xl sm:min-w-[10rem] sm:text-2xl')}</div>`;
    }
    case 'velocidade_percetiva': {
      const up = item.maiusculas_em_cima !== false;
      const top = item.pares.map((p) => (up ? p[0] : p[1]));
      const bottom = item.pares.map((p) => (up ? p[1] : p[0]));
      const row = (letters) => `<div class="letter-row grid grid-cols-4 gap-6 text-center text-4xl font-medium text-[#1b2a6b] dark:text-indigo-100 sm:gap-10 sm:text-5xl">${letters.map((l) => `<span>${esc(l)}</span>`).join('')}</div>`;
      return `
        <div class="mx-auto w-fit space-y-2">${row(top)}${row(bottom)}</div>
        <div class="mt-10 flex justify-center gap-2 sm:gap-3">${buttons('h-14 w-14 text-2xl sm:h-16 sm:w-16')}</div>`;
    }
    case 'numerica':
      return `<div class="flex justify-center gap-3 py-6 sm:gap-5">${buttons('min-w-[5.5rem] px-4 py-5 text-3xl sm:min-w-[8rem] sm:text-4xl')}</div>`;
    case 'palavras':
      return `<div class="flex flex-wrap justify-center gap-3 py-6 sm:gap-4">${buttons('min-w-[7rem] px-5 py-4 text-lg sm:min-w-[9rem] sm:text-xl')}</div>`;
    case 'espacial': {
      const box = (c) => `<div class="glyph-box">${glyph(c.topo)}${glyph(c.base)}</div>`;
      return `
        <div class="flex justify-center gap-4 sm:gap-6">${box(item.caixa1)}${box(item.caixa2)}</div>
        <div class="mt-8 flex justify-center gap-3">${buttons('h-14 w-14 text-2xl sm:h-16 sm:w-16')}</div>`;
    }
    default:
      return `<p>Subteste desconhecido.</p>`;
  }
}

/** Plain-language explanation of the correct answer (used in examples and mistake review). */
export function explain(sub, item) {
  switch (sub) {
    case 'velocidade_percetiva': {
      const iguais = item.pares.filter(([a, b]) => a.toLowerCase() === b.toLowerCase()).map(([a, b]) => `${a}–${b}`);
      return iguais.length
        ? `Pares iguais: ${iguais.join(', ')}. Resposta: ${iguais.length}.`
        : 'Nenhum par tem a mesma letra. Resposta: 0.';
    }
    case 'numerica': {
      const [lo, mid, hi] = [...item.numeros].sort((a, b) => a - b);
      const ans = numericAnswer(item.numeros);
      return `O número do meio é ${mid}. O menor (${lo}) está a ${mid - lo} de distância e o maior (${hi}) está a ${hi - mid}. O mais afastado é ${ans}.`;
    }
    case 'espacial': {
      const d = (c, n) => `caixa ${n}: ${c.topo.espelho === c.base.espelho ? 'iguais (apenas rodados)' : 'diferentes (um está em espelho)'}`;
      return `${d(item.caixa1, 1)}; ${d(item.caixa2, 2)}. Resposta: ${item.resposta_correta}.`;
    }
    default:
      return item.explicacao || '';
  }
}
