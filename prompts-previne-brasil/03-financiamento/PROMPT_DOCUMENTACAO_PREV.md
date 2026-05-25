# PROMPT — Documentação Completa dos Indicadores do Cofinanciamento da AB

> **Arquivo:** `03-financiamento/PROMPT_DOCUMENTACAO_PREV.md`
> **Usar em:** Claude Code — após o PROMPT_MAPEAMENTO_BD.md

---

## COLE ESTE PROMPT NO CLAUDE CODE:

```
## FASE 3 — DOCUMENTAÇÃO DOS INDICADORES DO COFINANCIAMENTO FEDERAL DA AB

Você agora vai estudar e documentar TODOS os indicadores do programa de
Cofinanciamento Federal da Atenção Básica (que substituiu o PMAQ e o Previne Brasil).

Base normativa principal:
- Portaria GM/MS nº 2.979/2019 (institui o Previne Brasil)
- Nota Técnica do DAB/SAPS sobre os indicadores de desempenho
- Manual de Indicadores do e-SUS AB (versões mais recentes)
- Portaria Consolidada GM/MS nº 2/2017 e atualizações

---

### ETAPA 3.1 — ESTRUTURA DE DOCUMENTAÇÃO POR INDICADOR

Para CADA indicador, crie uma ficha completa no seguinte formato:

---

## INDICADOR [NÚMERO] — [NOME OFICIAL]

### Identificação
- **Código oficial:** [ex: I1, ICSAP-1, etc.]
- **Eixo/Componente:** [ex: Qualidade, Implantação, etc.]
- **Portaria de referência:** [número e data]
- **Competência de avaliação:** [quadrimestral / anual]
- **Peso no financiamento:** [% ou pontuação]

### Definição
> [Descrição clara e objetiva do que o indicador mede e por que é importante]

### Fórmula de Cálculo
- **Numerador:** [descrição exata do que contar]
- **Denominador:** [descrição exata da população de referência]
- **Resultado:** Numerador ÷ Denominador × 100 (%)

### Metas e Faixas de Desempenho
| Faixa | Meta | Pontuação |
|-------|------|-----------|
| Suficiente | ≥ X% | Y pontos |
| Bom | ≥ X% | Y pontos |
| Ótimo | ≥ X% | Y pontos |

### Grupos Prioritários
- [Grupo 1: ex. Gestantes cadastradas no território]
- [Grupo 2: ex. Gestantes com DUM no trimestre X]
- [Critério de inclusão no denominador]
- [Critério de inclusão no numerador]

### Profissional Responsável pelo Registro
| CBO | Nome do Cargo | Obrigatório? | Pode Substituir? |
|-----|--------------|-------------|-----------------|
| 225142 | Médico de Família e Comunidade | Sim | — |
| 225125 | Clínico Geral | Sim | Sim |
| 223505 | Enfermeiro | Sim (pré-natal) | Sim |

### Ficha de Registro no e-SUS
| Ficha | Quando usar | Campo específico |
|-------|------------|-----------------|
| Ficha de Atendimento Individual (FAI) | Atendimento presencial na UBS | "Tipo de atendimento" + CIAP/CID |
| PEC — Prontuário Eletrônico | Atendimento com prontuário digital | Aba específica de pré-natal/crônico |
| Ficha de Procedimentos | Coleta, exame realizado | Código SIGTAP do procedimento |
| Ficha de Visita Domiciliar | Visita do ACS | Marcação de "Acompanhamento" |

### Frequência de Registro
- **Mínimo:** [ex: 1 consulta por trimestre de gestação]
- **Ideal:** [ex: conforme calendário pré-natal do MS]
- **Período de corte:** [ex: 1º de janeiro a 31 de dezembro]

### O Que NÃO Conta para o Indicador
- [Exclusão 1]
- [Exclusão 2]
- [Atendimentos fora do período, etc.]

### Query SQL — Lista Nominal de Pendentes
```sql
-- INDICADOR X — Cidadãos no denominador mas NÃO no numerador
-- (lista de quem precisa de ação para atingir a meta)
SELECT
    c.no_cidadao          AS nome,
    c.nu_cns              AS cns,
    c.nu_cpf              AS cpf,
    c.dt_nascimento       AS data_nascimento,
    -- campos específicos do indicador
FROM [schema].[tabela_denominador] AS d
JOIN [schema].[tb_cidadao] AS c ON c.co_seq_cidadao = d.co_cidadao
WHERE
    -- filtros do denominador
    AND d.co_cidadao NOT IN (
        SELECT co_cidadao
        FROM [schema].[tabela_numerador]
        WHERE -- filtros do numerador
    )
ORDER BY c.no_cidadao;
```

### Query SQL — Percentual de Meta Atingida
```sql
-- INDICADOR X — Percentual atual vs meta
WITH numerador AS (
    SELECT COUNT(DISTINCT co_cidadao) AS total
    FROM [schema].[tabela_numerador]
    WHERE -- filtros
),
denominador AS (
    SELECT COUNT(DISTINCT co_cidadao) AS total
    FROM [schema].[tabela_denominador]
    WHERE -- filtros
)
SELECT
    n.total                                    AS numerador,
    d.total                                    AS denominador,
    ROUND((n.total::numeric / NULLIF(d.total, 0)) * 100, 1) AS percentual,
    [META]                                     AS meta_suficiente,
    CASE
        WHEN (n.total::numeric / NULLIF(d.total, 0)) * 100 >= [META_OTIMO] THEN 'ÓTIMO'
        WHEN (n.total::numeric / NULLIF(d.total, 0)) * 100 >= [META_BOM] THEN 'BOM'
        WHEN (n.total::numeric / NULLIF(d.total, 0)) * 100 >= [META_SUFICIENTE] THEN 'SUFICIENTE'
        ELSE 'ABAIXO DA META'
    END AS classificacao
FROM numerador n, denominador d;
```

---

### ETAPA 3.2 — LISTA COMPLETA DE INDICADORES PARA DOCUMENTAR

Documente TODOS os indicadores abaixo (adapte conforme versão vigente):

**COMPONENTE I — INDICADORES DE DESEMPENHO (Qualidade):**
- I1: Proporção de gestantes com pré-natal iniciado no 1º trimestre
- I2: Proporção de gestantes com consultas de pré-natal em dia (mínimo 6)
- I3: Proporção de gestantes com exame de sífilis e HIV realizados
- I4: Proporção de gestantes com vacina antitetânica e hepatite B em dia
- I5: Proporção de mulheres com exame citopatológico (25 a 64 anos)
- I6: Proporção de pessoas com hipertensão com PA aferida (2x/ano)
- I7: Proporção de pessoas com DM com HbA1c solicitada (2x/ano)
- I8: Proporção de crianças com vacina poliomielite e penta em dia (1 ano)
- I9: Proporção de puérperas com consulta puerperal até 42 dias
- I10: Cobertura de acompanhamento de pessoas em situação de rua [se aplicável]

**COMPONENTE II — INDICADORES DE IMPLANTAÇÃO:**
- Cobertura de cadastro territorial
- Cobertura de acompanhamento de grupos prioritários

**COMPONENTE III — INDICADORES DE SAÚDE BUCAL (se houver eSB):**
- Proporção de gestantes com atendimento odontológico
- Primeira consulta odontológica programática

---

### ETAPA 3.3 — TABELA MESTRE DE REFERÊNCIA RÁPIDA

Gere uma tabela consolidada para resposta rápida:

| Indicador | Quem faz | CBO | Onde registrar | Frequência | Período |
|-----------|----------|-----|---------------|-----------|---------|
| I1 Pré-natal 1º trim | Médico/Enfermeiro | 225142/223505 | FAI ou PEC | 1x (início gestação) | Anual |
| I2 Consultas em dia | Médico/Enfermeiro | 225142/223505 | FAI ou PEC | 6x durante gestação | Anual |
| ... | ... | ... | ... | ... | ... |

---

### ETAPA 3.4 — GUIA DE FICHAS E-SUS

Documente cada ficha do e-SUS com:

**FICHA DE ATENDIMENTO INDIVIDUAL (FAI) — CDS**
- Quando usar: atendimento presencial na UBS sem prontuário eletrônico
- Quem preenche: médico, enfermeiro, dentista, psicólogo, nutricionista, etc.
- Campos obrigatórios para indicadores: [listar]
- Campos que geram dados de numerador: [listar por indicador]
- Campos que geram dados de denominador: [listar por indicador]

**PEC — PRONTUÁRIO ELETRÔNICO DO CIDADÃO**
- Quando usar: atendimento com sistema informatizado
- Módulos relevantes para indicadores: pré-natal, crônico, vacinação, etc.

**FICHA DE PROCEDIMENTOS**
- Quando usar: procedimentos coletivos ou individuais sem consulta
- Códigos SIGTAP relevantes para indicadores: [listar]

**FICHA DE VISITA DOMICILIAR (ACS)**
- Motivos de visita que geram dados para indicadores
- Desfechos relevantes

**FICHA COMPLEMENTAR**
- Registro de vacinas, exames de sífilis/HIV em gestantes, etc.

---

### ETAPA 3.5 — CALENDÁRIO OPERACIONAL ANUAL

Crie um calendário mostrando o que a equipe deve fazer em cada mês para manter
os indicadores em dia:

| Mês | Ações prioritárias | Indicadores impactados |
|-----|-------------------|----------------------|
| Janeiro | Revisão da lista de gestantes; PA em hipertensos | I1, I2, I6 |
| Fevereiro | Citopatológico (campanha) | I5 |
| ... | ... | ... |

---

### ETAPA 3.6 — FAQ OPERACIONAL

Gere respostas para as 20 perguntas mais frequentes das equipes:

1. "A visita domiciliar do ACS conta para algum indicador?"
2. "Atendimento coletivo conta para o citopatológico?"
3. "Se a paciente fez o exame em laboratório privado, conta?"
4. "O atendimento precisa ter CID específico para contar?"
5. "PA medida na farmácia conta para o indicador de hipertensão?"
6. "Gestante que abortou sai do denominador?"
... (continue até 20)

---

Ao concluir, gere o arquivo `DOCUMENTACAO_INDICADORES.md` e confirme:
"✅ FASE 3 CONCLUÍDA — X indicadores documentados, Y fichas mapeadas."
```

---

> **Próximo passo:** Use `04-dashboard/PROMPT_DASHBOARD.md`
