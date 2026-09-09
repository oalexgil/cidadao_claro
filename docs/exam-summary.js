const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const norm = (value) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const uniq = (items) => [...new Set(items.filter(Boolean))];

function sectionBetween(text, startPattern, endPattern) {
  const source = String(text || '');
  const start = source.search(startPattern);
  if (start < 0) return '';
  const tail = source.slice(start);
  const end = tail.slice(1).search(endPattern);
  return end >= 0 ? tail.slice(0, end + 1) : tail;
}

function subjectsFrom(section) {
  const re = /(Língua Portuguesa|Raciocínio Lógico Quantitativo|Raciocínio Lógico|Geografia|Conhecimentos Técnicos|Conhecimentos Específicos|Informática|Atualidades|Legislação)\s*[:\-]?\s*(\d{1,3})\b/gi;
  const items = [];
  for (const match of String(section || '').matchAll(re)) items.push(`${clean(match[1])}: ${match[2]} questões`);
  return uniq(items);
}

function compact(items) {
  return items.join(' · ');
}

export function extractExamSummary(text, roleHint = '') {
  const source = clean(text);
  const item10 = sectionBetween(source, /\b10\.\s*(?:DA\s+)?PROVA\s+OBJETIVA\b/i, /\b11\.\s+/i) || source;
  const n = norm(item10);
  const out = [];
  if (/prova objetiva/.test(n)) out.push('Prova objetiva — eliminatória e classificatória');

  const duration = source.match(/Prova Objetiva ter[aá]\s+a\s+dura[cç][aã]o\s+de\s+(\d{1,2})\s*\([^)]*\)\s*horas/i);
  if (duration) out.push(`Duração: ${Number(duration[1])} horas`);

  const n10 = norm(item10);
  const t1Start = n10.indexOf('tabela 10.1');
  const t2Start = n10.indexOf('tabela 10.2');
  const t2End = n10.indexOf('10.2 os conteudos');
  const table1 = t1Start >= 0 ? item10.slice(t1Start, t2Start > t1Start ? t2Start : undefined) : '';
  const table2 = t2Start >= 0 ? item10.slice(t2Start, t2End > t2Start ? t2End : undefined) : '';

  const acq = subjectsFrom(table1 || item10).filter((item) => !/Conhecimentos Específicos/i.test(item));
  const analyst = subjectsFrom(table2 || item10).filter((item) => !/Geografia|Conhecimentos Técnicos/i.test(item));
  const role = norm(roleHint);

  if (role.includes('analista')) {
    if (analyst.length) out.push(`Analista Censitário — ${compact(analyst)}`);
    out.push('Analista Censitário — prova no período da tarde');
    const pass = source.match(/Analista Censit[aá]rio[\s\S]{0,1400}?m[ií]nimo,?\s*(\d{1,3})%[\s\S]{0,500}?m[ií]nimo,?\s*1\s*\(uma\)\s*quest[aã]o de cada disciplina/i);
    if (pass) out.push(`Aprovação (Analista): mínimo de ${pass[1]}% do total e 1 questão em cada disciplina`);
  } else if (role.includes('agente')) {
    if (acq.length) out.push(`Agente Censitário de Qualidade — ${compact(acq)}`);
    out.push('Agente Censitário de Qualidade — prova no período da manhã');
    const pass = source.match(/Agente Censit[aá]rio[\s\S]{0,1400}?m[ií]nimo,?\s*(\d{1,3})%[\s\S]{0,500}?m[ií]nimo,?\s*1\s*\(uma\)\s*quest[aã]o de cada disciplina/i);
    if (pass) out.push(`Aprovação (Agente): mínimo de ${pass[1]}% do total e 1 questão em cada disciplina`);
  } else {
    if (acq.length) out.push(`ACQ — ${compact(acq)}`);
    if (analyst.length) out.push(`Analista — ${compact(analyst)}`);
    if (/periodo matutino.*agente censitario/s.test(norm(source))) out.push('ACQ: prova pela manhã · Analista: prova à tarde');
  }

  return uniq(out).slice(0, 9);
}
