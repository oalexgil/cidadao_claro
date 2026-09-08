const $ = (id) => document.getElementById(id);
const PROFILE_KEY = 'cidadao-claro-profile-v2';
const HISTORY_KEY = 'cidadao-claro-history-v2';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
function uniq(items) { return [...new Map(items.filter(Boolean).map((v) => [String(v).toLowerCase(), v])).values()]; }
function normalize(text) { return String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(); }
function lines(text) { return normalize(text).split('\n').map((v) => v.trim()).filter(Boolean); }
function sentences(text) { return normalize(text).split(/(?<=[.!?])\s+|\n+/).map((v) => v.trim()).filter(Boolean); }
function matches(text, regex) { return [...text.matchAll(regex)].map((m) => m[0].trim()); }
function hinted(ls, hints) { return uniq(ls.filter((line) => hints.some((hint) => line.toLowerCase().includes(hint)))); }
function listHtml(items, empty='Não identificado no texto.') {
  return Array.isArray(items) && items.length ? items.map((x) => `<li>${esc(x)}</li>`).join('') : `<li>${esc(empty)}</li>`;
}

function profile() {
  return {
    area: $('profileArea').value.trim(),
    education: $('profileEducation').value,
    experience: $('profileExperience').value,
    state: $('profileState').value.trim(),
    modality: $('profileModality').value
  };
}
function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    $('profileArea').value = p.area || '';
    $('profileEducation').value = p.education || '';
    $('profileExperience').value = p.experience || '';
    $('profileState').value = p.state || '';
    $('profileModality').value = p.modality || '';
  } catch { /* storage may be unavailable */ }
  renderProfileSummary();
}
function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile()));
  renderProfileSummary();
  $('contestStatus').textContent = 'Perfil salvo neste navegador.';
}
function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
  for (const id of ['profileArea','profileEducation','profileExperience','profileState','profileModality']) $(id).value = '';
  renderProfileSummary();
}
function renderProfileSummary() {
  const p = profile();
  const data = [['Área', p.area || 'Não informada'], ['Escolaridade', p.education || 'Não informada'], ['Experiência', p.experience ? `${p.experience} ano(s)` : 'Não informada'], ['UF/região', p.state || 'Não informada'], ['Modalidade', p.modality || 'Ampla concorrência']];
  $('profileSummary').innerHTML = data.map(([a,b]) => `<div class="profile-chip"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('');
}

function serviceAnalyzeLocal(text) {
  const t = normalize(text), ls = lines(t), ss = sentences(t);
  return {
    title: ls[0] || 'Serviço público',
    overview: ss.slice(0, 3).join(' '),
    actions: hinted(ls, ['comparecer','preencher','agendar','entregar','apresentar','enviar','protocolar','solicitar','acompanhar','retirar','pagar','assinar','cadastrar','acessar','anexar']),
    documents: hinted(ls, ['documento','documentos','rg','cpf','comprovante','certidão','certidao','diploma','histórico','historico','laudo','declaração','declaracao']),
    deadlines: uniq([...matches(t, /\b\d+\s+dias?\s+(?:[uú]teis|corridos)\b/gi), ...matches(t, /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+de\s+[A-Za-zçãõáéíóú]+\s+de\s+\d{4})\b/gi)]),
    costs: uniq(matches(t, /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/gi)),
    contacts: uniq([...matches(t, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig), ...matches(t, /(?:\+55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-.\s]?\d{4}/g)]),
    keyPoints: ss.filter((s) => /\b(?:deve|precisa|necess[aá]rio|obrigat[oó]rio|prazo|taxa|gratuito|agendamento|atendimento)\b/i.test(s)).slice(0, 8),
    disclaimer: 'A análise é informativa. Confirme requisitos, prazos e valores na fonte oficial.'
  };
}

function contestAnalyzeLocal(text, p) {
  const t = normalize(text), lower = t.toLowerCase(), ls = lines(t), ss = sentences(t);
  const salary = uniq(matches(t, /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/gi)).slice(0, 12);
  const dates = uniq(matches(t, /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+de\s+[A-Za-zçãõáéíóú]+\s+de\s+\d{4})\b/gi)).slice(0, 20);
  const vacancies = uniq([...matches(t, /\b\d{1,5}\s+(?:vagas?|oportunidades?)\b/gi), ...matches(t, /\b(?:ampla concorr[eê]ncia|reserva de vagas)\b[^.\n]*/gi)]).slice(0, 12);
  const education = uniq(ls.filter((x) => /ensino (fundamental|m[eé]dio|t[eé]cnico|superior)|gradua[cç][aã]o|bacharelado|licenciatura|p[oó]s-gradua[cç][aã]o|mestrado|doutorado/i.test(x))).slice(0, 12);
  const stages = uniq(ls.filter((x) => /prova objetiva|prova discursiva|redação|redacao|avaliação de títulos|avaliacao de titulos|teste de aptidão física|teste de aptidao fisica|\btaf\b|entrevista|heteroidentificação|heteroidentificacao|perícia médica|pericia medica|curso de formação|curso de formacao|etapa|fase/i.test(x))).slice(0, 15);
  const documents = hinted(ls, ['documento','documentos','rg','cpf','comprovante','certidão','certidao','diploma','histórico','historico','currículo','curriculo','laudo','declaração','declaracao','registro profissional']).slice(0, 15);
  const actions = hinted(ls, ['comparecer','preencher','agendar','entregar','apresentar','enviar','protocolar','solicitar','acompanhar','inscrever','anexar']).slice(0, 15);
  const cotas = [];
  if (/pretos?|pardos?|pessoas negras|negros?\s+e\s+negras?|cota\s+ppp/i.test(t)) cotas.push('PPP');
  if (/pessoa(?:s)?\s+com\s+defici[eê]ncia|\bpcd\b/i.test(t)) cotas.push('PCD');
  if (/ind[ií]genas?/i.test(t)) cotas.push('INDÍGENAS');
  if (/quilombolas?/i.test(t)) cotas.push('QUILOMBOLAS');
  if (/cota|reserva\s+de\s+vagas|a[cç]([ãa])o\s+afirmativa/i.test(t)) cotas.push('OUTRAS');

  const reasons = [], warnings = [], personalized = [], checklist = [];
  let score = 50;
  if (p.area) {
    if (lower.includes(p.area.toLowerCase())) { score += 15; reasons.push(`A expressão da sua área (“${p.area}”) aparece no edital.`); }
    else warnings.push(`Não apareceu uma menção direta à área “${p.area}”. Procure também pelo nome de cargos semelhantes.`);
  }
  if (p.education) {
    const e = p.education.toLowerCase();
    const compatible = lower.includes(e) || (/superior/.test(e) && /ensino superior|graduação|gradua[cç][aã]o/.test(lower)) || (/médio/.test(e) && /ensino médio|nível médio/.test(lower));
    if (compatible) { score += 15; reasons.push('Há sinais textuais de compatibilidade com a escolaridade informada.'); }
    else warnings.push('A escolaridade informada não apareceu claramente compatível; confira os requisitos do cargo.');
  }
  if (Number(p.experience) > 0) {
    if (/experi[eê]ncia|tempo de servi[cç]o/.test(lower)) { score += 5; reasons.push('O edital menciona experiência/tempo de serviço; confira a quantidade exigida.'); }
    else warnings.push('Sua experiência foi informada, mas não foi localizada exigência explícita no texto.');
  }
  if (p.modality) {
    const m = p.modality.toUpperCase(), found = cotas.includes(m) || (m === 'PPP' && /pretos?|pardos?|pessoas negras/.test(lower));
    if (found) { score += 10; reasons.push(`A modalidade ${m} aparece no edital.`); personalized.push(`Confira percentual reservado, critérios de autodeclaração e eventual heteroidentificação aplicáveis à modalidade ${m}.`); }
    else warnings.push(`Não foi detectada a modalidade ${m}. Procure também anexos e tabelas de vagas.`);
  }
  if (/designer|design/i.test((p.area || '').toLowerCase()) && /designer|design|ux|ui|produto/i.test(lower)) { score += 5; personalized.push('Há referências relacionadas a design, UX/UI ou produto no texto.'); }
  if (p.state && lower.includes(p.state.toLowerCase())) reasons.push(`O estado/região informado (${p.state}) aparece no texto.`);
  if (dates.length) checklist.push('Registrar todas as datas e criar lembretes.');
  if (salary.length) checklist.push('Comparar remuneração e jornada com o plano de carreira.');
  if (documents.length) checklist.push('Separar documentos exigidos e verificar formato/validade.');
  if (stages.length) checklist.push('Montar preparação por etapa do certame.');
  if (cotas.length) checklist.push('Ler a seção de cotas/reserva de vagas e os anexos correspondentes.');
  checklist.push('Conferir o requisito exato do cargo desejado no edital oficial.');
  score = Math.max(0, Math.min(100, score));
  return {
    general: { title: ls.find((x) => /edital|concurso|processo seletivo/i.test(x)) || ls[0] || 'Edital', overview: ss.slice(0, 3).join(' '), salary, dates, vacancies, education, stages, documents, actions, contacts: uniq([...matches(t, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig), ...matches(t, /(?:\+55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-.\s]?\d{4}/g)]), cotas, fee: uniq(matches(t, /taxa de inscri[cç][aã]o[^\n.]*/gi)).slice(0, 5) },
    profile: { score, band: score >= 80 ? 'Alta' : score >= 60 ? 'Média' : 'Baixa', reasons, warnings, personalized, checklist: uniq(checklist) },
    disclaimer: 'Use como guia de leitura. O edital oficial e os atos da banca organizadora prevalecem.'
  };
}

function renderService(r) {
  $('serviceResult').innerHTML = `<div class="result-head"><div><p class="eyebrow">RESULTADO</p><h2>${esc(r.title)}</h2><p>${esc(r.overview || 'Sem resumo claro no texto.')}</p></div><button class="secondary" onclick="window.print()">Imprimir</button></div><div class="result-grid"><article class="result-card"><h3>✅ O que fazer</h3><ul>${listHtml(r.actions)}</ul></article><article class="result-card"><h3>📄 Documentos</h3><ul>${listHtml(r.documents)}</ul></article><article class="result-card"><h3>⏱️ Prazos</h3><ul>${listHtml(r.deadlines)}</ul></article><article class="result-card"><h3>💰 Custos</h3><ul>${listHtml(r.costs)}</ul></article><article class="result-card"><h3>☎️ Contatos</h3><ul>${listHtml(r.contacts)}</ul></article><article class="result-card"><h3>🔎 Pontos importantes</h3><ul>${listHtml(r.keyPoints)}</ul></article></div><div class="callout">${esc(r.disclaimer)}</div>`;
  $('serviceResult').classList.remove('hidden');
}
function renderContest(r) {
  const g = r.general, p = r.profile;
  const stats = [['Vagas', g.vacancies.length ? g.vacancies.join(' · ') : 'Não identificado'], ['Remuneração', g.salary.length ? g.salary.slice(0, 3).join(' · ') : 'Não identificado'], ['Taxa', g.fee.length ? g.fee[0] : 'Não identificada'], ['Cotas', g.cotas.length ? g.cotas.join(' · ') : 'Não identificadas']];
  $('contestResult').innerHTML = `<div class="result-head"><div><p class="eyebrow">RADAR DE CONCURSOS</p><h2>${esc(g.title)}</h2><p>${esc(g.overview || 'Resumo não localizado; consulte o texto original.')}</p></div><button class="secondary" onclick="window.print()">Imprimir</button></div><div class="score"><div class="score-number">${p.score}</div><div class="score-copy"><b>Compatibilidade ${esc(p.band)}</b><div>${esc(p.reasons[0] || 'Índice indicativo baseado no perfil e nas expressões encontradas.')}</div></div></div><div class="mini-stat-grid">${stats.map(([a,b]) => `<div class="mini-stat"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('')}</div><div class="result-grid"><article class="result-card"><h3>📌 Para todo candidato</h3><p class="list-title">Datas e prazos</p><ul>${listHtml(g.dates)}</ul><p class="list-title">Etapas</p><ul>${listHtml(g.stages)}</ul></article><article class="result-card"><h3>🎯 Para o seu perfil</h3><p class="list-title">Pontos favoráveis</p><ul>${listHtml(p.reasons, 'Nenhum ponto favorável detectado automaticamente.')}</ul><p class="list-title">Aplicações específicas</p><ul>${listHtml(p.personalized, 'Nenhuma regra específica adicional detectada.')}</ul></article><article class="result-card"><h3>🧾 Requisitos e documentos</h3><p class="list-title">Escolaridade</p><ul>${listHtml(g.education)}</ul><p class="list-title">Documentos</p><ul>${listHtml(g.documents)}</ul></article><article class="result-card"><h3>🏷️ Cotas e reserva de vagas</h3><div>${g.cotas.length ? g.cotas.map((x) => `<span class="tag">${esc(x)}</span>`).join(' ') : '<p>Não identificadas no trecho analisado.</p>'}</div><div class="callout">Confira o quadro de vagas, critérios de enquadramento e anexos da modalidade.</div></article><article class="result-card"><h3>⚠️ Pontos de atenção</h3><ul>${listHtml(p.warnings, 'Nenhum alerta automático. Mesmo assim, confira o edital integral.')}</ul></article><article class="result-card"><h3>✅ Checklist personalizado</h3><ul>${listHtml(p.checklist)}</ul></article></div><div class="callout danger">${esc(r.disclaimer)}</div>`;
  $('contestResult').classList.remove('hidden');
}

async function readFileText(file) {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return file.text();
  const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.mjs';
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str || '').join(' '));
  }
  return pages.join('\n\n');
}

function saveHistory(type, data) {
  try {
    const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    items.unshift({ id: Date.now(), type, title: type === 'contest' ? data.general.title : data.title, data });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
  } catch { /* optional */ }
}

$('serviceAnalyze').addEventListener('click', () => {
  const text = $('serviceText').value.trim();
  if (!text) return ($('serviceStatus').textContent = 'Cole um texto antes de analisar.');
  $('serviceStatus').textContent = 'Analisando no navegador…';
  renderService(serviceAnalyzeLocal(text));
  $('serviceStatus').textContent = 'Análise concluída sem enviar o texto para servidor.';
});
$('contestAnalyze').addEventListener('click', () => {
  const text = $('contestText').value.trim();
  if (!text) return ($('contestStatus').textContent = 'Cole o texto do edital antes de analisar.');
  const p = profile();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  $('contestStatus').textContent = 'Cruzando edital + perfil…';
  const result = contestAnalyzeLocal(text, p);
  renderContest(result);
  saveHistory('contest', result);
  $('contestStatus').textContent = 'Radar concluído localmente.';
});
$('saveProfile').addEventListener('click', saveProfile);
$('clearProfile').addEventListener('click', clearProfile);
$('serviceText').addEventListener('input', () => { $('serviceCount').textContent = `${$('serviceText').value.length.toLocaleString('pt-BR')} / 30.000`; });
$('contestText').addEventListener('input', () => { $('contestCount').textContent = `${$('contestText').value.length.toLocaleString('pt-BR')} / 60.000`; });
$('serviceFile').addEventListener('change', async (e) => { const f=e.target.files?.[0]; if(f){$('serviceText').value=await readFileText(f);$('serviceCount').textContent=`${$('serviceText').value.length.toLocaleString('pt-BR')} / 30.000`;} });
$('contestFile').addEventListener('change', async (e) => { const f=e.target.files?.[0]; if(f){$('contestText').value=await readFileText(f);$('contestCount').textContent=`${$('contestText').value.length.toLocaleString('pt-BR')} / 60.000`;} });
document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => { document.querySelectorAll('.nav-btn').forEach((x) => x.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('.tab-panel').forEach((x) => x.classList.remove('active')); $(btn.dataset.tab === 'services' ? 'servicesTab' : btn.dataset.tab === 'contests' ? 'contestsTab' : 'profileTab').classList.add('active'); }));
loadProfile();
