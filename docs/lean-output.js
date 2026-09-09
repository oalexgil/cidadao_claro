import { buildCandidateSummary } from './candidate-summary.js';

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
const list = (items, empty = 'Não localizado no edital.') => items?.length
  ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
  : `<div class="empty-state">${esc(empty)}</div>`;

function vacancyText(records) {
  if (!records?.length) return 'Não localizado';
  return records.slice(0, 3).map((item) => item.role ? `${item.count} — ${item.role}` : item.count).join(' · ');
}

function renderDates(items) {
  if (!items?.length) return '<div class="empty-state">Cronograma não localizado com segurança.</div>';
  return `<ul>${items.map((item) => `<li><b>${esc(item.label)}</b> — ${esc(item.date)}</li>`).join('')}</ul>`;
}

function renderSummary(summary, roleHint) {
  const salaryText = summary.salaries?.length ? summary.salaries.slice(0, 4).join(' · ') : 'Não localizado';
  const proofText = summary.exam?.[0] || 'Não localizada';
  const program = roleHint && summary.program?.length
    ? `<article class="result-card"><h3>📚 Conteúdo programático</h3><p class="list-title">Selecionado pela IA para: ${esc(roleHint)}</p>${list(summary.program)}</article>`
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
      <div class="mini-stat"><small>Taxa / valor</small><b>${esc(summary.fee || 'Não localizado')}</b></div>
      <div class="mini-stat"><small>Vagas</small><b>${esc(vacancyText(summary.vacancies))}</b></div>
      <div class="mini-stat"><small>Salários</small><b>${esc(salaryText)}</b></div>
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

const result = $('contestResult');
const analyzeButton = $('contestAnalyze');
let rewriting = false;

function rewriteWhenReady() {
  if (!result || rewriting || result.classList.contains('hidden') || !result.children.length) return;
  if (result.dataset.concise === 'true') return;

  const text = $('contestText')?.value?.trim() || '';
  if (!text) return;

  const profileArea = $('profileArea')?.value?.trim() || '';
  const modality = $('profileModality')?.value || '';
  const topRole = result.querySelector('.role-item b')?.textContent?.trim() || '';
  const roleHint = profileArea && topRole ? topRole : '';
  const summary = buildCandidateSummary(text, { roleHint, modality });

  rewriting = true;
  result.innerHTML = renderSummary(summary, roleHint);
  result.dataset.concise = 'true';
  rewriting = false;
}

if (result) {
  const observer = new MutationObserver(() => queueMicrotask(rewriteWhenReady));
  observer.observe(result, { childList: true, subtree: true });
}

analyzeButton?.addEventListener('click', () => {
  if (result) delete result.dataset.concise;
});
