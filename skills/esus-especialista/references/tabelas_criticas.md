# Tabelas Críticas — e-SUS AB

## Índice
1. [Domínio Cidadão](#cidadão)
2. [Domínio Atendimento PEC](#atendimento-pec)
3. [Domínio CDS — Fichas](#cds--fichas)
4. [Domínio Gestante e Pré-natal](#gestante-e-pré-natal)
5. [Domínio Doenças Crônicas](#doenças-crônicas)
6. [Domínio Vacinação](#vacinação)
7. [Domínio Exames](#exames)
8. [Domínio Saúde Bucal](#saúde-bucal)
9. [Domínio Territorial](#territorial)
10. [Domínio Equipe e Profissional](#equipe-e-profissional)

---

## Cidadão

### `sch_cidadao.tb_cidadao`
Tabela mestra de cadastro de cidadãos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_seq_cidadao | BIGINT PK | ID interno único |
| no_cidadao | VARCHAR | Nome completo |
| nu_cns | VARCHAR(15) | Cartão Nacional de Saúde |
| nu_cpf | VARCHAR(11) | CPF (sem pontuação) |
| dt_nascimento | DATE | Data de nascimento |
| co_sexo | CHAR(1) | M=Masculino, F=Feminino |
| co_raca_cor | INT | Raça/cor (tabela de domínio) |
| co_etnia | INT | Etnia indígena (se aplicável) |
| st_ativo | BOOLEAN | Cadastro ativo no sistema |
| dt_obito | DATE | Data do óbito (NULL = vivo) |

**Relacionamentos:**
- `tb_cidadao_contato` → telefones e emails
- `tb_cidadao_endereco` → endereço atual
- `tb_vinculo_equipe_cidadao` → vínculo com equipe eSF

---

### `sch_cidadao.tb_vinculo_equipe_cidadao`
Vínculo do cidadão com a equipe de saúde da família.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_cidadao | BIGINT FK | → tb_cidadao |
| nu_ine | VARCHAR(10) | INE da equipe |
| nu_microarea | VARCHAR(3) | Microárea do ACS |
| st_ativo | BOOLEAN | Vínculo ativo |
| dt_inicio_vinculo | DATE | Início do vínculo |

---

## Atendimento PEC

### `sch_atendimento.tb_atendimento_individual`
Todos os atendimentos individuais realizados pelo PEC.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_seq_atendimento | BIGINT PK | ID do atendimento |
| co_cidadao | BIGINT FK | Cidadão atendido |
| dt_atendimento | DATE | Data do atendimento |
| co_profissional | BIGINT FK | Profissional responsável |
| co_cbo | VARCHAR(6) | CBO do profissional |
| nu_ine | VARCHAR(10) | INE da equipe |
| co_tipo_atendimento | INT | Tipo (1=Consulta agendada, 2=Demanda espontânea, etc.) |
| co_local_atendimento | INT | Local (1=UBS, 3=Domicílio, etc.) |
| st_gestante | BOOLEAN | Flag de gestante |
| co_turno | CHAR(1) | M=Manhã, T=Tarde, N=Noite |

### `sch_atendimento.tb_problema_condicao_avaliado`
CIDs e CIAPs registrados no atendimento.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_atendimento | BIGINT FK | → tb_atendimento_individual |
| co_ciap2 | VARCHAR(4) | Código CIAP-2 |
| co_cid10 | VARCHAR(5) | Código CID-10 |
| st_ativo | BOOLEAN | Condição ativa |
| st_avaliado | BOOLEAN | Avaliado neste atendimento |

**CIAPs relevantes para indicadores:**
- `W78` = Gravidez confirmada
- `K86` = Hipertensão sem complicação
- `K87` = Hipertensão com complicação
- `T90` = Diabetes insulino-dependente
- `T89` = Diabetes não insulino-dependente
- `X75` = Exame citológico colo uterino

**CIDs relevantes:**
- `O00-O99` = Gravidez/parto/puerpério
- `I10` = Hipertensão essencial
- `E11` = Diabetes mellitus tipo 2
- `E10` = Diabetes mellitus tipo 1
- `Z34` = Supervisão de gravidez normal

---

## CDS — Fichas

### `sch_cds.tb_fat_atendimento_individual`
Fichas de Atendimento Individual (FAI) — CDS.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_seq_fat_atd_ind | BIGINT PK | ID da ficha |
| co_cidadao | BIGINT FK | Cidadão |
| dt_atendimento | DATE | Data |
| co_cbo | VARCHAR(6) | CBO do profissional |
| nu_ine | VARCHAR(10) | INE da equipe |
| st_gestante | BOOLEAN | Marcação de gestante |
| st_consulta_prenatal | BOOLEAN | É consulta de pré-natal |
| st_puerpera | BOOLEAN | Puérpera (até 42 dias pós-parto) |
| co_problema_condicao_1 | INT | Problema/condição avaliado 1 |
| co_problema_condicao_2 | INT | Problema/condição avaliado 2 |
| co_problema_condicao_3 | INT | Problema/condição avaliado 3 |
| st_hipertensao | BOOLEAN | Marcação hipertensão |
| st_diabetes | BOOLEAN | Marcação diabetes |
| co_conduta | INT | Conduta (retorno, encaminhamento, etc.) |

### `sch_cds.tb_fat_visita_domiciliar`
Fichas de Visita Domiciliar do ACS.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_cidadao | BIGINT FK | Cidadão visitado |
| dt_visita | DATE | Data da visita |
| nu_ine | VARCHAR(10) | INE da equipe |
| nu_microarea | VARCHAR(3) | Microárea do ACS |
| co_motivo_visita | INT | Motivo (acompanhamento, cadastro, etc.) |
| co_desfecho | INT | Desfecho (visita realizada, ausente, etc.) |
| st_gestante | BOOLEAN | Cidadão é gestante |

### `sch_cds.tb_fat_procedimentos`
Ficha de Procedimentos — registros de procedimentos avulsos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_cidadao | BIGINT FK | Cidadão |
| dt_procedimento | DATE | Data |
| co_sigtap | VARCHAR(10) | Código SIGTAP |
| nu_ine | VARCHAR(10) | INE equipe |
| co_cbo | VARCHAR(6) | CBO profissional |
| qt_realizado | INT | Quantidade realizada |

---

## Gestante e Pré-natal

### `sch_atendimento.tb_pre_natal`
Dados específicos do acompanhamento pré-natal.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_seq_pre_natal | BIGINT PK | ID |
| co_cidadao | BIGINT FK | Gestante |
| dt_inicio_pre_natal | DATE | Data 1ª consulta pré-natal |
| dt_dum | DATE | Data da Última Menstruação |
| dt_dpp | DATE | Data Provável do Parto |
| nu_semanas_gestacao | INT | Semanas de gestação na 1ª consulta |
| nu_consultas_realizadas | INT | Total de consultas realizadas |
| co_equipe | VARCHAR(10) | INE da equipe |
| st_ativo | BOOLEAN | Gestação ativa |
| dt_desfecho | DATE | Data do desfecho (parto, aborto) |
| co_desfecho | INT | Tipo de desfecho |

**Regra indicador I1:** `nu_semanas_gestacao <= 12` na data da 1ª consulta = conta no numerador.

### `sch_atendimento.tb_exame_gestante`
Exames específicos de gestante (sífilis, HIV, glicemia, etc.)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_pre_natal | BIGINT FK | → tb_pre_natal |
| co_tipo_exame | INT | Tipo (1=Sífilis, 2=HIV, 3=Glicemia, etc.) |
| dt_solicitacao | DATE | Data da solicitação |
| dt_resultado | DATE | Data do resultado |
| ds_resultado | VARCHAR | Resultado |
| nu_trimestre | INT | Trimestre da gestação (1, 2 ou 3) |

---

## Doenças Crônicas

### `sch_cidadao.tb_condicao_saude`
Condições de saúde ativas do cidadão (diagnósticos cadastrados).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_cidadao | BIGINT FK | Cidadão |
| co_ciap2 | VARCHAR | CIAP-2 da condição |
| co_cid10 | VARCHAR | CID-10 da condição |
| dt_inicio | DATE | Início da condição |
| st_ativo | BOOLEAN | Condição ativa |
| nu_ine | VARCHAR | INE da equipe que cadastrou |

**Para listar hipertensos:** `co_ciap2 IN ('K86','K87') OR co_cid10 LIKE 'I1%'`
**Para listar diabéticos:** `co_ciap2 IN ('T89','T90') OR co_cid10 IN ('E10','E11','E12','E13','E14')`

### `sch_atendimento.tb_medicao`
Medições clínicas registradas no atendimento (PA, peso, altura, glicemia).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_atendimento | BIGINT FK | → tb_atendimento_individual |
| co_cidadao | BIGINT FK | Cidadão |
| dt_medicao | DATE | Data da medição |
| nu_pressao_sistolica | INT | PAS (mmHg) |
| nu_pressao_diastolica | INT | PAD (mmHg) |
| nu_peso | NUMERIC | Peso (kg) |
| nu_altura | INT | Altura (cm) |
| nu_imc | NUMERIC | IMC calculado |
| nu_glicemia | NUMERIC | Glicemia capilar |

---

## Vacinação

### `sch_imunobiologico.tb_imunobiologico_administrado`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_seq_registro | BIGINT PK | ID do registro |
| co_cidadao | BIGINT FK | Cidadão vacinado |
| co_imunobiologico | INT | Código da vacina |
| no_imunobiologico | VARCHAR | Nome da vacina |
| dt_administracao | DATE | Data de aplicação |
| nu_dose | VARCHAR | Dose (D1, D2, D3, Ref, etc.) |
| nu_ine | VARCHAR | INE da equipe |
| co_cbo | VARCHAR | CBO de quem aplicou |

**Vacinas relevantes para indicador I8 (1 ano de idade):**
- Poliomielite (VIP/VOP): `co_imunobiologico IN (25, 26, 97)` — verificar no banco
- Pentavalente (DTP+Hib+HepB): `co_imunobiologico IN (87)` — verificar no banco

---

## Exames

### `sch_exame.tb_resultado_exame`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_seq_resultado | BIGINT PK | ID |
| co_cidadao | BIGINT FK | Cidadão |
| co_sigtap | VARCHAR(10) | Código SIGTAP do exame |
| dt_solicitacao | DATE | Data da solicitação |
| dt_resultado | DATE | Data do resultado |
| ds_resultado | TEXT | Resultado |
| nu_ine | VARCHAR | INE equipe solicitante |

**Códigos SIGTAP relevantes:**
- Citopatológico colo uterino: `0203010086`
- HbA1c: `0202010910`
- Glicemia em jejum: `0202010538`
- Sorologia sífilis (gestante): `0202030661`
- HIV (gestante): `0202030369`

---

## Saúde Bucal

### `sch_cds.tb_fat_atendimento_odontologico`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_cidadao | BIGINT FK | Cidadão |
| dt_atendimento | DATE | Data |
| co_cbo | VARCHAR | CBO (dentista/TSB) |
| nu_ine | VARCHAR | INE equipe |
| st_gestante | BOOLEAN | Gestante |
| co_tipo_consulta | INT | 1ª consulta, retorno, urgência |
| co_vigilancia_saude_bucal | INT[] | Array de vigilâncias |

---

## Territorial

### `sch_domicilio.tb_domicilio`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_seq_domicilio | BIGINT PK | ID |
| nu_ine | VARCHAR | INE da equipe responsável |
| nu_microarea | VARCHAR(3) | Microárea |
| no_logradouro | VARCHAR | Logradouro |
| nu_numero | VARCHAR | Número |
| no_bairro | VARCHAR | Bairro |
| co_municipio | INT | Código IBGE do município |
| co_cnes | VARCHAR(7) | CNES da UBS de referência |

---

## Equipe e Profissional

### `sch_equipe.tb_equipe`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| nu_ine | VARCHAR(10) PK | INE da equipe |
| no_equipe | VARCHAR | Nome |
| co_tipo_equipe | INT | 70=eSF, 76=eAP, 80=NASF |
| co_cnes | VARCHAR(7) | CNES da UBS |
| co_municipio | INT | Código IBGE |
| st_ativo | BOOLEAN | Equipe ativa no CNES |

### `sch_equipe.tb_cbo`
Tabela de domínio com todos os CBOs.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| co_cbo | VARCHAR(6) PK | Código CBO |
| no_cbo | VARCHAR | Descrição |
| co_familia_cbo | VARCHAR(4) | Família CBO |

**CBOs mais usados na eSF:**
- `225142` = Médico de Família e Comunidade
- `225125` = Médico Clínico
- `223505` = Enfermeiro
- `322205` = Técnico de Enfermagem
- `515105` = Agente Comunitário de Saúde
- `223208` = Nutricionista
- `322415` = Técnico em Saúde Bucal
- `223204` = Cirurgião-Dentista — Clínica Geral
