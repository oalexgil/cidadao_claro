import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCandidateSummary,
  extractImportantDates,
  extractProgramContent,
  extractVacancies,
  extractSalaries,
  extractFees,
  extractStages,
} from '../docs/candidate-summary.js';
import { extractExamSummary } from '../docs/exam-summary.js';

const EDITAL = `
Lei nº 8.745, de 09/12/1993. Decreto de 16/08/2001.
A seleção dos candidatos dar-se-á por meio de prova objetiva, de caráter eliminatório e classificatório.
O processo visa ao preenchimento de 1.020 vagas para a função de Analistas Censitários e 394 vagas para a função de Agentes Censitários de Qualidade.
FUNÇÃO PRÉ-REQUISITO REMUNERAÇÃO NÚMERO DE VAGAS
AGENTE CENSITÁRIO DE QUALIDADE Ensino Médio Completo R$ 2.932,00 394
ANALISTA CENSITÁRIO Curso Superior Completo R$ 5.255,40 1.020
O valor da taxa de inscrição será de: - Agente Censitário de Qualidade (ACQ): R$ 41,76; - Analista Censitário (AC): R$ 37,50.
3. REQUISITOS PARA CONTRATAÇÃO
O candidato deverá possuir o nível de escolaridade exigido e apresentar declaração de próprio punho. Todos os requisitos deverão ser comprovados mediante documentos originais ou cópias autenticadas.
4. DA SOLICITAÇÃO DE ISENÇÃO
10. DA PROVA OBJETIVA
TABELA 10.1 NÍVEL MÉDIO FUNÇÃO FASE TIPO DE PROVA DISCIPLINA Nº DE QUESTÕES Agente Censitário de Qualidade Única Objetiva Língua Portuguesa 15 1.00; Raciocínio Lógico Quantitativo 10 1.00; Geografia 15 1.00; Conhecimentos Técnicos 20 1.00. Eliminatório e Classificatório.
TABELA 10.2 NÍVEL SUPERIOR FUNÇÃO FASE TIPO DE PROVA DISCIPLINA Nº DE QUESTÕES Analista Censitário Única Objetiva Língua Portuguesa 15 1.00; Raciocínio Lógico Quantitativo 10 1.00; Conhecimentos Específicos 35 1.00. Eliminatório e Classificatório.
10.2 Os conteúdos programáticos referentes às Provas Objetivas são os constantes do Anexo III.
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

test('summary links vacancies and salary values to the correct roles', () => {
  const vacancies = extractVacancies(EDITAL);
  const joined = JSON.stringify(vacancies);
  assert.match(joined, /Agente Censitário de Qualidade/);
  assert.match(joined, /394/);
  assert.match(joined, /Analista Censitário/);
  assert.match(joined, /1\.020/);
  assert.deepEqual(extractSalaries(EDITAL), ['R$ 2.932,00', 'R$ 5.255,40']);
});

test('role-specific registration fees remain associated with each role', () => {
  const fees = extractFees(EDITAL);
  const joined = JSON.stringify(fees);
  assert.match(joined, /41,76/);
  assert.match(joined, /37,50/);
  assert.match(joined, /Agente Censitário/);
  assert.match(joined, /Analista Censitário/);
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
  const content = extractProgramContent(EDITAL, 'Designer Analista Censitário');
  assert.ok(content.length > 0);
  assert.match(content.join(' '), /design|pesquisa|prototipa/i);
});

test('exam is reduced to the selected role facts', () => {
  const exam = extractExamSummary(EDITAL, 'Designer Analista Censitário');
  assert.ok(exam.some((item) => /Prova objetiva/i.test(item)));
  assert.ok(exam.some((item) => /Analista Censitário.*Língua Portuguesa: 15 questões/i.test(item)));
  assert.ok(exam.some((item) => /Conhecimentos Específicos: 35 questões/i.test(item)));
  assert.ok(exam.every((item) => item.length < 300));
});

test('without a professional profile the exam shows both available role structures', () => {
  const exam = extractExamSummary(EDITAL, '');
  const joined = exam.join(' ');
  assert.match(joined, /ACQ/);
  assert.match(joined, /Analista/);
  assert.match(joined, /Conhecimentos Técnicos: 20 questões/);
  assert.match(joined, /Conhecimentos Específicos: 35 questões/);
});

test('selection stages do not invent a discursive exam', () => {
  const stages = extractStages(`${EDITAL}\nNão há previsão de prova discursiva neste certame.`);
  assert.deepEqual(stages, ['Prova objetiva — eliminatória e classificatória']);
});

test('candidate summary does not expose program content without AI role', () => {
  const summary = buildCandidateSummary(EDITAL, { modality: '' });
  assert.equal(summary.program.length, 0);
  assert.equal(summary.fees.length, 2);
  assert.ok(summary.stages.some((item) => /Prova objetiva/i.test(item)));
  assert.ok(summary.documents.length <= 8);
});
