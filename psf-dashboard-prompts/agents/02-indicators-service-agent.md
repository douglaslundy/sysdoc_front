# agents/02-indicators-service-agent.md

## Nome
`indicators-service-agent`

## Papel
Responsável por criar todos os **serviços de cálculo dos indicadores** do Componente de Qualidade e do Componente de Vínculo e Acompanhamento Territorial. Este agente transforma queries SQL em dados estruturados prontos para o frontend.

## Dependências
- `database-config-agent` deve estar completo (conexão ao banco funcionando)
- Arquivos `context/esus-pec-database.md` lidos e compreendidos

## Estrutura de Saída Padrão

Cada indicador deve retornar o seguinte formato JSON:
```json
{
  "indicador": {
    "id": 2,
    "nome": "Cuidado Longitudinal da Criança",
    "bloco": "eSF_eAP",
    "equipe": {
      "ine": "0000123456",
      "nome": "ESF Vila Nova"
    },
    "periodo": {
      "ano": 2025,
      "quadrimestre": 2,
      "competencia_inicio": "2025-05",
      "competencia_fim": "2025-08"
    },
    "resultado": {
      "numerador": 42,
      "denominador": 68,
      "percentual": 61.76,
      "classificacao": "bom",
      "meta_suficiente": 40.0,
      "meta_bom": 60.0,
      "meta_otimo": 80.0
    },
    "subindicadores": [
      { "nome": "≥9 consultas médico/enfermeiro", "valor": 42, "total": 68 },
      { "nome": "≥9 registros peso/altura", "valor": 38, "total": 68 },
      { "nome": "≥2 visitas ACS", "valor": 55, "total": 68 },
      { "nome": "Vacinação completa", "valor": 60, "total": 68 }
    ]
  }
}
```

## Tarefas

### TAREFA 1: Criar serviço de Componente de Vínculo

Arquivo: `modules/monitor-aps/backend/src/services/vinculo.service.js`

Calcular para cada equipe:
1. **Pontuação de Cadastros**
   - Cadastro individual isolado = 0,75 ponto
   - Cadastro individual + domiciliar = 1,5 ponto
   - Ponto de corte: parâmetro de referência vs. teto máximo
   
2. **Cobertura de Grupos Prioritários**
   - Crianças < 5 anos acompanhadas / total cadastradas
   - Idosos ≥ 60 anos acompanhados / total cadastrados
   - Beneficiários BPC acompanhados / total cadastrados
   - Beneficiários Bolsa Família acompanhados / total cadastrados

3. **Classificação final** (ótimo/bom/suficiente/regular)

Query base:
```sql
SELECT
  de.nu_ine,
  de.no_equipe,
  COUNT(DISTINCT fci.co_cidadao) AS total_cadastros_ind,
  COUNT(DISTINCT fcd.co_cidadao_responsavel) AS total_cadastros_dom,
  COUNT(DISTINCT CASE WHEN fci.st_bolsa_familia THEN fci.co_cidadao END) AS bolsa_familia,
  COUNT(DISTINCT CASE WHEN fci.st_bpc THEN fci.co_cidadao END) AS bpc,
  COUNT(DISTINCT CASE 
    WHEN EXTRACT(YEAR FROM AGE(fci.dt_nascimento)) < 5 THEN fci.co_cidadao 
  END) AS criancas_0_5,
  COUNT(DISTINCT CASE 
    WHEN EXTRACT(YEAR FROM AGE(fci.dt_nascimento)) >= 60 THEN fci.co_cidadao 
  END) AS idosos_60_mais
FROM fat_cad_individual fci
JOIN dim_equipe de ON fci.co_dim_equipe = de.co_seq_dim_equipe
LEFT JOIN fat_cad_domiciliar fcd ON fci.co_cidadao = fcd.co_cidadao_responsavel
WHERE de.st_ativo = true
GROUP BY de.nu_ine, de.no_equipe;
```

### TAREFA 2: Criar serviço de Indicadores de Qualidade (Bloco A: eSF/eAP)

Arquivo: `modules/monitor-aps/backend/src/services/qualidade-esf.service.js`

Implementar função para cada indicador:

**`calcularIndicador1_AcessoAPS(ine, ano, quadrimestre)`**
- Numerador: atendimentos com tipos variados (programado + espontâneo + escuta + consulta dia + urgência)
- Denominador: total de atendimentos da equipe no período
- Meta bom: ≥ 3 tipos de demanda representando ≥ 10% cada

**`calcularIndicador2_CriancaLongitudinal(ine, ano, quadrimestre)`**
- Denominador: crianças com < 24 meses cadastradas na equipe
- Para cada subindicador:
  - ≥9 consultas médico/enfermeiro → JOIN fat_atendimento_individual + filtro CBO médico/enfermeiro
  - ≥9 registros de antropometria → fat_atendimento_individual WHERE nu_peso IS NOT NULL
  - ≥2 visitas ACS → fat_visita_domiciliar WHERE cbo = '516220'
  - Vacinação completa → JOIN fat_procedimento_individual + códigos SIGTAP de vacinas

**`calcularIndicador3_Gestante(ine, ano, quadrimestre)`**
- Usar `vw_acompanhamento_pre_natal`
- Numerador: gestantes com ≥6 consultas pré-natal
- Denominador: gestantes cadastradas no período

**`calcularIndicador4_Hipertensao(ine, ano, quadrimestre)`**
- Usar `vw_acompanhamento_hipertensao`
- Numerador: pacientes hipertensos com ≥2 atendimentos + PA registrada
- Denominador: pacientes hipertensos cadastrados na equipe

**`calcularIndicador5_Diabetes(ine, ano, quadrimestre)`**
- Usar `vw_acompanhamento_diabetes`
- Numerador: diabéticos com ≥2 atendimentos + HbA1c ou glicemia registrada
- Denominador: diabéticos cadastrados na equipe

**`calcularIndicador8_VisitaACS(ine, ano, quadrimestre)`**
- Numerador: pessoas com ≥1 visita domiciliar no quadrimestre
- Denominador: pessoas cadastradas na equipe no território

### TAREFA 3: Criar serviço de Indicadores eSB (Bloco C)

Arquivo: `modules/monitor-aps/backend/src/services/qualidade-esb.service.js`

**`calcularIndicador13_AcessoBucal(ine, ano, quadrimestre)`**
- fat_atendimento_odontologico WHERE st_primeira_consulta = true
- Proporção sobre população cadastrada

**`calcularIndicador14_ConclusaoTratamento(ine, ano, quadrimestre)`**
- fat_atendimento_odontologico WHERE st_conclusao_tratamento = true
- Numerador / total tratamentos iniciados

**`calcularIndicador15_AcoesColетivas(ine, ano, quadrimestre)`**
- fat_ativ_coletiva WHERE equipe é eSB
- Total de participantes em ações coletivas

### TAREFA 4: Criar função de classificação de equipes

Arquivo: `modules/monitor-aps/backend/src/services/classificacao.service.js`

```javascript
/**
 * Classifica a equipe por componente baseado nos thresholds
 * @param {number} percentual - Valor obtido (0-100)
 * @param {object} thresholds - { regular, suficiente, bom, otimo }
 * @returns {string} 'regular' | 'suficiente' | 'bom' | 'otimo'
 */
function classificar(percentual, thresholds) {
  if (percentual >= thresholds.otimo) return 'otimo';
  if (percentual >= thresholds.bom) return 'bom';
  if (percentual >= thresholds.suficiente) return 'suficiente';
  return 'regular';
}

/**
 * Tabela de thresholds por indicador (a ser completada com as fichas técnicas do MS)
 * Fonte: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
 */
const THRESHOLDS = {
  indicador_2_crianca: { regular: 0, suficiente: 30, bom: 60, otimo: 80 },
  indicador_3_gestante: { regular: 0, suficiente: 40, bom: 65, otimo: 85 },
  indicador_4_hipertensao: { regular: 0, suficiente: 35, bom: 60, otimo: 80 },
  indicador_5_diabetes: { regular: 0, suficiente: 35, bom: 60, otimo: 80 },
  indicador_8_visita_acs: { regular: 0, suficiente: 50, bom: 70, otimo: 85 },
  indicador_13_acesso_bucal: { regular: 0, suficiente: 20, bom: 40, otimo: 60 },
  indicador_14_conclusao_tratamento: { regular: 0, suficiente: 30, bom: 50, otimo: 70 },
  // IMPORTANTE: Verificar os valores reais nas fichas técnicas do Ministério da Saúde
  // URL: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
};

/**
 * Estima o valor do repasse com base nas classificações
 */
function calcularRepasseEstimado(equipes, estrato_ied) {
  const VALORES_FIXO = { 1: 18000, 2: 16000, 3: 14000, 4: 12000 };
  const VALORES_COMPONENTE = { regular: 2000, suficiente: 4000, bom: 6000, otimo: 8000 };
  
  return equipes.map(equipe => ({
    ine: equipe.ine,
    nome: equipe.nome,
    componente_fixo: VALORES_FIXO[estrato_ied] || 12000,
    componente_vinculo: VALORES_COMPONENTE[equipe.classificacao_vinculo],
    componente_qualidade: VALORES_COMPONENTE[equipe.classificacao_qualidade],
    total_estimado: (VALORES_FIXO[estrato_ied] || 12000) 
                  + VALORES_COMPONENTE[equipe.classificacao_vinculo]
                  + VALORES_COMPONENTE[equipe.classificacao_qualidade]
  }));
}

module.exports = { classificar, THRESHOLDS, calcularRepasseEstimado };
```

### TAREFA 5: Criar todas as rotas da API de indicadores

Arquivo: `modules/monitor-aps/backend/src/routes/indicadores.routes.js`

Endpoints:
```
GET /api/monitor-aps/indicadores/resumo
  → Retorna resumo de todos os indicadores do município
  → Query params: ano, quadrimestre

GET /api/monitor-aps/indicadores/vinculo
  → Componente de vínculo e acompanhamento territorial
  → Query params: ano, quadrimestre, ine (opcional)

GET /api/monitor-aps/indicadores/qualidade
  → Todos os 15 indicadores de qualidade
  → Query params: ano, quadrimestre, ine (opcional), bloco (esf|esb|emulti)

GET /api/monitor-aps/indicadores/qualidade/:id
  → Indicador específico com subindicadores detalhados
  → Query params: ano, quadrimestre, ine

GET /api/monitor-aps/indicadores/repasse
  → Estimativa de repasse mensal por equipe
  → Query params: ano, quadrimestre

GET /api/monitor-aps/indicadores/equipes
  → Lista equipes com classificação atual em todos os componentes
  → Query params: ano, quadrimestre

GET /api/monitor-aps/indicadores/historico
  → Evolução dos indicadores ao longo dos quadrimestres
  → Query params: ine, indicador_id, anos (ex: 2024,2025)
```

## Critérios de Aceitação

- [ ] Todos os 15 indicadores retornam dados estruturados no formato padrão
- [ ] Classificações (ótimo/bom/suficiente/regular) são calculadas corretamente
- [ ] Estimativa de repasse é calculada por equipe e municipalmente
- [ ] Filtros por INE, ano e quadrimestre funcionam
- [ ] Queries não demoram mais de 10 segundos (adicionar índices se necessário)
- [ ] Erros de SQL retornam mensagem amigável, não stack trace
- [ ] Thresholds dos indicadores estão documentados com a fonte (fichas técnicas MS)
