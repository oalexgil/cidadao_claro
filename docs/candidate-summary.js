const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const norm = (value) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const uniq = (items) => [...new Map(items.filter(Boolean).map((item) => [norm(item), item])).values()];
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

export function extractFee(text) {
  const source = clean(text);
  const direct = [
    new RegExp(`(?:valor|taxa)\\s+(?:da\\s+)?(?:taxa\\s+)?de\\s+inscri[cç][aã]o[\\s\\S]{0,160}?(${MONEY})`, 'i'),
    new RegExp(`taxa\\s+de\\s+inscri[cç][aã]o[\\s\\S]{0,160}?no\\s+valor\\s+de\\s+(${MONEY})`, 'i'),
    new RegExp(`(${MONEY})[\\s\\S]{0,100}?taxa\\s+de\\s+inscri[cç][aã]o`, 'i'),
  ];
  for (const re of direct) {
    const match = source.match(re);
    if (match?.[1]) return clean(match[1]);
  }
  const index = norm(source).indexOf('taxa de inscricao');
  if (index >= 0) {
    const window = source.slice(Math.max(0, index - 120), index + 360);
    const values = window.match(new RegExp(MONEY, 'g')) || [];
    if (values.length) return clean(values[0]);
  }
  return '';
}

export function extractVacancies(text) {
  const source = clean(text);
  const records = [];
  const re = /(\d{1,3}(?:\.\d{3})*)\s*(?:\([^)]*\)\s*)?vagas?\s+para\s+(?:a\s+)?fun[cç][aã]o\s+de\s+([^.;]{3,110})/gi;
  for (const match of source.matchAll(re)) {
    records.push({ count: match[1], role: clean(match[2]).replace(/\s+(?:conforme|segundo|distribu[ií]das?).*$/i, '') });
  }
  if (records.length) return records.slice(0, 8);
  const totals = [...source.matchAll(/\b(\d{1,3}(?:\.\d{3})*)\s+vagas?\b/gi)].map((m) => m[1]);
  return uniq(totals).slice(0, 6).map((count) => ({ count, role: '' }));
}

export function extractSalaries(text) {
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
  let section = lastSection(source, /ANEXO\s+IV\s*[–-]?\s*CRONOGRAMA\s+PREVISTO/gi);
  if (!section) section = source;
  const dateRe = /\b(\d{1,2}\/\d{1,2}\/20\d{2})(?:\s*(?:a|até|[-–])\s*(\d{1,2}\/\d{1,2}\/20\d{2}))?/g;
  const out = [];
  for (const match of section.matchAll(dateRe)) {
    const index = match.index || 0;
    const context = clean(section.slice(Math.max(0, index - 180), Math.min(section.length, index + 220)));
    const label = eventLabel(context);
    if (!label) continue;
    const date = match[2] ? `${match[1]} a ${match[2]}` : match[1];
    out.push({ label, date });
  }
  return uniq(out.map((item) => `${item.label}|||${item.date}`)).map((value) => {
    const [label, date] = value.split('|||');
    return { label, date };
  }).slice(0, 14);
}

export function extractStages(text, modality = '') {
  const value = norm(text);
  const stages = [];
  if (/prova objetiva/.test(value)) stages.push('Prova objetiva — eliminatória e classificatória');
  if (/prova discursiva|redacao/.test(value)) stages.push('Prova discursiva / redação');
  if (/avaliacao de titulos/.test(value)) stages.push('Avaliação de títulos');
  if (/teste de aptidao fisica|\btaf\b/.test(value)) stages.push('Teste de aptidão física');
  if (/entrevista/.test(value)) stages.push('Entrevista');
  if (/curso de formacao/.test(value)) stages.push('Curso de formação');
  if (modality === 'PPP' && /heteroidentificacao/.test(value)) stages.push('Heteroidentificação — para PPP');
  if (modality === 'PCD' && /caracterizacao da deficiencia|avaliacao.*pcd|pericia/.test(value)) stages.push('Avaliação/caracterização da deficiência — para PcD');
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
  if (modality === 'INDÍGENAS' && /indigena/.test(all)) docs.push('Documentação específica para pessoa indígena, se exigida no capítulo de reserva');
  if (modality === 'QUILOMBOLAS' && /quilombola/.test(all)) docs.push('Documentação específica para pessoa quilombola, se exigida no capítulo de reserva');
  return uniq(docs).slice(0, 8);
}

function proofSection(text) {
  const source = String(text || '');
  return lastSection(source, /(?:10\.|DA\s+)PROVA\s+OBJETIVA/gi, /(?:\n|\s)11\.\s+/g) || source;
}

export function extractExam(text, roleHint = '') {
  const section = clean(proofSection(text));
  const value = norm(section);
  const items = [];
  if (/prova objetiva/.test(value)) items.push('Prova objetiva');
  if (/eliminatorio e classificatorio|eliminatoria e classificatoria/.test(value)) items.push('Caráter eliminatório e classificatório');
  if (/periodo da manha.*agente censitario/s.test(value)) items.push('Agente Censitário: prova pela manhã');
  if (/periodo da tarde.*analista censitario/s.test(value)) items.push('Analista Censitário: prova à tarde');

  const subjects = [];
  const subjectRe = /(Língua Portuguesa|Raciocínio Lógico Quantitativo|Raciocínio Lógico|Geografia|Conhecimentos Técnicos|Conhecimentos Específicos|Informática|Atualidades|Legislação)\s+(\d{1,3})\b/gi;
  for (const match of section.matchAll(subjectRe)) subjects.push(`${clean(match[1])}: ${match[2]} questões`);

  const role = norm(roleHint);
  let filtered = uniq(subjects);
  if (role.includes('analista') && /conhecimentos especificos/.test(value)) {
    filtered = filtered.filter((item) => !/Geografia|Conhecimentos Técnicos/i.test(item));
  } else if (role.includes('agente') && /conhecimentos tecnicos/.test(value)) {
    filtered = filtered.filter((item) => !/Conhecimentos Específicos/i.test(item));
  }
  items.push(...filtered.slice(0, 6));

  if (role.includes('agente')) {
    const pass = section.match(/Agente Censit[aá]rio[\s\S]{0,700}?m[ií]nimo,?\s*(\d{1,3})%[\s\S]{0,250}?m[ií]nimo,?\s*1\s*\(uma\)\s*quest[aã]o de cada disciplina/i);
    if (pass) items.push(`Aprovação: mínimo de ${pass[1]}% do total e 1 questão em cada disciplina`);
  } else if (role.includes('analista')) {
    const pass = section.match(/Analista Censit[aá]rio[\s\S]{0,700}?m[ií]nimo,?\s*(\d{1,3})%[\s\S]{0,250}?m[ií]nimo,?\s*1\s*\(uma\)\s*quest[aã]o de cada disciplina/i);
    if (pass) items.push(`Aprovação: mínimo de ${pass[1]}% do total e 1 questão em cada disciplina`);
  }
  return uniq(items).slice(0, 10);
}

export function extractProgramContent(text, roleHint = '') {
  if (!clean(roleHint)) return [];
  const source = String(text || '');
  const section = lastSection(source, /ANEXO\s+III\s*[–-]?\s*CONTE[ÚU]DOS\s+PROGRAM[AÁ]TICOS/gi, /ANEXO\s+IV/gi);
  if (!section) return [];
  const cleanSection = clean(section);
  const roleWords = norm(roleHint).split(/[^a-z0-9]+/).filter((word) => word.length >= 5 && !['cargo','funcao','area','conhecimento'].includes(word));
  const normalizedSection = norm(cleanSection);
  let index = -1;
  for (const word of roleWords) {
    const candidate = normalizedSection.indexOf(word);
    if (candidate >= 0) { index = candidate; break; }
  }
  if (index < 0) return [];
  const chunk = cleanSection.slice(index, index + 2200);
  return uniq(chunk.split(/;|\.(?=\s+[A-ZÁÉÍÓÚÇ])/).map(clean).filter((item) => item.length >= 18 && item.length <= 220)).slice(0, 8);
}

export function buildCandidateSummary(text, { roleHint = '', modality = '' } = {}) {
  const vacancies = extractVacancies(text);
  const salaries = extractSalaries(text);
  return {
    fee: extractFee(text),
    vacancies,
    salaries,
    dates: extractImportantDates(text),
    stages: extractStages(text, modality),
    documents: extractDocuments(text, modality),
    exam: extractExam(text, roleHint),
    program: roleHint ? extractProgramContent(text, roleHint) : [],
  };
}
