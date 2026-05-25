# Fichas Detalhadas dos Indicadores — Cofinanciamento AB

## I1 — Proporção de Gestantes com Pré-natal Iniciado no 1º Trimestre

### Definição Oficial
Mede a proporção de gestantes acompanhadas que iniciaram o pré-natal até a 12ª semana de gestação.

### Numerador
Gestantes com **registro de 1ª consulta de pré-natal com IG ≤ 12 semanas** no período.

### Denominador
Total de gestantes com **pré-natal ativo** registrado no e-SUS, com início no período de avaliação.

### Metas
| Faixa | Meta | Classificação |
|-------|------|--------------|
| Suficiente | ≥ 60% | Bronze |
| Bom | ≥ 75% | Prata |
| Ótimo | ≥ 90% | Ouro |

### Passo a Passo para Atingir
1. O ACS identifica mulher com atraso menstrual e encaminha para a UBS imediatamente
2. Médico ou Enfermeiro realiza consulta de pré-natal e registra a DUM
3. O sistema calcula a IG automaticamente baseado na DUM
4. Se IG ≤ 12 semanas → entra no numerador
5. Registrar no PEC (aba Pré-natal) com campos: DUM, IG, "1ª consulta de pré-natal"

### Armadilhas
- IG calculada errada por DUM incorreta → revisar DUM na primeira consulta
- Consulta registrada como "consulta de rotina" sem marcar pré-natal → não conta

---

## I2 — Proporção de Gestantes com Consultas de Pré-natal em Dia

### Definição Oficial
Gestantes com o número mínimo de consultas de pré-natal realizadas conforme o calendário do MS.

### Numerador
Gestantes com **≥ 6 consultas de pré-natal** registradas no período.

### Denominador
Gestantes acompanhadas com pré-natal encerrado (parto/aborto) no período de avaliação.

### Distribuição Ideal das Consultas
- 1º trimestre: até 12 sem → 2 consultas
- 2º trimestre: 13–27 sem → 2 consultas
- 3º trimestre: 28–40 sem → 2 consultas
- **Total mínimo: 6 consultas**

### CBOs que contam
- 225142 — Médico de Família e Comunidade ✅
- 225125 — Médico Clínico ✅
- 223505 — Enfermeiro ✅

---

## I3 — Proporção de Gestantes com Exame de Sífilis e HIV

### Definição Oficial
Gestantes que realizaram **ambos** os exames: sorologia para sífilis (VDRL ou teste rápido) E HIV.

### Numerador
Gestantes com **resultado** de exame para sífilis **E** resultado de exame para HIV registrados.

### Denominador
Gestantes acompanhadas com pré-natal ativo no período.

### Momentos de Coleta Recomendados
- **1ª consulta de pré-natal** (qualquer trimestre)
- **3º trimestre** (28ª semana ou mais — repetição recomendada)
- **Na maternidade** (rastreamento no parto)

### Onde Registrar no e-SUS
- **PEC:** Aba Pré-natal → Exames → Sífilis / HIV → lançar resultado
- **Ficha Complementar (FC):** Campo específico para gestante — sífilis e HIV
- **SISVAN:** Se integrado, pode reconhecer o resultado

### Códigos SIGTAP
- Sorologia sífilis: `0202030661` (VDRL) ou teste rápido
- HIV: `0202030369`

---

## I4 — Proporção de Gestantes com Vacinas Antitetânica e Hepatite B em Dia

### Definição Oficial
Gestantes com esquema vacinal completo ou atualizado para dT/dTpa e HepB durante a gestação.

### Esquema dT (dupla adulto / tríplice acelular)
- Não vacinada: 3 doses (D1, D2, D3)
- Incompleta: completar
- Completa: 1 dose de reforço a cada gestação (dTpa na 20ª semana)

### Esquema HepB
- Não vacinada: 3 doses (0, 1 e 6 meses)
- Incompleta: completar durante a gestação

### Onde Registrar
- Módulo de Vacinação do e-SUS PEC
- Ficha de Vacinação (CDS)

### CBO que aplica
- 322205 — Técnico de Enfermagem ✅
- 223505 — Enfermeiro ✅

---

## I5 — Proporção de Mulheres com Exame Citopatológico

### Definição Oficial
Proporção de mulheres entre 25 e 64 anos com exame citopatológico realizado nos últimos 3 anos.

### Numerador
Mulheres 25–64 anos com **resultado** de citopatológico registrado nos **últimos 36 meses**.

### Denominador
Mulheres entre 25 e 64 anos cadastradas e vinculadas à equipe.

### Metas
| Faixa | Meta |
|-------|------|
| Suficiente | ≥ 20% (em 12 meses) |
| Ótimo | ≥ 60% (em 12 meses) |

> A meta parece baixa porque o exame é trienal — a cada ano a equipe deve
> atender aproximadamente 1/3 das mulheres elegíveis.

### Estratégia para Atingir
1. Listar todas as mulheres 25–64 anos cadastradas (denominador)
2. Filtrar as que têm exame há mais de 3 anos ou nunca fizeram
3. Fazer busca ativa com ACS
4. Realizar coleta na UBS (Enfermeiro pode coletar)
5. Registrar o SIGTAP do procedimento: `0203010086`

### Quem pode coletar
- 223505 — Enfermeiro ✅
- 225142 — Médico de Família ✅
- 225125 — Médico Clínico ✅

---

## I6 — Proporção de Hipertensos com PA Aferida

### Definição Oficial
Hipertensos cadastrados com pelo menos **1 aferição de pressão arterial** registrada no período de 12 meses.

### Denominador
Cidadãos com hipertensão ativa no cadastro da equipe (CIAP K86/K87 ou CID I10–I15).

### Numerador
Hipertensos com PA registrada no e-SUS no período (FAI, PEC ou Ficha de Procedimentos).

### Como garantir o registro
- Aferir PA em **todos** os atendimentos de hipertensos, independente do motivo
- Registrar o valor na aba de medições do PEC
- Técnico de Enfermagem pode aferir e registrar (independente de consulta médica)
- Criar rotina mensal de "aferição de PA" para hipertensos não consultados

### Frequência para meta ótima
- Pelo menos 2 aferições por ano (1 em cada semestre)
- Para o indicador: basta 1 no período de 12 meses

---

## I7 — Proporção de Diabéticos com HbA1c Solicitada

### Definição Oficial
Diabéticos com Hemoglobina Glicada (HbA1c) **solicitada e com resultado registrado** nos últimos 6 meses.

### Importante
O indicador avalia **solicitação E resultado**, não apenas solicitação.
Sem resultado no sistema = não conta no numerador.

### Quem solicita
- 225142 — Médico de Família ✅
- 225125 — Médico Clínico ✅
- Enfermeiro com protocolo municipal ✅ (verificar portaria local)

### Código SIGTAP
- HbA1c: `0202010910`
- **Atenção:** Glicemia em jejum (`0202010538`) **NÃO** substitui HbA1c para este indicador

### Estratégia
1. Listar diabéticos sem HbA1c no semestre (Q006 da biblioteca)
2. Agendar consultas médicas para solicitação
3. Garantir que o resultado seja digitado no sistema após chegar do laboratório
4. Fazer busca ativa dos que não retornaram para buscar o resultado

---

## I8 — Cobertura Vacinal em Crianças de 1 Ano

### Definição Oficial
Crianças que completaram 12 meses com **3 doses de vacina poliomielite E 3 doses de pentavalente** aplicadas.

### Esquema (age em meses)
| Dose | Mês | Vacina |
|------|-----|--------|
| D1 | 2 meses | VIP + Pentavalente |
| D2 | 4 meses | VIP + Pentavalente |
| D3 | 6 meses | VOP + Pentavalente |

### Monitoramento
- Crianças que completam 1 ano no período de avaliação
- O ACS deve verificar a caderneta em cada visita
- Crianças sem vacina em dia → busca ativa imediata

### Onde registrar
- Módulo de Vacinação do PEC (obrigatório para o indicador)
- Não adianta ter na caderneta física sem registro no sistema

---

## PONTUAÇÃO E FINANCIAMENTO

### Como funciona o pagamento por desempenho
1. Cada indicador tem peso dentro do componente de desempenho
2. A equipe é classificada em cada indicador por faixa (Abaixo/Suficiente/Bom/Ótimo)
3. A classificação final da equipe determina o valor do incentivo
4. Avaliação quadrimestral: Jan-Abr / Mai-Ago / Set-Dez

### Impacto financeiro estimado por indicador
O Ministério da Saúde publica anualmente os valores de referência.
Acesse: https://aps.saude.gov.br → Cofinanciamento → Notas técnicas
