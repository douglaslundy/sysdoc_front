# agents/04-integration-agent.md

## Nome
`integration-agent`

## Papel
Responsável por **integrar o módulo Monitor APS ao sistema já existente**, sem quebrar funcionalidades existentes. Trata da integração de rotas, autenticação, menu de navegação e build do frontend.

## Dependências
- `database-config-agent` completo
- `indicators-service-agent` completo
- `frontend-dashboard-agent` completo

## Tarefas

### TAREFA 1: Integração das Rotas Backend

O sistema existente deve incluir as rotas do Monitor APS. Encontrar o arquivo principal do servidor (app.js / index.js / server.py / main.py) e adicionar:

**Node.js/Express**:
```javascript
// No arquivo principal do servidor existente
// ADICIONAR (não modificar o que já existe):
const monitorApsRoutes = require('./modules/monitor-aps/backend/src/routes');

// Montar sob prefixo /api/monitor-aps
app.use('/api/monitor-aps', 
  authMiddleware,            // reutilizar middleware de autenticação existente
  monitorApsRoutes
);
```

**Python/FastAPI**:
```python
# No arquivo principal
from modules.monitor_aps.backend.src.routes import router as monitor_aps_router

app.include_router(
    monitor_aps_router,
    prefix="/api/monitor-aps",
    dependencies=[Depends(get_current_user)]  # reutilizar autenticação existente
)
```

### TAREFA 2: Adicionar ao Menu de Navegação

Localizar o arquivo do menu lateral (Sidebar/Navigation) do sistema existente e adicionar entrada:

```jsx
// Adicionar na lista de itens do menu existente:
{
  label: 'Monitor APS',
  icon: <ChartBarIcon />,  // ou ícone compatível com o sistema existente
  path: '/monitor-aps',
  badge: alertCount > 0 ? alertCount : null,  // badge com alertas ativos
  submenu: [
    { label: 'Dashboard', path: '/monitor-aps' },
    { label: 'Vínculo Territorial', path: '/monitor-aps/vinculo' },
    { label: 'Indicadores de Qualidade', path: '/monitor-aps/qualidade' },
    { label: 'Por Equipe', path: '/monitor-aps/equipe' },
    { label: 'Configurações', path: '/monitor-aps/configuracoes' },
  ]
}
```

### TAREFA 3: Integração de Rotas Frontend (React Router)

No arquivo de rotas principal do frontend existente:
```jsx
// Adicionar rotas do Monitor APS (lazy loading para não impactar bundle inicial):
import { lazy, Suspense } from 'react';
const MonitorApsDashboard = lazy(() => import('./modules/monitor-aps/frontend/src/pages/Dashboard'));
const VinculoTerritorial = lazy(() => import('./modules/monitor-aps/frontend/src/pages/VinculoTerritorial'));
const IndicadoresQualidade = lazy(() => import('./modules/monitor-aps/frontend/src/pages/IndicadoresQualidade'));
const PorEquipe = lazy(() => import('./modules/monitor-aps/frontend/src/pages/PorEquipe'));
const Configuracoes = lazy(() => import('./modules/monitor-aps/frontend/src/pages/Configuracoes'));

// Nas rotas (dentro de um ProtectedRoute existente):
<Route path="/monitor-aps" element={<Suspense fallback={<Loading />}><MonitorApsDashboard /></Suspense>} />
<Route path="/monitor-aps/vinculo" element={<Suspense fallback={<Loading />}><VinculoTerritorial /></Suspense>} />
<Route path="/monitor-aps/qualidade" element={<Suspense fallback={<Loading />}><IndicadoresQualidade /></Suspense>} />
<Route path="/monitor-aps/equipe" element={<Suspense fallback={<Loading />}><PorEquipe /></Suspense>} />
<Route path="/monitor-aps/configuracoes" element={
  <Suspense fallback={<Loading />}>
    <AdminRoute>  {/* Apenas administradores */}
      <Configuracoes />
    </AdminRoute>
  </Suspense>
} />
```

### TAREFA 4: Controle de Acesso

Definir níveis de acesso para o módulo:

```javascript
// Permissões por perfil (adaptar ao sistema de permissões existente)
const MONITOR_APS_PERMISSIONS = {
  'admin':    ['config', 'dashboard', 'vinculo', 'qualidade', 'equipe', 'export'],
  'gestor':   ['dashboard', 'vinculo', 'qualidade', 'equipe', 'export'],
  'tecnico':  ['dashboard', 'vinculo', 'qualidade', 'equipe'],
  'viewer':   ['dashboard'],
};
```

### TAREFA 5: Variáveis de Ambiente

Criar/atualizar `.env.example`:
```bash
# Monitor APS — Banco de Dados e-SUS PEC
ESUS_PEC_DB_HOST=localhost
ESUS_PEC_DB_PORT=5432
ESUS_PEC_DB_NAME=esus
ESUS_PEC_DB_USER=monitor_aps
ESUS_PEC_DB_PASSWORD=
ESUS_PEC_DB_SSL=false

# Monitor APS — Município
MONITOR_APS_MUNICIPIO_IBGE=
MONITOR_APS_MUNICIPIO_NOME=
MONITOR_APS_ESTRATO_IED=4

# Monitor APS — Cache (opcional)
MONITOR_APS_CACHE_TTL_SECONDS=300
```

### TAREFA 6: Cache de Queries (Performance)

Para não sobrecarregar o banco do eSUS PEC com queries pesadas frequentes:

```javascript
// modules/monitor-aps/backend/src/utils/cache.js
const cache = new Map();

function withCache(key, ttlSeconds, fn) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
    return cached.data;
  }
  const data = fn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Uso nos serviços:
// const resultado = await withCache(
//   `vinculo_${ine}_${ano}_${quad}`, 
//   300,  // 5 minutos
//   () => calcularVinculo(ine, ano, quad)
// );

// Endpoint para invalidar cache manualmente:
// POST /api/monitor-aps/cache/clear (apenas admin)
```

### TAREFA 7: Logging e Monitoramento

```javascript
// Logar todas as queries ao banco do eSUS PEC para auditoria
// (importante pois é um sistema de saúde com dados sensíveis)
const logger = require('./logger'); // usar logger existente do sistema

function logQuery(userId, query, params, duration) {
  logger.info({
    module: 'monitor-aps',
    action: 'db_query',
    user_id: userId,
    query_name: query,
    duration_ms: duration,
    timestamp: new Date().toISOString()
  });
}
```

## Critérios de Aceitação

- [ ] Rotas do Monitor APS são acessíveis após login no sistema existente
- [ ] Menu lateral exibe "Monitor APS" com submenu correto
- [ ] Usuários sem permissão recebem HTTP 403 nas rotas protegidas
- [ ] Página de Configurações só é acessível para admin
- [ ] Lazy loading está funcionando (bundle inicial não cresce mais que 10%)
- [ ] Variáveis de ambiente estão documentadas em `.env.example`
- [ ] Cache reduz queries repetidas ao banco do PEC
- [ ] Logs de acesso ao banco são registrados
- [ ] Sistema existente não apresenta regressões após integração

## Importante: O que NÃO fazer

❌ Não modificar migrações de banco do sistema existente
❌ Não alterar componentes de autenticação/login existentes
❌ Não adicionar dependências conflitantes ao `package.json` raiz
❌ Não fazer queries de INSERT/UPDATE/DELETE no banco do eSUS PEC
❌ Não expor credenciais do banco do PEC no frontend
