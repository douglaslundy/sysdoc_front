# Indicadores de Qualidade — Monitor APS

Base normativa: **Portaria GM/MS nº 6.907/2025** (vigência: 2º quadrimestre/2025 em diante).

> Thresholds implementados em `backend/src/services/classificacao.service.js`.
> Verificar fichas técnicas oficiais antes de implantar em produção:
> https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas

---

## Bloco A — eSF e eAP (Equipes de Saúde da Família e Atenção Primária)

### IND 1 — Mais Acesso à Atenção Primária

| Item | Detalhe |
|------|---------|
| **Numerador** | Atendimentos por demanda programada + espontânea + escuta inicial + consulta do dia + urgência |
| **Denominador** | Total de atendimentos realizados pela equipe no quadrimestre |
| **Tabela DW** | `fat_atendimento_individual` (`tp_atend IN (1,2,3,4,5)`) |
| **Thresholds** | Regular: <20% · Suficiente: ≥20% · Bom: ≥40% · Ótimo: ≥60% |

---

### IND 2 — Cuidado Longitudinal da Criança

| Item | Detalhe |
|------|---------|
| **Numerador** | Crianças 0-2 anos com: ≥9 consultas médico/enf. + ≥9 registros peso/altura + ≥2 visitas ACS + vacinação completa |
| **Denominador** | Total de crianças 0-2 anos cadastradas na equipe |
| **Tabelas DW** | `fat_atendimento_individual`, `fat_vacinacao`, `fat_visita_domiciliar`, `fat_cad_individual` |
| **Vacinas (SIGTAP)** | DTP+HepB+HiB (89210099), Pólio (89210196), Tríplice Viral (89210218), Pneumocócica (89210170) |
| **Thresholds** | Regular: <30% · Suficiente: ≥30% · Bom: ≥60% · Ótimo: ≥80% |

---

### IND 3 — Cuidado da Gestante e Puérpera

| Item | Detalhe |
|------|---------|
| **Numerador** | Gestantes com pré-natal adequado (≥6 consultas) + exames + vacinação (dTpa) + consulta puerperal |
| **Denominador** | Total de gestantes acompanhadas pela equipe no quadrimestre |
| **Tabela DW** | `fat_atendimento_individual` (CID Z34/Z35/Z36; CIAP W78/W79/W84) + `vw_acompanhamento_pre_natal` |
| **Thresholds** | Regular: <40% · Suficiente: ≥40% · Bom: ≥65% · Ótimo: ≥85% |

---

### IND 4 — Cuidado da Pessoa com Hipertensão

| Item | Detalhe |
|------|---------|
| **Numerador** | Hipertensos com ≥2 consultas médico/enf. + aferição de PA documentada + PA controlada |
| **Denominador** | Total de pessoas com HAS cadastradas na equipe |
| **Tabela DW** | `fat_atendimento_individual` (CIAP K86/K87; CID I10-I15) |
| **Thresholds** | Regular: <35% · Suficiente: ≥35% · Bom: ≥60% · Ótimo: ≥80% |

---

### IND 5 — Cuidado da Pessoa com Diabetes

| Item | Detalhe |
|------|---------|
| **Numerador** | Diabéticos com ≥2 consultas médico/enf. + HbA1c solicitada + controle glicêmico adequado |
| **Denominador** | Total de pessoas com DM cadastradas na equipe |
| **Tabela DW** | `fat_atendimento_individual` (CIAP T90; CID E10-E14) |
| **Thresholds** | Regular: <35% · Suficiente: ≥35% · Bom: ≥60% · Ótimo: ≥80% |
| **Nota dev** | HbA1c não disponível no schema DW de dev — subindicador retorna 0 |

---

### IND 6 — Cuidado da Pessoa Idosa

| Item | Detalhe |
|------|---------|
| **Numerador** | Idosos (≥60 anos) com ≥2 consultas + avaliação funcional + visita domiciliar ACS |
| **Denominador** | Total de idosos cadastrados na equipe |
| **Tabelas DW** | `fat_atendimento_individual`, `fat_visita_domiciliar` |
| **Thresholds** | Regular: <30% · Suficiente: ≥30% · Bom: ≥55% · Ótimo: ≥75% |

---

### IND 7 — Saúde Mental na APS

| Item | Detalhe |
|------|---------|
| **Numerador** | Pessoas com transtorno mental (CIAP P76; CID F20-F99) com atendimento registrado |
| **Denominador** | Total de pessoas com diagnóstico de transtorno mental cadastradas |
| **Tabela DW** | `fat_atendimento_individual` |
| **Thresholds** | Regular: <15% · Suficiente: ≥15% · Bom: ≥30% · Ótimo: ≥50% |

---

### IND 8 — Visita Domiciliar por ACS/TACS

| Item | Detalhe |
|------|---------|
| **Numerador** | Famílias visitadas pelo menos 1× no quadrimestre por ACS ou TACS |
| **Denominador** | Total de famílias cadastradas na equipe |
| **Tabela DW** | `fat_visita_domiciliar` (`tp_prof IN (7,87)` — ACS/TACS) |
| **Thresholds** | Regular: <50% · Suficiente: ≥50% · Bom: ≥70% · Ótimo: ≥85% |

---

### IND 9 — Vacinação na APS

| Item | Detalhe |
|------|---------|
| **Numerador** | Crianças <5 anos com calendário vacinal completo documentado |
| **Denominador** | Total de crianças <5 anos cadastradas |
| **Tabela DW** | `fat_vacinacao` (SIGTAP das vacinas do calendário nacional) |
| **Thresholds** | Regular: <70% · Suficiente: ≥70% · Bom: ≥85% · Ótimo: ≥95% |

---

### IND 10 — Ações Interprofissionais

| Item | Detalhe |
|------|---------|
| **Numerador** | Reuniões de equipe + projetos terapêuticos singulares + atividades coletivas registradas |
| **Denominador** | Total de atendimentos da equipe no quadrimestre |
| **Tabela DW** | `fat_ativ_coletiva`, `fat_atendimento_individual` |
| **Thresholds** | Regular: <20% · Suficiente: ≥20% · Bom: ≥40% · Ótimo: ≥60% |

---

## Bloco C — eSB (Equipes de Saúde Bucal)

### IND 13 — Acesso à Saúde Bucal

| Item | Detalhe |
|------|---------|
| **Numerador** | Primeiras consultas odontológicas programáticas realizadas |
| **Denominador** | Total de cadastros individuais no território da equipe |
| **Tabela DW** | `fat_atendimento_odontologico` (`st_primeira_consulta = true`) |
| **Thresholds** | Regular: <20% · Suficiente: ≥20% · Bom: ≥40% · Ótimo: ≥60% |

---

### IND 14 — Conclusão de Tratamento Odontológico

| Item | Detalhe |
|------|---------|
| **Numerador** | Tratamentos odontológicos concluídos no quadrimestre |
| **Denominador** | Total de tratamentos iniciados pela equipe |
| **Tabela DW** | `fat_atendimento_odontologico` (`st_conclusao_tratamento = true`) |
| **Thresholds** | Regular: <30% · Suficiente: ≥30% · Bom: ≥50% · Ótimo: ≥70% |

---

### IND 15 — Ações Coletivas em Saúde Bucal

| Item | Detalhe |
|------|---------|
| **Numerador** | Participantes em ações coletivas de saúde bucal (escovação supervisionada, educação em saúde) |
| **Denominador** | Total de cadastros individuais no território da equipe |
| **Tabela DW** | `fat_ativ_coletiva` (`tp_atividade IN (11,12,13)`) |
| **Thresholds** | Regular: <10% · Suficiente: ≥10% · Bom: ≥25% · Ótimo: ≥40% |

---

## Componente II — Vínculo e Acompanhamento Territorial

| Item | Detalhe |
|------|---------|
| **Pontuação** | 1,5 pts/cadastro individual + domiciliar · 0,75 pts/só individual |
| **Meta** | Calculada proporcionalmente ao parâmetro de cobertura do porte municipal |
| **Thresholds** | Regular: <40% · Suficiente: ≥40% · Bom: ≥65% · Ótimo: ≥85% |
| **Tabelas DW** | `fat_cad_individual`, `fat_cad_domiciliar` |

---

## Repasse Estimado (Componentes I + II + III)

| Estrato IED | Componente I (Fixo/equipe/mês) |
|-------------|-------------------------------|
| 1           | R$ 18.000                     |
| 2           | R$ 16.000                     |
| 3           | R$ 14.000                     |
| 4           | R$ 12.000                     |

| Classificação | Componente II/III (adicional/mês) |
|---------------|----------------------------------|
| Regular       | R$ 2.000                         |
| Suficiente    | R$ 4.000                         |
| Bom           | R$ 6.000                         |
| Ótimo         | R$ 8.000                         |

> Valores ilustrativos baseados na Portaria 3.493/2024. Verificar tabela de IED do município no SISAB antes de usar em produção.

---

## Notas sobre o Ambiente de Desenvolvimento

O banco Docker de dev contém dados fictícios com variações intencionais:
- **ESF CENTRO** → indicadores propositalmente baixos (classificação Regular/Suficiente)
- **ESF VILA NOVA** → indicadores propositalmente altos (classificação Bom/Ótimo)
- **ESB CENTRO** → dados odontológicos com cobertura parcial

Limitações do schema de dev vs. produção:
- `fat_vacinacao` existe no dev via tabela adicional (03-schema-corrections.sql)
- Dados de PA e HbA1c não disponíveis — subindicadores retornam 0 em dev
- Registros de atividades coletivas reduzidos no seed
