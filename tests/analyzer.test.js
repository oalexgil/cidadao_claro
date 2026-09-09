import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText, extractContest, extractCotas, normalize } from '../server/analyzer.js';

test('normaliza quebras de linha e espaços sem perder conteúdo', () => {
  assert.equal(normalize('  Linha 1\r\n\r\n\r\nLinha   2  '), 'Linha 1\n\nLinha 2');
});

test('serviço público extrai itens básicos', () => {
  const r = analyzeText('Apresentar RG e CPF. O prazo é de 15 dias úteis. Taxa R$ 25,00. contato@teste.gov.br');
  assert.ok(r.documents.length);
  assert.ok(r.deadlines.some((x) => /15 dias úteis/i.test(x)));
  assert.ok(r.costs.some((x) => /R\$ 25,00/i.test(x)));
  assert.ok(r.contacts.some((x) => /contato@teste\.gov\.br/i.test(x)));
});

test('análise de serviço devolve disclaimer e não inventa dados ausentes', () => {
  const r = analyzeText('Atendimento gratuito mediante agendamento.');
  assert.equal(r.costs.length, 0);
  assert.equal(r.contacts.length, 0);
  assert.ok(r.disclaimer);
});

test('detecta múltiplas modalidades de cotas sem duplicação', () => {
  const c = extractCotas('30% das vagas serão reservadas a pretos e pardos e 5% para pessoas com deficiência. Pessoas negras concorrem conforme o edital.');
  assert.ok(c.includes('PPP'));
  assert.ok(c.includes('PCD'));
  assert.equal(c.filter((x) => x === 'PPP').length, 1);
});

test('não detecta modalidade específica quando só existe menção genérica a reserva', () => {
  const c = extractCotas('Haverá reserva de vagas conforme legislação aplicável.');
  assert.ok(c.includes('OUTRAS'));
  assert.ok(!c.includes('PPP'));
  assert.ok(!c.includes('PCD'));
});

test('cruza perfil PPP e design', () => {
  const r = extractContest(
    'Concurso para Designer de produto. Exige ensino superior. Reserva de vagas para pretos e pardos. Prova objetiva em 10/10/2026.',
    { area: 'Designer de produto', education: 'Ensino superior', modality: 'PPP' }
  );
  assert.ok(r.profile.score >= 80);
  assert.ok(r.general.cotas.includes('PPP'));
  assert.ok(r.profile.personalized.length > 0);
});

test('perfil incompatível gera alerta em vez de certeza negativa', () => {
  const r = extractContest(
    'Processo seletivo para Assistente Administrativo. Exige ensino médio.',
    { area: 'Engenharia', education: 'Ensino superior' }
  );
  assert.ok(r.profile.warnings.length > 0);
  assert.ok(r.profile.score >= 0 && r.profile.score <= 100);
});

test('extrai datas, vagas, escolaridade e etapas de concurso', () => {
  const r = extractContest(
    'Edital de concurso. São 120 vagas. Exige ensino superior. Prova objetiva em 12/09/2026. Entrevista em 20/09/2026. Taxa de inscrição R$ 80,00.'
  );
  assert.ok(r.general.vacancies.some((x) => /120 vagas/i.test(x)));
  assert.ok(r.general.education.some((x) => /ensino superior/i.test(x)));
  assert.ok(r.general.dates.some((x) => /12\/09\/2026/.test(x)));
  assert.ok(r.general.stages.some((x) => /prova objetiva/i.test(x)));
  assert.ok(r.general.fee.some((x) => /taxa de inscrição/i.test(x)));
});

test('score é sempre limitado entre zero e cem', () => {
  const r = extractContest(
    'Designer de produto. Ensino superior. Pretos e pardos. UX UI produto design.',
    { area: 'Designer de produto', education: 'Ensino superior', modality: 'PPP', state: 'RJ', experience: 10 }
  );
  assert.ok(r.profile.score >= 0);
  assert.ok(r.profile.score <= 100);
});
