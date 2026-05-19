/**
 * Thresholds dos indicadores de qualidade.
 * Fonte: Fichas Técnicas — Portaria GM/MS nº 6.907/2025
 * https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
 *
 * ⚠️ ATENÇÃO: Verificar e atualizar com os valores oficiais das fichas técnicas
 * do Ministério da Saúde antes de implantar em produção.
 */
const THRESHOLDS = {
  // Bloco A — eSF / eAP
  ind1_acesso_aps:         { suficiente: 20, bom: 40, otimo: 60 },
  ind2_crianca:            { suficiente: 30, bom: 60, otimo: 80 },
  ind3_gestante:           { suficiente: 40, bom: 65, otimo: 85 },
  ind4_hipertensao:        { suficiente: 35, bom: 60, otimo: 80 },
  ind5_diabetes:           { suficiente: 35, bom: 60, otimo: 80 },
  ind6_idoso:              { suficiente: 30, bom: 55, otimo: 75 },
  ind7_saude_mental:       { suficiente: 15, bom: 30, otimo: 50 },
  ind8_visita_acs:         { suficiente: 50, bom: 70, otimo: 85 },
  ind9_vacinacao:          { suficiente: 70, bom: 85, otimo: 95 },
  ind10_interprofissional: { suficiente: 20, bom: 40, otimo: 60 },
  // Bloco C — eSB
  ind13_acesso_bucal:      { suficiente: 20, bom: 40, otimo: 60 },
  ind14_conclusao:         { suficiente: 30, bom: 50, otimo: 70 },
  ind15_coletivas:         { suficiente: 10, bom: 25, otimo: 40 },
  // Vínculo territorial
  vinculo:                 { suficiente: 40, bom: 65, otimo: 85 },
};

/**
 * Classifica um percentual (0-100) segundo os thresholds do indicador.
 */
function classificar(percentual, thresholds) {
  const p = Number(percentual) || 0;
  if (p >= thresholds.otimo)     return 'otimo';
  if (p >= thresholds.bom)       return 'bom';
  if (p >= thresholds.suficiente) return 'suficiente';
  return 'regular';
}

/**
 * Valores de repasse estimados por classificação (R$/mês por equipe).
 * Fonte: Portaria GM/MS 3.493/2024 — valores ilustrativos, verificar tabela IED.
 */
const REPASSE_COMPONENTE_FIXO_IED = { 1: 18000, 2: 16000, 3: 14000, 4: 12000 };
const REPASSE_CLASSIFICACAO      = { regular: 2000, suficiente: 4000, bom: 6000, otimo: 8000 };

function calcularRepasseEstimado(equipes, estrato_ied) {
  const fixo = REPASSE_COMPONENTE_FIXO_IED[estrato_ied] ?? 12000;
  return equipes.map(eq => {
    const vinculo    = REPASSE_CLASSIFICACAO[eq.classificacao_vinculo]    ?? 0;
    const qualidade  = REPASSE_CLASSIFICACAO[eq.classificacao_qualidade]  ?? 0;
    return {
      ine:  eq.ine,
      nome: eq.nome,
      tipo: eq.tipo,
      componente_fixo:      fixo,
      componente_vinculo:   vinculo,
      componente_qualidade: qualidade,
      total_estimado:       fixo + vinculo + qualidade,
    };
  });
}

module.exports = { classificar, THRESHOLDS, calcularRepasseEstimado };
