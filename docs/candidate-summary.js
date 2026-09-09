const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const norm = (value) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const uniq = (items) => [...new Map(items.filter(Boolean).map((item) => [norm(typeof item === 'string' ? item : JSON.stringify(item)), item])).values()];
const MONEY = 'R\\$\\s*\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})';

function lastSection(text, heading, endHeading = null) {
  const source = String(text || '');
  const matches = [...source.matchAll(heading)];
  if (!matches.length) return '';
  const start = matches[matches.length - 1].index;
  const tail = source.slice(start);
  if (!endHeading) return tail;
  const end = tail.slice(1).search(endHeading);
  return end >= 0 ? tail.slice(0, end + 1) : tail;
}

function cleanRole(value) {
  let role = clean(value)
    .replace(/^.*?N[ÚU]MERO\s+DE\s+VAGAS(?:\s*\(\d+\))?\s*/i, '')
    .replace(/^.*?REMUNERA[CÇ][AÃ]O\s*/i, '')
    .replace(/^.*?PR[ÉE][\s-]*REQUISITO(?:\s+DE\s+FORMA[CÇ][AÃ]O)?(?:\s*\(\d+\))?\s*/i, '')
    .replace(/^.*?FUN[CÇ][AÃ]O\s*/i, '')
    .trim();
  if (/agente censit[aá]rio de qualidade/i.test(role)) return 'Agente Censitário de Qualidade (ACQ)';
  if (/analista censit[aá]rio/i.test(role)) return 'Analista Censitário (AC)';
  return role.replace(/\s+/g, ' ').slice(-90).trim();
}

export function extractRoleFacts(text) {
  const source = clean(text);
  const normalized = norm(source);
  let start = normalized.search(/remuneracao\s+numero\s+de\s+vagas/);
  if (start < 0) start = normalized.search(/funcao\s+pre[\s-]*requisito/);
  const window = start >= 0 ? source.slice(start, start + 2600) : source.slice(0, 10000);
  const rowRe = /([A-ZÁÉÍÓÚÇ][A-ZÁÉÍÓÚÇ0-9 .()\/-]{4,150}?)\s+(?=(?:Ensino|Curso|Gradua[cç][aã]o|N[ií]vel|Superior|M[eé]dio|Fundamental))([\s\S]{0,260}?)\b(R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2}))\s+(\d{1,3}(?:\.\d{3})*)\b/g;
  const facts = [];
  for (const match of window.matchAll(rowRe)) {
    const role = cleanRole(match[1]);
    if (!role || /remunera[cç][aã]o|n[uú]mero de vagas/i.test(role)) continue;
    facts.push({ role, salary: clean(match[3]), vacancies: match[4] });
  }
  return uniq(facts).slice(0, 10);
}

export function extractFees(text) {
  const source = clean(text);
  const normalized = norm(source);
  const marker = normalized.indexOf('valor da taxa de inscricao sera de');
  const window = marker >= 0 ? source.slice(marker, marker + 1300) : source;
  const roleFeeRe = /[-–]?\s*([^:;]{3,120}?):\s*(R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2}))/gi;
  const fees = [];
  if (marker >= 0) {
    for (const match of window.matchAll(roleFeeRe)) {
      const role = cleanRole(match[1]);
      if (/agente censit[aá]rio|analista censit[aá]rio/i.test(role)) fees.push({ role, amount: clean(match[2]) });
    }
  }
  if (fees.length) return uniq(fees).slice(0, 8);

  const direct = [
    new RegExp(`(?:valor|taxa)\\s+(?:da\\s+)?(?:taxa\\s+)?de\\s+inscri[cç][aã]o[\\s\\S]{0,180}?(${MONEY})`, 'i'),
    new RegExp(`taxa\\s+de\\s+inscri[cç][aã]o[\\s\\S]{0,180}?no\\s+valor\\s+de\\s+(${MONEY})`, 'i'),
  ];
  for (const re of direct) {
    const match = source.match(re);
    if (match?.[1]) return [{ role: '', amount: clean(match[1]) }];
  }
  return [];
}

export function extractFee(text) {
  return extractFees(text)[0]?.amount || '';
}

export function extractVacancies(text) {
  const facts = extractRoleFacts(text);
  if (facts.length) return facts.map((item) => ({ count: item.vacancies, role: item.role }));

  const source = clean(text);
  const records = [];
  const re = /(\d{1,3}(?:\.\d{3})*)\s*(?:\([^)]*\)\s*)?vagas?\s+para\s+(?:a\s+)?fun[cç][aã]o\s+de\s+(.{3,110}?)(?=\s+e\s+\d{1,3}(?:\.\d{3})*\s*(?:\([^)]*\)\s*)?vagas?\b|[.;])/gi;
  for (const match of source.matchAll(re)) records.push({ count: match[1], role: cleanRole(match[2]) });
  if (records.length) return records.slice(0, 8);
  const totals = [...source.matchAll(/\b(\d{1,3}(?:\.\d{3})*)\s+vagas?\b/gi)].map((m) => m[1]);
  return uniq(totals).slice(0, 6).map((count) => ({ count, role: '' }));
}

export function extractSalaries(text) {
  const facts = extractRoleFacts(text);
  if (facts.length) return facts.map((item) => item.salary);
  const source = clean(text);
  const normalized = norm(source);
  const tableStart = normalized.search(/remuneracao\s+numero\s+de\s+vagas/);
  const start = tableStart >= 0 ? tableStart : 0;
  const tail = source.slice(start, start + 1600);
  const stop = norm(tail).search(/taxa de inscricao|solicitacao de isencao|requisitos para contratacao/);
  const window = stop > 0 ? tail.slice(0, stop) : tail;
  return uniq(window.match(new RegExp(MONEY, 'gi')) || []).slice(0, 8);
}

function eventLabel(context) {
  const value = norm(context);
  const rules = [
    ['Isenção da taxa', /isen[cç][aã]o/],
    ['Pagamento da taxa', /pagamento.*taxa|taxa.*pagamento/],
    ['Prova objetiva', /prova objetiva|aplica[cç][aã]o.*prova|realiza[cç][aã]o.*prova/],
    ['Gabarito', /gabarito/],
    ['Resultado', /resultado/],
    ['Recurso', /recurso/],
    ['Convocação', /convoca[cç][aã]o/],
    ['Heteroidentificação', /heteroidentifica[cç][aã]o/],
    ['Avaliação PcD', /avalia[cç][aã]o.*pcd|caracteriza[cç][aã]o.*deficiencia|pericia/],
    ['Deferimento das inscrições', /deferimento.*inscri[cç][aã]o/],
    ['Inscrições', /inscri[cç][aã]o|inscricoes/],
  ];
  for (const [label, re] of rules) if (re.test(value)) return label;
  return '';
}

export function extractImportantDates(text) {
  const source = String(text || '');
  const section = lastSection(source, /ANEXO\s+IV\s*[–-]?\s*CRONOGRAMA\s+PREVISTO/gi);
  if (!section) return [];
  const dateRe = /\b(\d{1,2}\/\d{1,2}\/20\d{2})(?:\s*(?:a|até|[-–])\s*(\d{1,2}\/\d{1,2}\/20\d{2}))?/g;
  const out = [];
  for (const match of section.matchAll(dateRe)) {
    const index = match.index || 0;
    const context = clean(section.slice(Math.max(0, index - 220), Math.min(section.length, index + 260)));
    const label = eventLabel(context);
    if (!label) continue;
    const date = match[2] ? `${match[1]} a ${match[2]}` : match[1];
    out.push({ label, date });
  }
  return uniq(out.map((item) => `${item.label}|||${item.date}`)).map((value) => {
    const [label, date] = value.split('|||');
    return { label, date };
  }).slice(0, 16);
}

export function extractStages(text, modality = '') {
  const source = String(text || '');
  const prelim = norm(source.slice(0, 14000));
  const all = norm(source);
  const stages = [];
  if (/sele[cç][aã]o[\s\S]{0,500}?prova objetiva/.test(prelim) || /\b10\.\s*(?:da\s+)?prova objetiva/.test(all)) {
    stages.push('Prova objetiva — eliminatória e classificatória');
  }
  if (/\bprova discursiva\b/.test(prelim) && /sele[cç][aã]o[\s\S]{0,700}?prova discursiva/.test(prelim)) stages.push('Prova discursiva');
  if (/\bavalia[cç][aã]o de t[ií]tulos\b/.test(prelim)) stages.push('Avaliação de títulos');
  if (/\bteste de aptid[aã]o f[ií]sica\b|\btaf\b/.test(prelim)) stages.push('Teste de aptidão física');
  if (modality === 'PPP' && /heteroidentificacao/.test(all)) stages.push('Heteroidentificação — para PPP');
  if (modality === 'PCD' && /caracterizacao da deficiencia|avaliacao.*pcd|pericia/.test(all)) stages.push('Avaliação/caracterização da deficiência — para PcD');
  return uniq(stages).slice(0, 8);
}

export function extractDocuments(text, modality = '') {
  const source = String(text || '');
  const requirements = lastSection(source, /REQUISITOS\s+PARA\s+CONTRATA[CÇ][AÃ]O/gi, /(?:\n|\s)4\.\s*DA\s+SOLICITA[CÇ][AÃ]O\s+DE\s+ISEN[CÇ][AÃ]O/gi) || source;
  const value = norm(requirements);
  const docs = [];
  if (/documento.*identidade|documento oficial.*foto|carteira de identidade/.test(value)) docs.push('Documento oficial de identificação com foto');
  if (/\bcpf\b|cadastro de pessoa fisica/.test(value)) docs.push('CPF');
  if (/diploma|certificado de conclusao|comprovante.*escolaridade|nivel de escolaridade/.test(value)) docs.push('Comprovante da escolaridade exigida para a função');
  if (/declaracao de proprio punho/.test(value)) docs.push('Declaração de próprio punho exigida no edital');
  if (/documentos originais|copias autenticadas/.test(value)) docs.push('Originais ou cópias autenticadas para comprovar os requisitos de contratação');

  const all = norm(source);
  if (modality === 'PCD' && /laudo|documento.*deficiencia/.test(all)) docs.push('Laudo/documentação da deficiência, conforme o capítulo PcD');
  if (modality === 'PPP' && /autodeclaracao/.test(all)) docs.push('Autodeclaração para concorrer às vagas PPP');
  if (modality === 'INDÍGENAS' && /indigena/.test(all)) docs.push('Documentação específica para pessoa indígena, conforme o capítulo de reserva');
  if (modality === 'QUILOMBOLAS' && /quilombola/.test(all)) docs.push('Documentação específica para pessoa quilombola, conforme o capítulo de reserva');
  return uniq(docs).slice(0, 8);
}

function proofSection(text) {
  const source = String(text || '');
  return lastSection(source, /(?:10\.\s*(?:DA\s+)?|DA\s+)PROVA\s+OBJETIVA/gi, /(?:\n|\s)12\.\s+/g) || source;
}

function subjectsFrom(section) {
  const subjectRe = /(Língua Portuguesa|Raciocínio Lógico Quantitativo|Raciocínio Lógico|Geografia|Conhecimentos Técnicos|Conhecimentos Específicos|Informática|Atualidades|Legislação)\s*[:\-]?\s*(\d{1,3})\b/gi;
  const subjects = [];
  for (const match of section.matchAll(subjectRe)) subjects.push({ name: clean(match[1]), questions: match[2] });
  return uniq(subjects);
}

function compactSubjects(subjects) {
  return subjects.map((item) => `${item.name}: ${item.questions}`).join(' · ');
}

export function extractExam(text, roleHint = '') {
  const source = clean(text);
  const section = clean(proofSection(text));
  const normalized = norm(section);
  const items = [];
  if (/prova objetiva/.test(normalized) || /prova objetiva/.test(norm(source))) items.push('Prova objetiva — eliminatória e classificatória');
  const duration = source.match(/Prova Objetiva ter[aá]\s+a\s+dura[cç][aã]o\s+de\s+(\d{1,2})\s*\([^)]*\)\s*horas/i);
  if (duration) items.push(`Duração: ${Number(duration[1])} horas`);

  const table1Start = norm(section).indexOf('tabela 10.1');
  const table2Start = norm(section).indexOf('tabela 10.2');
  const tableEnd = norm(section).indexOf('10.2 os conteudos');
  const table1 = table1Start >= 0 ? section.slice(table1Start, table2Start > table1Start ? table2Start : undefined) : '';
  const table2 = table2Start >= 0 ? section.slice(table2Start, tableEnd > table2Start ? tableEnd : undefined) : '';
  const acq = subjectsFrom(table1 || section).filter((item) => !/Conhecimentos Específicos/i.test(item.name));
  const ac = subjectsFrom(table2 || section).filter((item) => !/Geografia|Conhecimentos Técnicos/i.test(item.name));

  const role = norm(roleHint);
  if (role.includes('analista')) {
    if (ac.length) items.push(`Analista Censitário — ${compactSubjects(ac)}`);
    items.push('Analista Censitário — prova no período da tarde');
    const pass = source.match(/Analista Censit[aá]rio[\s\S]{0,1200}?m[ií]nimo,?\s*(\d{1,3})%[\s\S]{0,400}?m[ií]nimo,?\s*1\s*\(uma\)\s*quest[aã]o de cada disciplina/i);
    if (pass) items.push(`Aprovação (Analista): mínimo de ${pass[1]}% do total e 1 questão em cada disciplina`);
  } else if (role.includes('agente')) {
    if (acq.length) items.push(`Agente Censitário de Qualidade — ${compactSubjects(acq)}`);
    items.push('Agente Censitário de Qualidade — prova no período da manhã');
    const pass = source.match(/Agente Censit[aá]rio[\s\S]{0,1200}?m[ií]nimo,?\s*(\d{1,3})%[\s\S]{0,400}?m[ií]nimo,?\s*1\s*\(uma\)\s*quest[aã]o de cada disciplina/i);
    if (pass) items.push(`Aprovação (Agente): mínimo de ${pass[1]}% do total e 1 questão em cada disciplina`);
  } else {
    if (acq.length) items.push(`ACQ — ${compactSubjects(acq)}`);
    if (ac.length) items.push(`Analista — ${compactSubjects(ac)}`);
    if (/periodo matutino.*agente censitario/s.test(norm(source))) items.push('ACQ: prova pela manhã · Analista: prova à tarde');
  }
  return uniq(items).slice(0, 9);
}

export function extractProgramContent(text, roleHint = '') {
  if (!clean(roleHint)) return [];
  const source = String(text || '');
  const section = lastSection(source, /ANEXO\s+III\s*[–-]?\s*CONTE[ÚU]DOS\s+PROGRAM[AÁ]TICOS/gi, /ANEXO\s+IV/gi);
  if (!section) return [];
  const cleanSection = clean(section);
  const roleWords = norm(roleHint).split(/[^a-z0-9]+/).filter((word) => word.length >= 5 && !['cargo','funcao','area','conhecimento','censitario','analista','agente'].includes(word));
  const normalizedSection = norm(cleanSection);
  let index = -1;
  for (const word of roleWords) {
    const candidate = normalizedSection.indexOf(word);
    if (candidate >= 0) { index = candidate; break; }
  }
  if (index < 0) {
    for (const word of norm(roleHint).split(/[^a-z0-9]+/).filter((word) => word.length >= 5)) {
      const candidate = normalizedSection.indexOf(word);
      if (candidate >= 0) { index = candidate; break; }
    }
  }
  if (index < 0) return [];
  const chunk = cleanSection.slice(index, index + 2600);
  return uniq(chunk.split(/;|\.(?=\s+[A-ZÁÉÍÓÚÇ])/).map(clean).filter((item) => item.length >= 18 && item.length <= 240)).slice(0, 10);
}

export function buildCandidateSummary(text, { roleHint = '', modality = '' } = {}) {
  const roles = extractRoleFacts(text);
  const fees = extractFees(text);
  return {
    fee: fees[0]?.amount || '',
    fees,
    roles,
    vacancies: roles.length ? roles.map((item) => ({ count: item.vacancies, role: item.role })) : extractVacancies(text),
    salaries: roles.length ? roles.map((item) => item.salary) : extractSalaries(text),
    dates: extractImportantDates(text),
    stages: extractStages(text, modality),
    documents: extractDocuments(text, modality),
    exam: extractExam(text, roleHint),
    program: roleHint ? extractProgramContent(text, roleHint) : [],
  };
}
