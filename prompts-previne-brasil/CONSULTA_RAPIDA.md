# PROMPT DE USO RÁPIDO — Consultas do Dia a Dia

> **Arquivo:** `CONSULTA_RAPIDA.md`
> **Para usar:** Quando o sistema já estiver configurado e você precisar
> de uma resposta rápida sobre indicadores ou consultas SQL.

---

## COLE ESTE PROMPT QUANDO PRECISAR DE RESPOSTAS RÁPIDAS:

```
Você é o assistente do sistema de monitoramento de indicadores da SMS Ilicínea-MG.
O banco de dados e-SUS AB já está mapeado. Os indicadores do Cofinanciamento da AB
já estão documentados. Responda de forma direta e objetiva.

CNES: 2794454 | Município: Ilicínea-MG | Programa: Cofinanciamento Federal AB

Contexto da pergunta do usuário:
[ESCREVA AQUI SUA DÚVIDA]

Formato da resposta:
- Se for dúvida sobre indicador: informe CBO, ficha, frequência e query SQL
- Se for pedido de query: forneça o SQL pronto para copiar e colar
- Se for dúvida operacional: responda em no máximo 5 linhas objetivas
```

---

## EXEMPLOS DE PERGUNTAS PARA USAR COM ESTE PROMPT:

### Dúvidas sobre Indicadores
- "Como alcançar o indicador I5 (citopatológico)? Quem faz, onde registra, quantas vezes?"
- "O que preciso fazer para o indicador de hipertensão? Qual CBO e qual ficha?"
- "A consulta de enfermagem conta para o pré-natal do indicador I1?"
- "Vacina aplicada pelo técnico de enfermagem conta para o I8?"

### Pedidos de Query SQL
- "Me dê a query para listar todas as gestantes sem consulta no último mês"
- "Query para ver quais hipertensos não tiveram PA aferida em 2024"
- "Lista de diabéticos sem HbA1c no semestre com nome e CNS"
- "Painel geral: todos os indicadores com numerador, denominador e % da equipe INE XXXXX"

### Dúvidas Operacionais
- "Qual a diferença entre registrar no PEC e na Ficha CDS para fins de indicador?"
- "Atendimento do NASF conta para os indicadores da equipe de referência?"
- "Se o paciente foi atendido em outro município, conta para os nossos indicadores?"

---

## REFERÊNCIA RÁPIDA DE CBOs MAIS USADOS

| CBO | Profissão | Indicadores que atende |
|-----|-----------|----------------------|
| 225142 | Médico de Família e Comunidade | I1,I2,I3,I4,I5,I6,I7,I8,I9 |
| 225125 | Médico Clínico | I1,I2,I3,I4,I5,I6,I7,I8,I9 |
| 223505 | Enfermeiro | I1,I2,I3,I4,I5,I6,I7,I8,I9 |
| 322205 | Técnico de Enfermagem | I4 (vacinação), I8 (vacinação) |
| 515105 | Agente Comunitário de Saúde | Suporte (visita domiciliar) |
| 223208 | Nutricionista | I6 (parcial), I7 (parcial) |
| 251510 | Psicólogo | Saúde Mental |
| 322415 | Técnico de Saúde Bucal | Saúde Bucal |
| 223204 | Cirurgião-Dentista (eSB) | Saúde Bucal |

---

## REFERÊNCIA RÁPIDA DE FICHAS E-SUS

| Ficha | Sigla | Quando usar |
|-------|-------|-------------|
| Ficha de Atendimento Individual | FAI | Consulta sem prontuário eletrônico |
| Ficha de Atendimento Odontológico | FAO | Consulta odontológica sem PEC |
| Ficha de Atividade Coletiva | FAC | Grupos, palestras, ações coletivas |
| Ficha de Visita Domiciliar | FVD | Visita do ACS |
| Ficha de Procedimentos | FP | Procedimentos avulsos (coleta, curativo) |
| Ficha Complementar | FC | Síndrome neurológica, gestante (sífilis/HIV) |
| Ficha de Cadastro Individual | FCI | Cadastro/atualização do cidadão |
| Ficha de Cadastro Domiciliar | FCD | Cadastro do domicílio |
| Prontuário Eletrônico (PEC) | PEC | Atendimento com sistema informatizado |
