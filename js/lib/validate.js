// Data validators shared by the browser app and the Node CLI (tools/validate.mjs).
// Each validator returns a list of { onde, id, erro } problems; an empty list means valid.
// The GIA engine uses validateGia() to skip broken items instead of showing them.

export const GIA_SUBTESTES = ['raciocinio', 'velocidade_percetiva', 'numerica', 'palavras', 'espacial'];

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isInt = (v) => Number.isInteger(v);

/** Correct answer for a numeric item: the extreme farthest from the median, or null on a tie. */
export function numericAnswer(numeros) {
  const [lo, mid, hi] = [...numeros].sort((a, b) => a - b);
  const dLo = mid - lo;
  const dHi = hi - mid;
  if (dLo === dHi) return null;
  return dHi > dLo ? hi : lo;
}

/** Number of pairs whose letters are the same letter (ignoring case). */
export function perceptualAnswer(pares) {
  return pares.filter(([a, b]) => a.toLowerCase() === b.toLowerCase()).length;
}

/** Number of boxes whose top and bottom "R" match after rotation (i.e. same mirroring). */
export function spatialAnswer(item) {
  return [item.caixa1, item.caixa2].filter((c) => c.topo.espelho === c.base.espelho).length;
}

function checkItem(sub, item) {
  const errs = [];
  const err = (m) => errs.push(m);
  if (!item || typeof item !== 'object') return ['item não é um objeto'];

  switch (sub) {
    case 'raciocinio': {
      if (!isStr(item.premissa)) err('falta "premissa"');
      if (!isStr(item.pergunta)) err('falta "pergunta"');
      if (!Array.isArray(item.opcoes) || item.opcoes.length !== 2) err('"opcoes" tem de ter exatamente 2 nomes');
      else {
        if (item.opcoes[0] === item.opcoes[1]) err('as 2 opções são iguais');
        if (!item.opcoes.includes(item.resposta_correta)) err('"resposta_correta" não está nas opções');
        if (isStr(item.premissa) && !item.opcoes.every((o) => item.premissa.includes(o)))
          err('a premissa não menciona as duas pessoas das opções');
      }
      break;
    }
    case 'velocidade_percetiva': {
      if (!Array.isArray(item.pares) || item.pares.length !== 4) {
        err('"pares" tem de ter exatamente 4 pares');
        break;
      }
      for (const p of item.pares) {
        if (!Array.isArray(p) || p.length !== 2) { err('cada par tem de ser [MAIÚSCULA, minúscula]'); continue; }
        const [u, l] = p;
        if (!/^[A-Z]$/.test(u)) err(`"${u}" não é uma letra maiúscula A–Z`);
        if (!/^[a-z]$/.test(l)) err(`"${l}" não é uma letra minúscula a–z`);
        if (u === 'I' && l === 'l') err('o par I/l é ambíguo (as duas letras parecem iguais em letra sem serifa)');
      }
      if ('maiusculas_em_cima' in item && typeof item.maiusculas_em_cima !== 'boolean')
        err('"maiusculas_em_cima" tem de ser true/false');
      if (!errs.length && perceptualAnswer(item.pares) !== item.resposta_correta)
        err(`"resposta_correta" devia ser ${perceptualAnswer(item.pares)}`);
      break;
    }
    case 'numerica': {
      const n = item.numeros;
      if (!Array.isArray(n) || n.length !== 3 || !n.every(isInt)) { err('"numeros" tem de ter 3 inteiros'); break; }
      if (new Set(n).size !== 3) { err('os 3 números têm de ser diferentes'); break; }
      const ans = numericAnswer(n);
      if (ans === null) err('empate: os extremos estão à mesma distância do número do meio');
      else if (ans !== item.resposta_correta) err(`"resposta_correta" devia ser ${ans}`);
      break;
    }
    case 'palavras': {
      const w = item.palavras;
      if (!Array.isArray(w) || w.length !== 3 || !w.every(isStr)) { err('"palavras" tem de ter 3 palavras'); break; }
      if (new Set(w.map((x) => x.toLowerCase())).size !== 3) err('há palavras repetidas');
      if (!w.includes(item.resposta_correta)) err('"resposta_correta" não está nas palavras');
      break;
    }
    case 'espacial': {
      for (const k of ['caixa1', 'caixa2']) {
        const c = item[k];
        for (const pos of ['topo', 'base']) {
          const g = c?.[pos];
          if (!g || typeof g.rot !== 'number' || typeof g.espelho !== 'boolean')
            err(`${k}.${pos} tem de ser { "rot": número, "espelho": true/false }`);
        }
      }
      if (!errs.length && spatialAnswer(item) !== item.resposta_correta)
        err(`"resposta_correta" devia ser ${spatialAnswer(item)}`);
      break;
    }
    default:
      err(`subteste desconhecido "${sub}"`);
  }
  return errs;
}

/**
 * @param {object} bank
 * @param {{ parcial?: boolean }} opts  parcial: allow missing/empty sections (for a file with new items only)
 */
export function validateGia(bank, { parcial = false } = {}) {
  const problems = [];
  if (!bank || typeof bank !== 'object') return [{ onde: 'gia', id: '-', erro: 'ficheiro inválido' }];
  const unknown = Object.keys(bank).filter((k) => !GIA_SUBTESTES.includes(k));
  for (const k of unknown) problems.push({ onde: k, id: '-', erro: `secção desconhecida (válidas: ${GIA_SUBTESTES.join(', ')})` });
  for (const sub of GIA_SUBTESTES) {
    const items = bank[sub];
    if (!Array.isArray(items) || items.length === 0) {
      if (!parcial) problems.push({ onde: sub, id: '-', erro: 'secção em falta ou vazia' });
      continue;
    }
    const ids = new Set();
    items.forEach((item, i) => {
      const id = item?.id ?? `#${i + 1}`;
      if (item?.id === undefined) problems.push({ onde: sub, id, erro: 'falta "id"' });
      else if (ids.has(item.id)) problems.push({ onde: sub, id, erro: 'id duplicado' });
      ids.add(item?.id);
      for (const e of checkItem(sub, item)) problems.push({ onde: sub, id, erro: e });
    });
  }
  return problems;
}

/** Valid items of one GIA subtest (used at runtime to skip broken AI-generated items). */
export function validItems(bank, sub) {
  return (bank[sub] || []).filter((item) => checkItem(sub, item).length === 0);
}

export function validatePpa(data) {
  const problems = [];
  const qs = data?.questoes;
  if (!Array.isArray(qs)) return [{ onde: 'ppa', id: '-', erro: 'falta "questoes"' }];
  if (qs.length !== 24) problems.push({ onde: 'ppa', id: '-', erro: `devem existir 24 tétrades (há ${qs.length})` });
  const seenWords = new Map();
  const seenIds = new Set();
  for (const q of qs) {
    if (seenIds.has(q.id)) problems.push({ onde: 'ppa', id: q.id, erro: 'id duplicado' });
    seenIds.add(q.id);
    const fatores = (q.opcoes || []).map((o) => o.fator).sort().join('');
    if (fatores !== 'CDIS') problems.push({ onde: 'ppa', id: q.id, erro: `tem de ter um adjetivo de cada fator D/I/S/C (tem ${fatores || 'nenhum'})` });
    for (const o of q.opcoes || []) {
      if (!isStr(o.palavra) || !isStr(o.id_opcao)) problems.push({ onde: 'ppa', id: q.id, erro: 'opção sem "palavra" ou "id_opcao"' });
      const key = o.palavra?.toLowerCase();
      if (seenWords.has(key)) problems.push({ onde: 'ppa', id: q.id, erro: `palavra repetida "${o.palavra}" (também na tétrade ${seenWords.get(key)})` });
      seenWords.set(key, q.id);
    }
  }
  for (const f of ['D', 'I', 'S', 'C']) {
    if (!isStr(data.interpretacao?.[f]?.alto) || !isStr(data.interpretacao?.[f]?.baixo))
      problems.push({ onde: 'ppa', id: f, erro: 'falta texto de interpretação alto/baixo' });
  }
  return problems;
}

export function validateHpti(data) {
  const problems = [];
  const tracos = data?.tracos || {};
  const items = data?.afirmacoes || [];
  if (!Array.isArray(data?.escala) || data.escala.length !== 7)
    problems.push({ onde: 'hpti', id: '-', erro: '"escala" tem de ter 7 rótulos' });
  const perTrait = {};
  const ids = new Set();
  for (const a of items) {
    if (ids.has(a.id)) problems.push({ onde: 'hpti', id: a.id, erro: 'id duplicado' });
    ids.add(a.id);
    if (!tracos[a.traco]) problems.push({ onde: 'hpti', id: a.id, erro: `traço desconhecido "${a.traco}"` });
    if (a.polaridade !== '+' && a.polaridade !== '-') problems.push({ onde: 'hpti', id: a.id, erro: 'polaridade tem de ser "+" ou "-"' });
    if (!isStr(a.texto)) problems.push({ onde: 'hpti', id: a.id, erro: 'falta "texto"' });
    perTrait[a.traco] = (perTrait[a.traco] || 0) + 1;
  }
  for (const [key, t] of Object.entries(tracos)) {
    const n = perTrait[key] || 0;
    if (n === 0) { problems.push({ onde: 'hpti', id: key, erro: 'traço sem afirmações' }); continue; }
    const bands = [...(t.bandas || [])].sort((a, b) => a.min - b.min);
    if (!bands.length) { problems.push({ onde: 'hpti', id: key, erro: 'faltam "bandas"' }); continue; }
    if (bands[0].min !== n) problems.push({ onde: 'hpti', id: key, erro: `a 1.ª banda devia começar em ${n}` });
    if (bands.at(-1).max !== n * 7) problems.push({ onde: 'hpti', id: key, erro: `a última banda devia acabar em ${n * 7}` });
    for (let i = 1; i < bands.length; i++) {
      if (bands[i].min !== bands[i - 1].max + 1)
        problems.push({ onde: 'hpti', id: key, erro: `bandas com falha/sobreposição entre ${bands[i - 1].max} e ${bands[i].min}` });
    }
    for (const b of bands) if (!isStr(b.texto)) problems.push({ onde: 'hpti', id: key, erro: `banda ${b.zona} sem texto` });
  }
  const counts = new Set(Object.values(perTrait));
  if (counts.size > 1) problems.push({ onde: 'hpti', id: '-', erro: 'todos os traços devem ter o mesmo número de afirmações' });
  return problems;
}
