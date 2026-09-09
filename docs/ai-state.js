export const AI_STATE = Object.freeze({
  ACTIVE: 'active',
  SKIPPED_NO_PROFILE_AREA: 'skipped-no-profile-area',
  SKIPPED_NO_ROLE_CANDIDATES: 'skipped-no-role-candidates',
  UNAVAILABLE: 'unavailable',
});

export function aiStatusMessage(state) {
  switch (state) {
    case AI_STATE.ACTIVE:
      return 'Radar concluído com IA local.';
    case AI_STATE.SKIPPED_NO_PROFILE_AREA:
      return 'Radar concluído. Informe sua área / profissão para ativar o cruzamento semântico com IA local.';
    case AI_STATE.SKIPPED_NO_ROLE_CANDIDATES:
      return 'Radar concluído. Não encontrei títulos de cargo suficientes para o cruzamento semântico; a análise determinística foi aplicada.';
    case AI_STATE.UNAVAILABLE:
    default:
      return 'Radar concluído em modo de segurança; a IA local está indisponível neste navegador.';
  }
}

export function aiBadgeLabel(state) {
  switch (state) {
    case AI_STATE.ACTIVE:
      return 'ATIVA';
    case AI_STATE.SKIPPED_NO_PROFILE_AREA:
      return 'AGUARDANDO ÁREA';
    case AI_STATE.SKIPPED_NO_ROLE_CANDIDATES:
      return 'SEM CARGOS SUFICIENTES';
    case AI_STATE.UNAVAILABLE:
    default:
      return 'MODO DE SEGURANÇA';
  }
}

export function aiEmptyMessage(state) {
  switch (state) {
    case AI_STATE.SKIPPED_NO_PROFILE_AREA:
      return 'Informe sua área / profissão para comparar semanticamente seu perfil com os cargos do edital.';
    case AI_STATE.SKIPPED_NO_ROLE_CANDIDATES:
      return 'Não foram capturados títulos de cargo suficientes no texto para executar a comparação semântica.';
    case AI_STATE.UNAVAILABLE:
      return 'A IA local não pôde ser executada neste navegador. A análise determinística continua disponível.';
    default:
      return 'A IA não capturou títulos de cargo suficientes no texto. A área correlata ainda pode orientar sua busca.';
  }
}
