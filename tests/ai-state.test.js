import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_STATE,
  aiBadgeLabel,
  aiEmptyMessage,
  aiStatusMessage,
} from '../docs/ai-state.js';

test('missing profile area is not reported as an AI loading failure', () => {
  assert.match(aiStatusMessage(AI_STATE.SKIPPED_NO_PROFILE_AREA), /Informe sua área \/ profissão/);
  assert.doesNotMatch(aiStatusMessage(AI_STATE.SKIPPED_NO_PROFILE_AREA), /indisponível|não pôde ser carregada/i);
  assert.equal(aiBadgeLabel(AI_STATE.SKIPPED_NO_PROFILE_AREA), 'AGUARDANDO ÁREA');
  assert.match(aiEmptyMessage(AI_STATE.SKIPPED_NO_PROFILE_AREA), /comparar semanticamente/i);
});

test('missing role candidates is reported separately from runtime failure', () => {
  assert.match(aiStatusMessage(AI_STATE.SKIPPED_NO_ROLE_CANDIDATES), /títulos de cargo suficientes/i);
  assert.equal(aiBadgeLabel(AI_STATE.SKIPPED_NO_ROLE_CANDIDATES), 'SEM CARGOS SUFICIENTES');
});

test('runtime failure keeps the safe fallback message', () => {
  assert.match(aiStatusMessage(AI_STATE.UNAVAILABLE), /modo de segurança/i);
  assert.match(aiStatusMessage(AI_STATE.UNAVAILABLE), /indisponível/i);
  assert.equal(aiBadgeLabel(AI_STATE.UNAVAILABLE), 'MODO DE SEGURANÇA');
});

test('active local AI has an explicit success state', () => {
  assert.equal(aiStatusMessage(AI_STATE.ACTIVE), 'Radar concluído com IA local.');
  assert.equal(aiBadgeLabel(AI_STATE.ACTIVE), 'ATIVA');
});
