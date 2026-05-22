# agents/01-database-config-agent.md

## Nome
`database-config-agent`

## Papel
Responsável por criar o módulo de **configuração e conexão** ao banco PostgreSQL do eSUS PEC dentro do **sysdoc_back (Laravel)**. Este é o alicerce de todo o módulo — sem ele, nenhum indicador pode ser calculado.

## Escopo

Este agente cria:
1. `MonitorApsBaseController.php` — conexão dinâmica ao PostgreSQL do eSUS PEC
2. `MonitorApsConfigController.php` — endpoints de configuração (status, test, save, equipes)
3. Página de configuração no frontend (`sysdoc_front/src/components/monitor-aps/Configuracoes.js`)
4. Script SQL de criação do usuário somente-leitura

---

## Tarefas

### TAREFA 1: Criar o controller base de conexão (Laravel)

Arquivo: `sysdoc_back/app/Http/Controllers/MonitorApsBaseController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

abstract class MonitorApsBaseController extends Controller
{
    protected function db(): \Illuminate\Database\ConnectionInterface
    {
        // Prioridade 1: configuração salva via UI (storage/app/monitor-aps-config.json)
        $path = storage_path('app/monitor-aps-config.json');
        if (file_exists($path)) {
            $c = json_decode(file_get_contents($path), true);
            config(['database.connections.pgsql_esus_runtime' => [
                'driver'   => 'pgsql',
                'host'     => $c['host'],
                'port'     => $c['port'] ?? 5432,
                'database' => $c['database'],
                'username' => $c['user'],
                'password' => $c['password'] ?? '',
                'charset'  => 'utf8',
                'prefix'   => '',
                'schema'   => 'public',
                'sslmode'  => 'prefer',
            ]]);
            return DB::connection('pgsql_esus_runtime');
        }
        // Prioridade 2: variáveis de ambiente (APS_DB_* no .env)
        return DB::connection('pgsql_esus');
    }
}
```

### TAREFA 2: Criar o controller de configuração (Laravel)

Arquivo: `sysdoc_back/app/Http/Controllers/MonitorApsConfigController.php`

Endpoints:
- `GET  /api/monitor-aps/config/status`  — retorna se o banco está configurado e conectado
- `GET  /api/monitor-aps/config/equipes` — lista equipes da `dim_equipe`
- `POST /api/monitor-aps/config/test`    — testa credenciais sem salvar (admin)
- `POST /api/monitor-aps/config/save`    — salva credenciais em `storage/app/monitor-aps-config.json` (admin)

O arquivo JSON de configuração fica em `storage/app/monitor-aps-config.json` (fora do controle de versão).

### TAREFA 3: Registrar as rotas no Laravel

Arquivo: `sysdoc_back/routes/api.php`

```php
// Monitor APS — protegido por auth:sanctum, throttle 60/min
Route::prefix('monitor-aps')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Indicadores
    Route::get('indicadores/resumo',        [MonitorApsController::class, 'resumo']);
    Route::get('indicadores/vinculo',       [MonitorApsController::class, 'vinculo']);
    Route::get('indicadores/qualidade',     [MonitorApsController::class, 'qualidade']);
    Route::get('indicadores/qualidade/{id}',[MonitorApsController::class, 'qualidadeIndicador']);
    Route::get('indicadores/repasse',       [MonitorApsController::class, 'repasse']);
    Route::get('indicadores/historico',     [MonitorApsController::class, 'historico']);
    // Configuração
    Route::get('config/status',             [MonitorApsConfigController::class, 'status']);
    Route::get('config/equipes',            [MonitorApsConfigController::class, 'equipes']);
    Route::post('config/test',              [MonitorApsConfigController::class, 'testar']);
    Route::post('config/save',              [MonitorApsConfigController::class, 'save']);
});
```

### TAREFA 4: Adicionar conexão pgsql_esus ao config do Laravel

Arquivo: `sysdoc_back/config/database.php`

```php
'pgsql_esus' => [
    'driver'   => 'pgsql',
    'host'     => env('APS_DB_HOST', 'localhost'),
    'port'     => env('APS_DB_PORT', '5432'),
    'database' => env('APS_DB_DATABASE', 'esus'),
    'username' => env('APS_DB_USERNAME', 'monitor_aps'),
    'password' => env('APS_DB_PASSWORD', ''),
    'charset'  => 'utf8',
    'prefix'   => '',
    'schema'   => 'public',
    'sslmode'  => 'prefer',
],
```

### TAREFA 5: Criar script SQL de setup do usuário somente-leitura

Arquivo: `sysdoc_back/docs/setup-readonly-user.sql` (ou `psf-dashboard-prompts/docs/`)

```sql
-- Monitor APS: usuário somente-leitura no banco eSUS PEC
-- Executar UMA VEZ como superusuário (postgres) no servidor da SMS

CREATE ROLE monitor_aps_reader;
GRANT CONNECT ON DATABASE esus TO monitor_aps_reader;
GRANT USAGE ON SCHEMA public TO monitor_aps_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO monitor_aps_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitor_aps_reader;

CREATE USER monitor_aps WITH PASSWORD 'SenhaSegura123!';
GRANT monitor_aps_reader TO monitor_aps;

-- Verificação
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'monitor_aps_reader' LIMIT 5;
```

---

## Variáveis de Ambiente

Arquivo: `sysdoc_back/.env` (e `.env.example`)

```bash
# Monitor APS — banco eSUS PEC (somente leitura)
APS_DB_HOST=localhost
APS_DB_PORT=5432
APS_DB_DATABASE=esus
APS_DB_USERNAME=monitor_aps
APS_DB_PASSWORD=
MONITOR_APS_MUNICIPIO_NOME=Ilicínea
MONITOR_APS_MUNICIPIO_IBGE=3131703
MONITOR_APS_ESTRATO_IED=4
```

---

## Critérios de Aceitação

- [ ] `$this->db()` conecta ao PostgreSQL do eSUS PEC sem erros
- [ ] `GET /api/monitor-aps/config/status` retorna `connected: true` quando banco está acessível
- [ ] `POST /api/monitor-aps/config/test` valida credenciais e retorna total de equipes
- [ ] `POST /api/monitor-aps/config/save` persiste em `storage/app/monitor-aps-config.json`
- [ ] `GET /api/monitor-aps/config/equipes` lista equipes da `dim_equipe`
- [ ] Acesso ao banco é somente leitura (apenas SELECT)
- [ ] Usuários não-admin recebem 403 em `config/test` e `config/save`
