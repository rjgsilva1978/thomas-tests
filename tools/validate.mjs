#!/usr/bin/env node
// Validates every data file used by the simulator.
// Usage: node tools/validate.mjs            (all files)
//        node tools/validate.mjs caminho.json   (an extra GIA bank, e.g. one generated with AI)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateGia, validatePpa, validateHpti, GIA_SUBTESTES } from '../js/lib/validate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function load(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`✗ ${path}: JSON inválido ou ficheiro em falta (${e.message})`);
    process.exitCode = 1;
    return null;
  }
}

function report(label, problems, extra = '') {
  if (!problems.length) {
    console.log(`✓ ${label}${extra}`);
    return;
  }
  process.exitCode = 1;
  console.log(`✗ ${label}: ${problems.length} problema(s)`);
  for (const p of problems.slice(0, 200)) console.log(`   [${p.onde}] ${p.id}: ${p.erro}`);
  if (problems.length > 200) console.log(`   … e mais ${problems.length - 200}`);
}

const extraBank = process.argv[2];
const giaPath = extraBank || join(root, 'data/gia/perguntas.json');
const gia = load(giaPath);
if (gia) {
  const counts = GIA_SUBTESTES.map((s) => `${s}: ${gia[s]?.length ?? 0}`).join(', ');
  // An explicit file may contain only the new items of one subtest.
  report(`GIA (${giaPath})`, validateGia(gia, { parcial: !!extraBank }), `\n   ${counts}`);
}

if (!extraBank) {
  const ppa = load(join(root, 'data/ppa/tetrades.json'));
  if (ppa) report('PPA (data/ppa/tetrades.json)', validatePpa(ppa));
  const hpti = load(join(root, 'data/hpti/afirmacoes.json'));
  if (hpti) report('HPTI (data/hpti/afirmacoes.json)', validateHpti(hpti));
  const config = load(join(root, 'data/config.json'));
  if (config) {
    const missing = GIA_SUBTESTES.filter((s) => !(config.gia?.tempos_seg?.[s] > 0));
    report('Config (data/config.json)', missing.map((s) => ({ onde: 'config', id: s, erro: 'falta tempo em segundos' })));
  }
}
