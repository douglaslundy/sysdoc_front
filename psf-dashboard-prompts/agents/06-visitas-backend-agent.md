# agents/06-visitas-backend-agent.md

## Nome
`visitas-backend-agent`

## Papel
Responsável por criar a **API Laravel** do módulo de Monitoramento de Visitas ACS/TACS. Faz queries no banco PostgreSQL do eSUS PEC (já conectado via `MonitorApsBaseController`) e expõe os endpoints consumidos pelas telas de lista e mapa do frontend.

## Escopo

Este agente cria:
1. `VisitaAcsController.php` — controller com métodos de lista, detalhe, mapa, equipes, agentes
2. Rotas em `routes/api.php` — grupo `monitor-aps`, mesmo middleware existente
3. Testes diretos no banco de produção para validar queries

**Não cria** nenhuma interface (isso é feito pelos agentes 07 e 08).

---

## Dependências

- Agentes 01–05 já executados (conexão PostgreSQL funcional via `MonitorApsBaseController::db()`)
- Banco de produção acessível: `187.108.119.178:5433`, banco `esus`, usuário `esus_leitura`

---

## Tarefas

### TAREFA 1: Explorar o schema de visitas no banco de produção

**OBRIGATÓRIO antes de escrever qualquer código.** Execute as queries abaixo e anote os resultados.

```php
// Executar via tinker ou criar um artisan command temporário:
// php artisan tinker

$db = app(\App\Http\Controllers\MonitorApsBaseController::class)->db();
// Se o método db() for protected, criar uma instância de VisitaAcsController temporariamente

// Query 1: descobrir tabela de visitas
$tables = DB::connection('pgsql_esus')->select("
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name ILIKE '%visita%'
    ORDER BY table_name
");
// Anotar o nome exato da tabela

// Query 2: colunas da tabela de visitas
$cols = DB::connection('pgsql_esus')->select("
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'tb_fat_visita_domiciliar'
    ORDER BY ordinal_position
");
// Se o nome for diferente, usar o nome encontrado na Query 1

// Query 3: verificar colunas de geolocalização
$geo = DB::connection('pgsql_esus')->select("
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'tb_fat_visita_domiciliar'
    AND (column_name ILIKE '%lat%' OR column_name ILIKE '%lon%' OR column_name ILIKE '%geo%')
");

// Query 4: amostra de dados reais (verificar nomes das colunas)
$sample = DB::connection('pgsql_esus')->select("SELECT * FROM tb_fat_visita_domiciliar LIMIT 3");

// Query 5: desfechos distintos
$outcomes = DB::connection('pgsql_esus')->select("
    SELECT DISTINCT co_dim_desfecho_visita, COUNT(*) as total
    FROM tb_fat_visita_domiciliar
    GROUP BY co_dim_desfecho_visita
    ORDER BY total DESC
    LIMIT 10
");

// Query 6: CBOs existentes (para confirmar ACS/TACS)
$cbos = DB::connection('pgsql_esus')->select("
    SELECT DISTINCT nu_cbo, COUNT(*) as total
    FROM tb_fat_visita_domiciliar
    GROUP BY nu_cbo
    ORDER BY total DESC
    LIMIT 10
");

// Query 7: tabela de equipes
$equipes = DB::connection('pgsql_esus')->select("
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name ILIKE '%dim_equipe%' OR table_name ILIKE '%tb_equipe%'
    ORDER BY table_name, ordinal_position
");
```

**Após executar:** ajuste todos os nomes de tabela e coluna no restante das tarefas com base nos resultados reais. Se houver divergência, adapte as queries.

---

### TAREFA 2: Criar `VisitaAcsController.php`

Arquivo: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VisitaAcsController extends MonitorApsBaseController
{
    // CBOs dos agentes comunitários (validar com resultados da Tarefa 1)
    private const ACS_CBOS = ['515105', '322255', '516220'];

    // Instrumentos de registro
    private const INSTRUMENT_LABELS = [
        1 => 'CDS',
        3 => 'PEC',
        4 => 'App e-SUS',
    ];

    // Desfechos (validar com produção na Tarefa 1)
    private const OUTCOME_LABELS = [
        1 => 'Visita realizada',
        2 => 'Morador não encontrado',
        3 => 'Morador se recusou',
        4 => 'Visita por outros meios',
    ];

    // Motivos (validar com produção na Tarefa 1)
    private const MOTIVE_LABELS = [
        1  => 'Acompanhamento de saúde',
        2  => 'Cadastramento / atualização',
        3  => 'Egresso de internação',
        4  => 'Controle ambiental / vetorial',
        5  => 'Convite para atividade coletiva',
        6  => 'Orientação / prevenção',
        99 => 'Outros',
    ];

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'ano'      => 'required|integer|min:2020|max:2030',
            'mes'      => 'required|integer|min:1|max:12',
            'ine'      => 'nullable|string',
            'agente'   => 'nullable|string',
            'page'     => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $ano     = (int) $request->ano;
        $mes     = (int) $request->mes;
        $ine     = $request->ine;
        $agente  = $request->agente;
        $perPage = (int) ($request->per_page ?? 20);
        $page    = (int) ($request->page ?? 1);
        $offset  = ($page - 1) * $perPage;

        $cbos = implode("','", self::ACS_CBOS);

        $where = "t.nu_ano = ? AND t.nu_mes = ? AND v.nu_cbo IN ('{$cbos}')
                  AND (v.st_ficha_inativa IS NULL OR v.st_ficha_inativa = 0)";
        $params = [$ano, $mes];

        if ($ine) {
            $where .= ' AND e.nu_ine = ?';
            $params[] = $ine;
        }

        if ($agente) {
            $where .= ' AND v.no_profissional = ?';
            $params[] = $agente;
        }

        $countRow = $this->db()->selectOne("
            SELECT COUNT(*) AS total
            FROM tb_fat_visita_domiciliar v
            JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
            JOIN tb_dim_tempo  t ON t.co_dim_tempo  = v.co_dim_tempo
            WHERE {$where}
        ", $params);

        $total = (int) ($countRow->total ?? 0);

        $rows = $this->db()->select("
            SELECT
                v.co_seq_fat_visita_domiciliar  AS id,
                v.no_profissional               AS agent_name,
                v.nu_cbo                        AS cbo,
                e.nu_ine                        AS team_ine,
                e.no_equipe                     AS team_name,
                v.dt_realizado                  AS visited_at,
                v.st_tipo_instrumento_registro  AS registration_instrument,
                v.co_dim_desfecho_visita        AS outcome_code,
                v.co_dim_motivo_visita          AS motive_code,
                CASE WHEN v.nu_latitude IS NOT NULL AND v.nu_longitude IS NOT NULL
                     THEN true ELSE false END   AS has_geolocation
            FROM tb_fat_visita_domiciliar v
            JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
            JOIN tb_dim_tempo  t ON t.co_dim_tempo  = v.co_dim_tempo
            WHERE {$where}
            ORDER BY v.dt_realizado DESC
            LIMIT ? OFFSET ?
        ", array_merge($params, [$perPage, $offset]));

        $data = array_map(fn($row) => $this->formatVisita($row), $rows);

        return response()->json([
            'data' => $data,
            'meta' => [
                'total'    => $total,
                'page'     => $page,
                'per_page' => $perPage,
                'pages'    => (int) ceil($total / $perPage),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $row = $this->db()->selectOne("
            SELECT
                v.co_seq_fat_visita_domiciliar  AS id,
                v.no_profissional               AS agent_name,
                v.nu_cbo                        AS cbo,
                e.nu_ine                        AS team_ine,
                e.no_equipe                     AS team_name,
                v.dt_realizado                  AS visited_at,
                v.st_tipo_instrumento_registro  AS registration_instrument,
                v.co_dim_desfecho_visita        AS outcome_code,
                v.co_dim_motivo_visita          AS motive_code,
                v.ds_anotacao                   AS notes,
                v.nu_latitude                   AS lat,
                v.nu_longitude                  AS lng,
                CASE WHEN v.nu_latitude IS NOT NULL AND v.nu_longitude IS NOT NULL
                     THEN true ELSE false END   AS has_geolocation
            FROM tb_fat_visita_domiciliar v
            JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
            WHERE v.co_seq_fat_visita_domiciliar = ?
        ", [$id]);

        if (! $row) {
            return response()->json(['message' => 'Visita não encontrada.'], 404);
        }

        return response()->json($this->formatVisita($row, detail: true));
    }

    public function mapa(Request $request): JsonResponse
    {
        $request->validate([
            'ano'    => 'required|integer|min:2020|max:2030',
            'mes'    => 'required|integer|min:1|max:12',
            'ine'    => 'nullable|string',
            'agente' => 'nullable|string',
        ]);

        $ano    = (int) $request->ano;
        $mes    = (int) $request->mes;
        $ine    = $request->ine;
        $agente = $request->agente;

        $cbos = implode("','", self::ACS_CBOS);

        $where = "t.nu_ano = ? AND t.nu_mes = ? AND v.nu_cbo IN ('{$cbos}')
                  AND v.nu_latitude IS NOT NULL AND v.nu_longitude IS NOT NULL
                  AND (v.st_ficha_inativa IS NULL OR v.st_ficha_inativa = 0)";
        $params = [$ano, $mes];

        if ($ine) {
            $where .= ' AND e.nu_ine = ?';
            $params[] = $ine;
        }

        if ($agente) {
            $where .= ' AND v.no_profissional = ?';
            $params[] = $agente;
        }

        $rows = $this->db()->select("
            SELECT
                v.co_seq_fat_visita_domiciliar  AS id,
                v.nu_latitude::float            AS lat,
                v.nu_longitude::float           AS lng,
                v.no_profissional               AS agent_name,
                v.nu_cbo                        AS cbo,
                e.nu_ine                        AS team_ine,
                e.no_equipe                     AS team_name,
                v.dt_realizado                  AS visited_at,
                v.co_dim_desfecho_visita        AS outcome_code
            FROM tb_fat_visita_domiciliar v
            JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
            JOIN tb_dim_tempo  t ON t.co_dim_tempo  = v.co_dim_tempo
            WHERE {$where}
            ORDER BY v.dt_realizado DESC
        ", $params);

        return response()->json([
            'data' => array_map(fn($row) => [
                'id'         => $row->id,
                'lat'        => (float) $row->lat,
                'lng'        => (float) $row->lng,
                'agent_name' => $row->agent_name,
                'cbo'        => $row->cbo,
                'team_ine'   => $row->team_ine,
                'team_name'  => $row->team_name,
                'visited_at' => $row->visited_at,
                'outcome_code' => $row->outcome_code,
                'outcome_label' => self::OUTCOME_LABELS[$row->outcome_code] ?? 'Outro',
            ], $rows),
        ]);
    }

    public function equipes(): JsonResponse
    {
        $cbos = implode("','", self::ACS_CBOS);

        $rows = $this->db()->select("
            SELECT DISTINCT e.nu_ine AS ine, e.no_equipe AS name
            FROM tb_fat_visita_domiciliar v
            JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
            WHERE v.nu_cbo IN ('{$cbos}')
            ORDER BY e.no_equipe
        ");

        return response()->json(['data' => $rows]);
    }

    public function agentes(Request $request): JsonResponse
    {
        $request->validate(['ine' => 'required|string']);

        $cbos = implode("','", self::ACS_CBOS);

        $rows = $this->db()->select("
            SELECT DISTINCT v.no_profissional AS name, v.nu_cbo AS cbo
            FROM tb_fat_visita_domiciliar v
            JOIN tb_dim_equipe e ON e.co_dim_equipe = v.co_dim_equipe
            WHERE e.nu_ine = ? AND v.nu_cbo IN ('{$cbos}')
            ORDER BY v.no_profissional
        ", [$request->ine]);

        return response()->json(['data' => $rows]);
    }

    private function formatVisita(object $row, bool $detail = false): array
    {
        $result = [
            'id'                      => $row->id,
            'agent_name'              => $row->agent_name,
            'cbo'                     => $row->cbo,
            'cbo_label'               => in_array($row->cbo, ['515105', '516220']) ? 'ACS' : 'TACS',
            'team_ine'                => $row->team_ine,
            'team_name'               => $row->team_name,
            'visited_at'              => $row->visited_at,
            'registration_instrument' => $row->registration_instrument,
            'instrument_label'        => self::INSTRUMENT_LABELS[$row->registration_instrument] ?? 'Outro',
            'outcome_code'            => $row->outcome_code,
            'outcome_label'           => self::OUTCOME_LABELS[$row->outcome_code] ?? 'Desfecho não informado',
            'motive_code'             => $row->motive_code ?? null,
            'motive_label'            => self::MOTIVE_LABELS[$row->motive_code ?? 0] ?? 'Não informado',
            'has_geolocation'         => (bool) $row->has_geolocation,
        ];

        if ($detail) {
            $result['notes'] = $row->notes ?? null;
            $result['lat']   = $row->lat ? (float) $row->lat : null;
            $result['lng']   = $row->lng ? (float) $row->lng : null;
        }

        return $result;
    }
}
```

**IMPORTANTE:** Após criar o arquivo, verificar se os nomes de colunas (`nu_cbo`, `no_profissional`, `dt_realizado`, `nu_latitude`, `nu_longitude`, `ds_anotacao`, `st_tipo_instrumento_registro`, `co_dim_desfecho_visita`, `co_dim_motivo_visita`, `st_ficha_inativa`) estão corretos com base na Tarefa 1. Ajustar conforme necessário.

---

### TAREFA 3: Registrar as rotas

Arquivo: `sysdoc_back/routes/api.php`

Adicionar dentro do grupo `monitor-aps` existente (após as rotas de config):

```php
// Visitas ACS/TACS
Route::prefix('visitas')->group(function () {
    Route::get('/',        [VisitaAcsController::class, 'index']);
    Route::get('/mapa',    [VisitaAcsController::class, 'mapa']);
    Route::get('/equipes', [VisitaAcsController::class, 'equipes']);
    Route::get('/agentes', [VisitaAcsController::class, 'agentes']);
    Route::get('/{id}',    [VisitaAcsController::class, 'show'])->whereNumber('id');
});
```

Adicionar o import no topo do arquivo (se não houver auto-import):
```php
use App\Http\Controllers\VisitaAcsController;
```

---

### TAREFA 4: Testar endpoints no banco de produção

Execute os testes abaixo com `php artisan tinker` ou via curl. **Se os dados não retornarem corretamente, volte à Tarefa 2 e ajuste as queries.**

```bash
# 4.1 — Descobrir ano/mês com dados (executar no tinker)
# DB::connection('pgsql_esus')->select("
#   SELECT t.nu_ano, t.nu_mes, COUNT(*) as total
#   FROM tb_fat_visita_domiciliar v
#   JOIN tb_dim_tempo t ON t.co_dim_tempo = v.co_dim_tempo
#   GROUP BY t.nu_ano, t.nu_mes
#   ORDER BY t.nu_ano DESC, t.nu_mes DESC LIMIT 10
# ");
# Usar o ano/mês com mais registros para os testes abaixo.

# 4.2 — Testar endpoint de lista (substituir {ano} e {mes} pelos valores encontrados)
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:8000/api/monitor-aps/visitas?ano={ano}&mes={mes}&page=1"

# Critério: deve retornar JSON com "data" (array) e "meta" (total, page, per_page, pages)
# Critério: ao menos 1 registro deve ter agent_name preenchido

# 4.3 — Testar endpoint de mapa
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:8000/api/monitor-aps/visitas/mapa?ano={ano}&mes={mes}"

# Critério: registros com lat e lng numéricos (não null)

# 4.4 — Testar detalhe de visita (usar um ID do resultado do 4.2)
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:8000/api/monitor-aps/visitas/{id}"

# Critério: retorna campos notes, lat, lng

# 4.5 — Testar equipes
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:8000/api/monitor-aps/visitas/equipes"

# 4.6 — Testar agentes por equipe (usar ine do resultado do 4.5)
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:8000/api/monitor-aps/visitas/agentes?ine={ine}"
```

**Se qualquer teste falhar:**
1. Analisar a mensagem de erro
2. Verificar nomes de colunas e tabelas no banco com `information_schema`
3. Corrigir as queries no controller
4. Re-testar até todos os critérios passarem

---

### TAREFA 5: Commit

Apenas após todos os testes da Tarefa 4 passarem:

```bash
git add sysdoc_back/app/Http/Controllers/VisitaAcsController.php
git add sysdoc_back/routes/api.php
git commit -m "feat(monitor-aps): adiciona API de visitas ACS/TACS

Endpoints: index (paginado), show, mapa (geoloc), equipes, agentes
Queries no banco operacional eSUS PEC (tb_fat_visita_domiciliar)
CBOs: ACS (515105/516220) e TACS (322255)"
```

---

## Variáveis de Ambiente

Nenhuma variável nova. Reutiliza `APS_DB_*` existentes.

---

## Critérios de Aceitação

- [ ] Query de exploração identifica nome correto das tabelas e colunas
- [ ] `GET /api/monitor-aps/visitas?ano=X&mes=Y` retorna array paginado com dados reais
- [ ] `GET /api/monitor-aps/visitas/mapa?ano=X&mes=Y` retorna somente visitas com lat/lng válidos
- [ ] `GET /api/monitor-aps/visitas/{id}` retorna detalhe incluindo `notes`, `lat`, `lng`
- [ ] `GET /api/monitor-aps/visitas/equipes` lista equipes que têm ACS/TACS
- [ ] `GET /api/monitor-aps/visitas/agentes?ine=X` lista agentes daquela equipe
- [ ] Filtros `ine` e `agente` em `/visitas` e `/visitas/mapa` funcionam corretamente
- [ ] `agent_name` está preenchido (não null) nos resultados
- [ ] Registros com geolocalização têm `lat` e `lng` numéricos (float)
- [ ] Acesso sem token retorna 401
