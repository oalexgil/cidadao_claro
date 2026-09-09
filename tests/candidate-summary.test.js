import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCandidateSummary,
  extractImportantDates,
  extractProgramContent,
  extractVacancies,
  extractSalaries,
  extractExam,
} from '../docs/candidate-summary.js';

const EDITAL = `
Lei nº 8.745, de 09/12/1993. Decreto de 16/08/2001.
O processo visa ao preenchimento de 1.020 vagas para a função de Analistas Censitários e 394 vagas para a função de Agentes Censitários de Qualidade.
FUNÇÃO PRÉ-REQUISITO REMUNERAÇÃO NÚMERO DE VAGAS
AGENTE CENSITÁRIO DE QUALIDADE Ensino Médio Completo R$ 2.932,00 394
ANALISTA CENSITÁRIO Curso Superior Completo R$ 5.255,40 1.020
A taxa de inscrição será no valor de R$ 38,50.
3. REQUISITOS PARA CONTRATAÇÃO
O candidato deverá possuir o nível de escolaridade exigido e apresentar declaração de próprio punho. Todos os requisitos deverão ser comprovados mediante documentos originais ou cópias autenticadas.
4. DA SOLICITAÇÃO DE ISENÇÃO
10. DA PROVA OBJETIVA
Agente Censitário de Qualidade: Língua Portuguesa 15 1.00; Raciocínio Lógico Quantitativo 10 1.00; Geografia 15 1.00; Conhecimentos Técnicos 20 1.00. Eliminatório e Classificatório.
Analista Censitário: Língua Portuguesa 15 1.00; Raciocínio Lógico Quantitativo 10 1.00; Conhecimentos Específicos 35 1.00. Eliminatório e Classificatório.
Para Analista Censitário será considerado aprovado quem acertar, no mínimo, 40% do total e, no mínimo, 1 (uma) questão de cada disciplina.
11. RESULTADOS
ANEXO III – CONTEÚDOS PROGRAMÁTICOS
ANALISTA CENSITÁRIO DESIGN: Fundamentos de design; pesquisa com usuários; prototipação; acessibilidade; design systems.
AGENTE CENSITÁRIO DE QUALIDADE: Geografia; cartografia; conhecimentos técnicos.
ANEXO IV – CRONOGRAMA PREVISTO
Solicitação de isenção 10/09/2026 a 12/09/2026
Inscrições 10/09/2026 a 25/09/2026
Aplicação da prova objetiva 18/10/2026
Divulgação do gabarito 19/10/2026
Resultado final 20/11/2026
`;

test('summary keeps vacancies and salary values concise', () => {
  const vacancies = extractVacancies(EDITAL);
  assert.equal(vacancies[0].count, '1.020');
  assert.equal(vacancies[1].count, '394');
  assert.deepEqual(extractSalaries(EDITAL), ['R$ 2.932,00', 'R$ 5.255,40']);
});

test('timeline ignores legal citation dates and keeps cronogram dates', () => {
  const dates = extractImportantDates(EDITAL);
  const joined = JSON.stringify(dates);
  assert.match(joined, /10\/09\/2026/);
  assert.match(joined, /18\/10\/2026/);
  assert.doesNotMatch(joined, /1993|2001/);
});

test('programmatic content only appears when a role selected by AI is supplied', () => {
  assert.deepEqual(extractProgramContent(EDITAL, ''), []);
  const content = extractProgramContent(EDITAL, 'Analista Censitário Design');
  assert.ok(content.length > 0);
  assert.match(content.join(' '), /design|pesquisa|prototipa/i);
});

test('exam is reduced to candidate-relevant facts', () => {
  const exam = extractExam(EDITAL, 'Analista Censitário Design');
  assert.ok(exam.some((item) => /Prova objetiva/i.test(item)));
  assert.ok(exam.some((item) => /Língua Portuguesa: 15 questões/i.test(item)));
  assert.ok(exam.some((item) => /Conhecimentos Específicos: 35 questões/i.test(item)));
  assert.ok(exam.every((item) => item.length < 180));
});

test('candidate summary does not expose program content without AI role', () => {
  const summary = buildCandidateSummary(EDITAL, { modality: '' });
  assert.equal(summary.fee, 'R$ 38,50');
  assert.deepEqual(summary.program, []);
  assert.ok(summary.stages.some((item) => /Prova objetiva/i.test(item)));
  assert.ok(summary.documents.length <= 8);
});
