# agents/04-integration-agent.md

## Nome
`integration-agent`

## Papel
Responsável por integrar o módulo Monitor APS ao sistema existente, garantindo que nada seja quebrado. O módulo é implementado **dentro** dos dois projetos existentes (`sysdoc_back` e `sysdoc_front`) — não como serviço separado.

## Arquitetura Real de Integração

```
sysdoc_front (Next.js :3000)
  └── pages/monitor-aps/*          → componentes em src/components/monitor-aps/
  └── src/services/monitorApsApi.js → chama api Axios (NEXT_PUBLIC_API_URL + /monitor-aps/*)
         │
         ▼ HTTP (Bearer token JWT/Sanctum)
sysdoc_back (Laravel :8000)
  └── routes/api.php (prefix: monitor-aps, middleware: auth:sanctum)
  └── MonitorApsController.php     → cálculos dos 15 indicadores em PHP
  └── MonitorApsConfigController.php → config de conexão
  └── MonitorApsBaseController.php   → conexão ao PostgreSQL eSUS PEC
         │
         ▼ PostgreSQL (somente leitura)
eSUS APS PEC (:5432)
  └── schema public (tabelas fat_, dim_, vw_)
```

---

## Tarefas

### TAREFA 1: Integração das Rotas no Laravel (já feita)

Adicionar ao `sysdoc_back/routes/api.php`:

```php
use App\Http\Controllers\MonitorApsController;
use App\Http\Controllers\MonitorApsConfigController;

Route::prefix('monitor-aps')
    ->middleware(['auth:sanctum', 'throttle:60,1'])
    ->group(function () {
        Route::get('indicadores/resumo',         [MonitorApsController::class, 'resumo']);
        Route::get('indicadores/vinculo',        [MonitorApsController::class, 'vinculo']);
        Route::get('indicadores/qualidade',      [MonitorApsController::class, 'qualidade']);
        Route::get('indicadores/qualidade/{id}', [MonitorApsController::class, 'qualidadeIndicador']);
        Route::get('indicadores/repasse',        [MonitorApsController::class, 'repasse']);
        Route::get('indicadores/historico',      [MonitorApsController::class, 'historico']);
        Route::get('config/status',              [MonitorApsConfigController::class, 'status']);
        Route::get('config/equipes',             [MonitorApsConfigController::class, 'equipes']);
        Route::post('config/test',               [MonitorApsConfigController::class, 'testar']);
        Route::post('config/save',               [MonitorApsConfigController::class, 'save']);
    });
```

**Importante**: O prefixo `/api/monitor-aps` é definido no `RouteServiceProvider` pelo grupo `api`, portanto as URLs finais ficam `/api/monitor-aps/indicadores/resumo` etc.

### TAREFA 2: Adicionar entrada no menu lateral do sysdoc_front

Localizar o arquivo do menu/sidebar existente e adicionar:

```javascript
{ label: 'Monitor APS', path: '/monitor-aps', icon: <MonitorHeartIcon /> }
// ou sub-itens:
{
  label: 'Monitor APS',
  icon: <MonitorHeartIcon />,
  submenu: [
    { label: 'Dashboard',            path: '/monitor-aps' },
    { label: 'Vínculo Territorial',  path: '/monitor-aps/vinculo' },
    { label: 'Indicadores',          path: '/monitor-aps/qualidade' },
    { label: 'Por Equipe',           path: '/monitor-aps/equipe' },
    { label: 'Configurações',        path: '/monitor-aps/configuracoes' },
  ]
}
```

### TAREFA 3: Integração das rotas no Next.js (já feita)

As pages em `sysdoc_front/pages/monitor-aps/` são roteadas automaticamente pelo Next.js:

- `/monitor-aps` → `pages/monitor-aps/index.js`
- `/monitor-aps/vinculo` → `pages/monitor-aps/vinculo.js`
- `/monitor-aps/qualidade` → `pages/monitor-aps/qualidade.js`
- `/monitor-aps/equipe` → `pages/monitor-aps/equipe.js`
- `/monitor-aps/configuracoes` → `pages/monitor-aps/configuracoes.js`

O middleware de autenticação existente (`middleware.js` + `AuthContext`) já protege todas as rotas.

### TAREFA 4: Controle de Acesso

Aproveitar o sistema de permissões existente do sysdoc:

- Endpoints `config/test` e `config/save` verificam se o usuário tem perfil admin no Laravel
- Página `/monitor-aps/configuracoes` exibe aviso se o usuário não for admin

### TAREFA 5: Variáveis de Ambiente

`sysdoc_back/.env` (e `.env.example`):
```bash
# Monitor APS — banco eSUS PEC (somente leitura)
APS_DB_HOST=
APS_DB_PORT=5432
APS_DB_DATABASE=esus
APS_DB_USERNAME=monitor_aps
APS_DB_PASSWORD=
MONITOR_APS_MUNICIPIO_NOME=
MONITOR_APS_MUNICIPIO_IBGE=
MONITOR_APS_ESTRATO_IED=4
```

`sysdoc_front/.env`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Sem variável `MONITOR_APS_BACKEND_URL` — o frontend chama diretamente o Laravel.

### TAREFA 6: Configuração dinâmica do banco

O banco eSUS PEC pode ser configurado de duas formas (prioridade nesta ordem):

1. **Via UI**: `POST /api/monitor-aps/config/save` persiste em `sysdoc_back/storage/app/monitor-aps-config.json`
2. **Via .env**: variáveis `APS_DB_*` usadas como fallback via conexão `pgsql_esus` no `config/database.php`

---

## O que NÃO fazer

- ❌ Não criar serviço Node.js separado — tudo fica no Laravel
- ❌ Não modificar migrações MySQL do sysdoc (o PEC usa PostgreSQL separado)
- ❌ Não alterar componentes de autenticação/login existentes
- ❌ Não fazer INSERT/UPDATE/DELETE no banco do eSUS PEC
- ❌ Não expor credenciais do banco do PEC no frontend

---

## Critérios de Aceitação

- [ ] Rotas do Monitor APS são acessíveis via `/api/monitor-aps/*` após login
- [ ] Menu lateral exibe "Monitor APS" com navegação correta
- [ ] Página de Configurações salva e testa conexão com o banco do PEC
- [ ] Sistema existente (Lab, Farmácia, Atendimento etc.) não apresenta regressões
- [ ] Variáveis de ambiente documentadas no `.env.example` do sysdoc_back
