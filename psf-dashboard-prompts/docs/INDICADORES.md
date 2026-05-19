# docs/INDICADORES.md — Referência Técnica dos 15 Indicadores

## Fonte Normativa
Portaria GM/MS nº 6.907, de 29 de abril de 2025 (altera Portaria 3.493/2024)
Fichas técnicas: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas

> ⚠️ IMPORTANTE: Os thresholds abaixo são baseados em informações disponíveis. 
> Sempre verificar os valores exatos nas fichas técnicas oficiais do MS.

---

## BLOCO A — Equipes de Saúde da Família (eSF) e de Atenção Primária (eAP)

### Indicador 1: Mais Acesso à Atenção Primária

**Objetivo**: Garantir universalidade e equidade de acesso, diversificando os tipos de demanda atendidos.

**Fórmula**:
- Proporção de atendimentos por cada tipo de demanda no quadrimestre
- Tipos: Programado | Espontâneo | Escuta Inicial | Consulta do Dia | Urgência

**Tabela DW**: `fat_atendimento_individual` + `dim_equipe` + `dim_tempo`

**Coluna chave**: `co_dim_tipo_atendimento`
- 1 = Consulta programada
- 2 = Consulta espontânea
- 3 = Escuta inicial
- 4 = Consulta do dia
- 5 = Atendimento de urgência

**Thresholds** *(verificar ficha técnica)*: a definir

---

### Indicador 2: Cuidado Longitudinal da Criança

**Objetivo**: Garantir o acompanhamento integral da criança nos primeiros 2 anos de vida.

**Denominador**: Crianças com < 24 meses de vida cadastradas na equipe no período.

**Numerador**: Crianças que cumpriram TODOS os subindicadores:
1. ≥ 9 consultas presenciais/remotas por médico ou enfermeiro até 2 anos
2. ≥ 9 registros de peso E altura até 2 anos  
3. ≥ 2 visitas domiciliares realizadas por ACS/TACS
4. Vacinação completa (DTP/Penta, HepB, HiB, Pólio, Tríplice Viral, Pneumocócica)

**Tabelas DW**:
- `fat_atendimento_individual` (consultas médico/enfermeiro)
- `fat_visita_domiciliar` (visitas ACS)
- `fat_procedimento_individual` (vacinas — SIGTAP)
- `fat_cad_individual` (faixa etária)

**CBOs médico/enfermeiro**: 225125, 225142, 223505, 223565
**CBO ACS**: 516220

---

### Indicador 3: Cuidado da Gestante e Puérpera

**Objetivo**: Garantir pré-natal adequado e atenção ao puerpério.

**Denominador**: Gestantes cadastradas na equipe com DPP no período de avaliação.

**Numerador**: Gestantes com:
- ≥ 6 consultas pré-natal
- Exames obrigatórios realizados (sífilis, HIV, glicemia, tipagem sanguínea)
- Vacinação anti-tetânica e anti-hepatite B
- ≥ 1 consulta puerperal (até 42 dias pós-parto)

**Tabelas DW**: `vw_acompanhamento_pre_natal` (visualização consolidada do PEC)

---

### Indicador 4: Cuidado da Pessoa com Hipertensão Arterial

**Objetivo**: Garantir o acompanhamento periódico de pessoas hipertensas.

**Denominador**: Pessoas com diagnóstico de HAS (CIAP2: K86, K87 / CID10: I10-I15) cadastradas.

**Numerador**: Hipertensos com:
- ≥ 2 atendimentos no quadrimestre
- Registro de aferição de pressão arterial
- Controle pressórico documentado

**Tabelas DW**: `vw_acompanhamento_hipertensao` (visualização) ou `fat_atendimento_individual` + `dim_ciap2`/`dim_cid10`

---

### Indicador 5: Cuidado da Pessoa com Diabetes Mellitus

**Objetivo**: Garantir acompanhamento e controle metabólico de diabéticos.

**Denominador**: Pessoas com diagnóstico de DM (CIAP2: T90 / CID10: E10-E14) cadastradas.

**Numerador**: Diabéticos com:
- ≥ 2 atendimentos no quadrimestre
- Registro de HbA1c OU glicemia capilar
- Controle glicêmico documentado

**Tabelas DW**: `vw_acompanhamento_diabetes` ou `fat_atendimento_individual`

---

### Indicador 6: Cuidado da Pessoa Idosa

**Objetivo**: Promover envelhecimento ativo e cuidado integral ao idoso.

**Denominador**: Pessoas ≥ 60 anos cadastradas na equipe.

**Numerador**: Idosos com:
- Avaliação funcional realizada (mini-mental, escala de Barthel ou similar)
- ≥ 1 visita domiciliar (para idosos com mobilidade reduzida)
- Rastreamentos realizados (quedas, cognição, polifarmácia)

**Tabelas DW**: `fat_atendimento_individual` + `fat_visita_domiciliar` + `fat_cad_individual`

---

### Indicador 7: Saúde Mental na APS

**Objetivo**: Garantir cuidado em saúde mental integrado à APS.

**Numerador**: Atendimentos com registro de problema/condição de saúde mental (CIAP2: P, CID10: F)
- OU aplicação de escalas (PHQ-9, GAD-7)
- OU projeto terapêutico singular (PTS) com componente de saúde mental

**Tabelas DW**: `fat_atendimento_individual` + `dim_ciap2` + `dim_cid10`

---

### Indicador 8: Visita Domiciliar por ACS/TACS

**Objetivo**: Garantir presença do ACS no território com visitas domiciliares regulares.

**Denominador**: Pessoas cadastradas na área de responsabilidade da equipe.

**Numerador**: Pessoas com ≥ 1 visita domiciliar realizada por ACS ou TACS no quadrimestre.

**Tabelas DW**: `fat_visita_domiciliar` + `dim_cbo` (CBO: 516220 = ACS)

---

### Indicador 9: Vacinação na APS

**Objetivo**: Manter e ampliar cobertura vacinal pelo calendário nacional.

**Denominador**: Por faixa etária e vacina específica (crianças, adultos, idosos, gestantes).

**Numerador**: Pessoas com registros de vacinação no PEC.

**Tabelas DW**: `fat_procedimento_individual` (códigos SIGTAP de vacinas)

**Códigos SIGTAP vacinas** *(principais)*:
- 0301010110 — BCG
- 0301010129 — Hepatite B
- 0301010196 — Pentavalente (DTP/HiB/HepB)
- 0301010218 — Pólio
- 0301010234 — Tríplice Viral (SCR)
- 0301010242 — Pneumocócica 10V

---

### Indicador 10: Ações Interprofissionais e Coletivas

**Objetivo**: Promover o trabalho em equipe e as ações de saúde coletiva.

**Numerador**: Atividades coletivas realizadas + reuniões de equipe registradas
+ projetos terapêuticos singulares (PTS).

**Tabelas DW**: `fat_ativ_coletiva`

---

## BLOCO B — Equipes Multiprofissionais (eMulti)

### Indicador 11: Cuidado Interprofissional

**Objetivo**: Garantir que a eMulti realize ações integradas com as eSF no território.

**Numerador**: Atendimentos interprofissionais, matriciamentos e ações conjuntas com eSF.

---

### Indicador 12: Apoio Matricial

**Objetivo**: Avaliar o apoio da eMulti nas condições crônicas e saúde mental.

**Numerador**: Casos de apoio matricial registrados para hipertensos, diabéticos, SM.

---

## BLOCO C — Equipes de Saúde Bucal (eSB)

### Indicador 13: Acesso à Saúde Bucal

**Objetivo**: Ampliar o acesso da população aos serviços odontológicos.

**Denominador**: População cadastrada na área de abrangência.

**Numerador**: Pessoas com registro de primeira consulta odontológica programática.

**Tabelas DW**: `fat_atendimento_odontologico` WHERE `st_primeira_consulta = true`

---

### Indicador 14: Conclusão de Tratamento Odontológico

**Objetivo**: Garantir que os tratamentos iniciados sejam concluídos.

**Denominador**: Pessoas que iniciaram tratamento odontológico no período.

**Numerador**: Pessoas com registro de conclusão de tratamento.

**Tabelas DW**: `fat_atendimento_odontologico` WHERE `st_conclusao_tratamento = true`

---

### Indicador 15: Ações Coletivas em Saúde Bucal

**Objetivo**: Garantir ações coletivas de promoção e prevenção em saúde bucal.

**Numerador**: Pessoas participantes em ações coletivas de saúde bucal
(escovação supervisionada, aplicação de flúor, educação em saúde bucal).

**Tabelas DW**: `fat_ativ_coletiva` + `dim_equipe` (tipo eSB)

---

## Tabela Resumo de Classificação

| Classificação | Cor | Valor Repasse (Componente) |
|-------------|-----|--------------------------|
| Ótimo       | 🟢 Verde | R$ 8.000/equipe/mês |
| Bom         | 🔵 Azul  | R$ 6.000/equipe/mês |
| Suficiente  | 🟠 Laranja | R$ 4.000/equipe/mês |
| Regular     | 🔴 Vermelho | R$ 2.000/equipe/mês |

*Valores do Componente de Qualidade e Componente de Vínculo separadamente.*

---

## Critérios de Bloqueio Financeiro (Portaria 6.907/2025, Anexo I)

O sistema deve alertar quando:
- eSF/eAP sem envio de produção por **2 competências consecutivas** → suspensão proporcional
- eSF/eAP sem envio por **6 competências consecutivas** → suspensão total do componente fixo
- ACS sem envio por **6 competências** → suspensão do incentivo ACS
- ACS sem envio por **12 competências** → descredenciamento automático
- eSF/eAP suspensão total por **12 competências** → revogação do INE
