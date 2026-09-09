import { buildCandidateSummary } from './candidate-summary.js';

const $ = (id) => document.getElementById(id);
const MAX_CONTEST_CHARS = 250000;
const AI_TIMEOUT_MS = 15000;
const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const list = (items, empty = 'Não localizado no edital.') => items?.length
  ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
  : `<div class="empty-state">${esc(empty)}</div>`;

function shortRole(role) {
  if (/agente censit[aá]rio de qualidade/i.test(role)) return 'ACQ';
  if (/analista censit[aá]rio/i.test(role)) return 'Analista';
  return clean(role).slice(0, 45);
}

function feeText(summary) {
  if (summary.fees?.length > 1) return summary.fees.map((item) => `${shortRole(item.role)}: ${item.amount}`).join(' · ');
  return summary.fees?.[0]?.amount || summary.fee || 'Não localizado';
}

function vacancyText(summary) {
  if (summary.roles?.length) return summary.roles.map((item) => `${shortRole(item.role)}: ${item.vacancies}`).join(' · ');
  if (!summary.vacancies?.length) return 'Não localizado';
  return summary.vacancies.slice(0, 4).map((item) => item.role ? `${shortRole(item.role)}: ${item.count}` : item.count).join(' · ');
}

function salaryText(summary) {
  if (summary.roles?.length) return summary.roles.map((item) => `${shortRole(item.role)}: ${item.salary}`).join(' · ');
  return summary.salaries?.length ? summary.salaries.slice(0, 4).join(' · ') : 'Não localizado';
}

function renderDates(items) {
  if (!items?.length) return '<div class="empty-state">Cronograma não localizado no texto carregado.</div>';
  return `<ul>${items.map((item) => `<li><b>${esc(item.label)}</b> — ${esc(item.date)}</li>`).join('')}</ul>`;
}

function renderSummary(summary, { aiRole = '' } = {}) {
  const proofText = summary.exam?.[0] || 'Não localizada';
  const program = aiRole
    ? `<article class="result-card"><h3>📚 Conteúdo programático</h3><p class="list-title">Cargo relacionado pela IA: ${esc(aiRole)}</p>${list(summary.program, 'Conteúdo específico não localizado no Anexo III do texto carregado.')}</article>`
    : '';

  return `
    <div class="result-head">
      <div>
        <span class="eyebrow">RESUMO DO CANDIDATO</span>
        <h2>O que realmente importa neste edital</h2>
      </div>
      <button class="secondary" onclick="window.print()">Imprimir</button>
    </div>

    <div class="mini-stat-grid">
      <div class="mini-stat"><small>Taxa / valor</small><b>${esc(feeText(summary))}</b></div>
      <div class="mini-stat"><small>Vagas</small><b>${esc(vacancyText(summary))}</b></div>
      <div class="mini-stat"><small>Salários</small><b>${esc(salaryText(summary))}</b></div>
      <div class="mini-stat"><small>Prova</small><b>${esc(proofText)}</b></div>
    </div>

    <div class="result-grid">
      <article class="result-card"><h3>📅 Datas importantes</h3>${renderDates(summary.dates)}</article>
      <article class="result-card"><h3>🧭 Etapas</h3>${list(summary.stages)}</article>
      <article class="result-card"><h3>🧾 Documentos</h3>${list(summary.documents)}</article>
      <article class="result-card"><h3>📝 Prova</h3>${list(summary.exam)}</article>
      ${program}
    </div>

    <div class="callout">Resumo automático do texto carregado. Confira os itens correspondentes no edital oficial antes da inscrição.</div>
  `;
}

function setStatus(message, kind = 'success') {
  const status = $('contestStatus');
  if (!status) return;
  status.textContent = message;
  status.className = `status ${kind}`;
}

async function readFullFile(file) {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return file.text();
  const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.mjs';
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer), enableScripting: false }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str || '').join(' '));
  }
  const text = pages.join('\n\n').trim();
  if (!text) throw new Error('Este PDF parece ser escaneado como imagem. A versão atual precisa de texto selecionável.');
  return text;
}

function tensorToArray(output) {
  return output.tolist ? output.tolist().flat(Infinity) : Array.from(output.data || []);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

let embeddingPipePromise = null;
async function getEmbeddingPipe() {
  if (!embeddingPipePromise) {
    embeddingPipePromise = import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm')
      .then(({ pipeline }) => pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' }));
  }
  return embeddingPipePromise;
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms));
}

async function chooseRoleWithAI(profileText, candidates) {
  if (!profileText || !candidates.length) return '';
  const pipe = await Promise.race([getEmbeddingPipe(), timeout(AI_TIMEOUT_MS)]);
  const base = tensorToArray(await Promise.race([pipe(profileText, { pooling: 'mean', normalize: true }), timeout(AI_TIMEOUT_MS)]));
  const embedded = tensorToArray(await Promise.race([pipe(candidates, { pooling: 'mean', normalize: true }), timeout(AI_TIMEOUT_MS)]));
  const dim = base.length;
  const ranked = candidates.map((label, index) => ({
    label,
    score: cosine(base, embedded.slice(index * dim, (index + 1) * dim)),
  })).sort((a, b) => b.score - a.score);
  return ranked[0]?.label || '';
}

const result = $('contestResult');
const analyzeButton = $('contestAnalyze');
const contestFile = $('contestFile');
const contestText = $('contestText');

if (contestText) {
  contestText.maxLength = MAX_CONTEST_CHARS;
  contestText.addEventListener('input', (event) => {
    event.stopImmediatePropagation();
    const count = $('contestCount');
    if (count) count.textContent = `${contestText.value.length.toLocaleString('pt-BR')} / ${MAX_CONTEST_CHARS.toLocaleString('pt-BR')}`;
  }, true);
}

contestFile?.addEventListener('change', async (event) => {
  event.stopImmediatePropagation();
  const file = contestFile.files?.[0];
  if (!file) return;
  try {
    setStatus(`Lendo “${file.name}”…`, 'loading');
    const fullText = await readFullFile(file);
    const text = fullText.slice(0, MAX_CONTEST_CHARS);
    contestText.value = text;
    const count = $('contestCount');
    if (count) count.textContent = `${text.length.toLocaleString('pt-BR')} / ${MAX_CONTEST_CHARS.toLocaleString('pt-BR')}`;
    const fileStatus = $('fileStatus');
    if (fileStatus) fileStatus.innerHTML = `<span class="file-status-icon success-icon">✓</span><span><b>${esc(file.name)}</b><small>${fullText.length > MAX_CONTEST_CHARS ? 'Texto carregado com limite ampliado de caracteres.' : 'Edital completo carregado e pronto para análise.'}</small></span>`;
    setStatus('Arquivo pronto. Clique em “Encontrar o que importa”.');
  } catch (error) {
    console.error(error);
    setStatus(`Não consegui ler “${file.name}”. ${error.message || 'Tente outro arquivo.'}`, 'error');
  } finally {
    contestFile.value = '';
  }
}, true);

analyzeButton?.addEventListener('click', async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  const text = contestText?.value?.trim() || '';
  if (!text) {
    setStatus('Carregue ou cole o texto do edital antes de analisar.', 'error');
    return;
  }

  const profileArea = $('profileArea')?.value?.trim() || '';
  const profileDetails = $('profileDetails')?.value?.trim() || '';
  const modality = $('profileModality')?.value || '';

  const baseSummary = buildCandidateSummary(text, { modality });
  if (result) {
    result.innerHTML = renderSummary(baseSummary);
    result.classList.remove('hidden');
  }

  if (!profileArea) {
    setStatus('Resumo concluído. Informe uma profissão apenas se quiser ativar o conteúdo programático com IA local.');
    return;
  }

  const candidates = baseSummary.roles?.map((item) => item.role).filter(Boolean) || [];
  if (!candidates.length) {
    setStatus('Resumo concluído. Não localizei cargos estruturados suficientes para o cruzamento com IA local.');
    return;
  }

  setStatus('Resumo pronto. Tentando relacionar sua profissão aos cargos com IA local…', 'loading');
  try {
    const aiRole = await chooseRoleWithAI([profileArea, profileDetails].filter(Boolean).join('. '), candidates);
    if (!aiRole) throw new Error('NO_AI_ROLE');
    const enriched = buildCandidateSummary(text, { roleHint: `${profileArea} ${aiRole}`, modality });
    if (result) result.innerHTML = renderSummary(enriched, { aiRole });
    setStatus(`Resumo concluído. IA local relacionou seu perfil a “${aiRole}”.`);
  } catch (error) {
    console.warn('IA local não concluiu no tempo limite', error);
    setStatus(`Resumo concluído sem bloquear na IA. O conteúdo programático ficou oculto porque a IA local não respondeu em até ${AI_TIMEOUT_MS / 1000}s.`, 'success');
  }
}, true);
