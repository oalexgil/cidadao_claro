import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText, extractContest, extractCotas } from '../server/analyzer.js';

test('serviço público extrai itens básicos', () => {
  const r = analyzeText('Apresentar RG e CPF. O prazo é de 15 dias úteis. Taxa R$ 25,00. contato@teste.gov.br');
  assert.ok(r.documents.length); assert.ok(r.deadlines.some((x) => /15 dias úteis/i.test(x))); assert.ok(r.costs.some((x) => /R\$ 25,00/i.test(x))); assert.ok(r.contacts.some((x) => /contato@teste\.gov\.br/i.test(x)));
});
test('detecta cotas', () => {
  const c = extractCotas('30% das vagas serão reservadas a pretos e pardos e 5% para pessoas com deficiência.');
  assert.ok(c.includes('PPP')); assert.ok(c.includes('PCD'));
});
test('cruza perfil PPP e design', () => {
  const r = extractContest('Concurso para Designer de produto. Exige ensino superior. Reserva de vagas para pretos e pardos. Prova objetiva em 10/10/2026.', { area:'Designer de produto', education:'Ensino superior', modality:'PPP' });
  assert.ok(r.profile.score >= 80); assert.ok(r.general.cotas.includes('PPP')); assert.ok(r.profile.personalized.length > 0);
});
