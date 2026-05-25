# PROMPT — Construção do Dashboard de Indicadores

> **Arquivo:** `04-dashboard/PROMPT_DASHBOARD.md`
> **Usar em:** Claude Code — após as Fases 2 e 3

---

## COLE ESTE PROMPT NO CLAUDE CODE:

```
## FASE 4 — SISTEMA DE DASHBOARD — MONITORAMENTO DE INDICADORES DA AB

Você vai construir um sistema web completo de monitoramento dos indicadores do
Cofinanciamento Federal da Atenção Básica, conectado diretamente ao banco PostgreSQL do e-SUS AB.

---

### STACK TECNOLÓGICA

**Backend:**
- Node.js com Express ou Fastify
- Driver: `pg` (node-postgres) com connection pooling
- Autenticação: JWT (usuário/senha simples para equipe da UBS)
- Variáveis de ambiente para conexão ao banco (nunca hardcode credenciais)

**Frontend:**
- React 18+ com TypeScript
- Vite como bundler
- Recharts ou Chart.js para gráficos
- TailwindCSS para estilização
- React Router para navegação
- React Query (TanStack) para cache de dados

**Banco de Dados:**
- PostgreSQL (somente leitura — NUNCA escrever no banco do e-SUS AB)
- Criar schema separado `sch_dashboard` para metadados e configurações

---

### ETAPA 4.1 — ESTRUTURA DO PROJETO

Crie a seguinte estrutura de arquivos:

```
previne-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # Configuração do pool PostgreSQL
│   │   │   └── env.ts             # Validação das variáveis de ambiente
│   │   ├── routes/
│   │   │   ├── indicadores.ts     # GET /api/indicadores
│   │   │   ├── cidadaos.ts        # GET /api/cidadaos/pendentes/:indicador
│   │   │   ├── equipe.ts          # GET /api/equipe
│   │   │   └── auth.ts            # POST /api/auth/login
│   │   ├── queries/
│   │   │   ├── i1_prenatal.sql    # Query do indicador I1
│   │   │   ├── i2_consultas.sql   # Query do indicador I2
│   │   │   ├── i3_sifilis_hiv.sql # ...
│   │   │   ├── i4_vacinas_gest.sql
│   │   │   ├── i5_citopatologico.sql
│   │   │   ├── i6_hipertensao.sql
│   │   │   ├── i7_diabetes.sql
│   │   │   ├── i8_infantil.sql
│   │   │   └── painel_geral.sql   # Todos os indicadores em uma query
│   │   ├── services/
│   │   │   └── indicadorService.ts # Lógica de negócio dos indicadores
│   │   └── index.ts               # Entry point do servidor
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx       # Painel principal
    │   │   ├── Indicador.tsx       # Detalhe de um indicador
    │   │   ├── ListaNominal.tsx    # Cidadãos com pendências
    │   │   ├── Equipe.tsx          # Visão por profissional
    │   │   └── Configuracoes.tsx   # Config da equipe/UBS
    │   ├── components/
    │   │   ├── CardIndicador.tsx   # Card de resumo do indicador
    │   │   ├── GraficoMeta.tsx     # Gráfico de pizza/barra com meta
    │   │   ├── TabelaCidadaos.tsx  # Tabela com nome/CNS/pendência
    │   │   ├── AlertasPendentes.tsx # Alertas críticos
    │   │   └── FiltroEquipe.tsx    # Filtro por equipe/INE
    │   ├── hooks/
    │   │   ├── useIndicadores.ts
    │   │   └── useCidadaosPendentes.ts
    │   ├── types/
    │   │   └── indicadores.ts      # Tipos TypeScript
    │   └── App.tsx
    └── package.json
```

---

### ETAPA 4.2 — MÓDULO: PAINEL GERAL (Dashboard Principal)

**Arquivo:** `frontend/src/pages/Dashboard.tsx`

O painel principal deve exibir:

1. **Header com identificação da UBS:**
   - Nome da UBS / SMS ILICINEA
   - CNES: 2794454
   - Quadrimestre/ano atual
   - Última atualização dos dados

2. **Cards de resumo por indicador (grid 2x4 ou 3x3):**
   Para cada indicador, um card mostrando:
   - Nome curto do indicador
   - Percentual atual (grande, colorido)
   - Barra de progresso até a meta
   - Badge de classificação: 🔴 CRÍTICO / 🟡 ATENÇÃO / 🟢 META ATINGIDA
   - Número: X de Y (ex: "42 de 67 gestantes")
   - Clique → vai para detalhe do indicador

3. **Gráfico de radar (spider chart):**
   - Todos os indicadores comparados com a meta mínima

4. **Painel de alertas críticos:**
   - Cidadãos com pendências urgentes (ex: gestante no 3º trimestre sem consulta)
   - Ordenados por urgência

**Código do componente CardIndicador:**

```tsx
interface CardIndicadorProps {
  codigo: string;          // "I1", "I5", etc.
  nome: string;            // "Pré-natal 1º trimestre"
  numerador: number;
  denominador: number;
  meta: number;            // ex: 0.60 para 60%
  metaOtimo: number;       // ex: 0.90 para 90%
  onClick: () => void;
}

// O card deve:
// - Calcular percentual = numerador/denominador
// - Colorir com gradiente: vermelho (0%) → amarelo (meta) → verde (metaOtimo)
// - Mostrar quantos faltam: "Faltam X para atingir a meta"
// - Ícone de tendência (subindo/descendo vs mês anterior)
```

---

### ETAPA 4.3 — MÓDULO: DETALHE DO INDICADOR

**Arquivo:** `frontend/src/pages/Indicador.tsx`

Para cada indicador, a página de detalhe deve ter:

1. **Cabeçalho:**
   - Nome completo e descrição do indicador
   - Definição de numerador e denominador
   - Meta atual e faixa de desempenho

2. **Gráfico de Evolução Temporal:**
   - Linha do tempo: últimos 12 meses
   - Linha da meta mínima (tracejada vermelha)
   - Linha da meta ótima (tracejada verde)
   - Ponto atual destacado

3. **Divisão do Denominador por Grupos:**
   - Ex para hipertensão: masculino x feminino, por faixa etária, por microárea do ACS
   - Gráfico de barras agrupadas

4. **Progresso por Microárea do ACS:**
   - Tabela: Microárea → Total no denominador → Atendidos → % → Status
   - Permite identificar qual microárea tem mais pendências

---

### ETAPA 4.4 — MÓDULO: LISTA NOMINAL (O MAIS IMPORTANTE)

**Arquivo:** `frontend/src/pages/ListaNominal.tsx`

Esta é a tela mais crítica do sistema. Para cada indicador, ela deve mostrar:

**Tabela com colunas:**
| # | Nome do Cidadão | CNS | CPF | Data Nasc. | Idade | Microárea | ACS | Pendência Específica | Ações |
|---|----------------|-----|-----|-----------|-------|-----------|-----|---------------------|-------|

**Funcionalidades obrigatórias:**
- 🔍 Filtro por nome, CNS, CPF
- 📍 Filtro por microárea do ACS
- 🗂️ Filtro por tipo de pendência
- ⬇️ Exportar para CSV (para o ACS ou equipe)
- 📅 Ordenar por urgência (ex: gestante com mais semanas primeiro)
- 🖨️ Imprimir lista para o ACS fazer busca ativa

**Coluna "Pendência Específica" deve mostrar informações contextuais:**
- Para gestante: "Gestante — 24 semanas — Sem consulta há 6 semanas"
- Para hipertenso: "Hipertenso — Última PA: há 8 meses"
- Para diabético: "Diabético — Sem HbA1c em 2024"
- Para citopatológico: "Última coleta: 2018 (há 6 anos)"

---

### ETAPA 4.5 — MÓDULO: VISÃO POR EQUIPE E PROFISSIONAL

**Arquivo:** `frontend/src/pages/Equipe.tsx`

1. **Por ACS (Agente Comunitário de Saúde):**
   - Microárea do ACS → Indicadores → % de cobertura da microárea
   - Lista de cidadãos da microárea com pendências

2. **Por Profissional/CBO:**
   - Médico: pendências de consultas, PA, HbA1c, pré-natal
   - Enfermeiro: pendências de pré-natal, citopatológico, visitas
   - Dentista: pendências de saúde bucal (se houver eSB)
   - Técnico de Enfermagem: pendências de vacinação

3. **Agenda sugerida:**
   - "Para atingir a meta do I5 até o fim do quadrimestre, o enfermeiro precisa
     realizar X citopatológicos por semana. Nos próximos 30 dias, estes são
     os cidadãos prioritários: [lista]"

---

### ETAPA 4.6 — API BACKEND (Rotas Principais)

```typescript
// GET /api/indicadores/resumo?equipe=INE_AQUI&periodo=2024-01
// Retorna: todos os indicadores com numerador, denominador, % e classificação

// GET /api/indicadores/:codigo/pendentes?equipe=INE&microarea=1
// Retorna: lista nominal de cidadãos pendentes para o indicador

// GET /api/indicadores/:codigo/evolucao?equipe=INE&meses=12
// Retorna: série histórica mês a mês

// GET /api/cidadaos/busca?nome=JOAO&cns=...
// Retorna: dados do cidadão e suas pendências em todos os indicadores

// GET /api/equipe/:ine/acs
// Retorna: lista de ACS com suas microáreas e % de cobertura

// GET /api/alertas?equipe=INE
// Retorna: alertas críticos ordenados por urgência
```

---

### ETAPA 4.7 — VARIÁVEIS DE AMBIENTE

Arquivo `.env.example`:
```env
# Banco de Dados e-SUS AB (SOMENTE LEITURA)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=esus
DB_USER=esus_readonly
DB_PASSWORD=

# Configuração da UBS
CNES=2794454
MUNICIPIO=ILICINEA
UF=MG
INE_PADRAO=           # INE da equipe principal

# Autenticação
JWT_SECRET=
JWT_EXPIRES_IN=8h

# Servidor
PORT=3001
NODE_ENV=production
```

---

### ETAPA 4.8 — SEGURANÇA OBRIGATÓRIA

1. **NUNCA** escrever no banco do e-SUS AB — apenas SELECT
2. Criar usuário PostgreSQL `esus_readonly` com permissão apenas de leitura nos schemas relevantes:
   ```sql
   CREATE USER esus_readonly WITH PASSWORD 'senha_segura';
   GRANT CONNECT ON DATABASE esus TO esus_readonly;
   GRANT USAGE ON SCHEMA sch_atendimento, sch_cidadao, sch_cds TO esus_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA sch_atendimento TO esus_readonly;
   -- (repetir para todos os schemas necessários)
   ```
3. Autenticação JWT para acesso ao dashboard
4. Logs de acesso para auditoria
5. Rate limiting nas APIs

---

### ETAPA 4.9 — SCRIPT DE INSTALAÇÃO

Gere um `install.sh` que:
1. Verifique Node.js ≥ 18
2. Instale dependências (npm install em backend/ e frontend/)
3. Crie o arquivo .env a partir do .env.example
4. Execute as migrations do schema `sch_dashboard`
5. Faça build do frontend
6. Configure PM2 para manter o backend rodando
7. Instrua sobre configuração do nginx para servir o frontend

---

Ao concluir o código base, confirme:
"✅ FASE 4 CONCLUÍDA — Dashboard criado. Execute: cd previne-dashboard && ./install.sh"
```

---

> **Próximo passo:** Use `05-agentes-teste/PROMPT_AGENTES_TESTE.md`
