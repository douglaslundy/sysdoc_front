# Design: Permissão por Equipe APS no Monitor APS

**Data:** 2026-05-29  
**Status:** Aprovado — aguardando implementação

---

## Contexto

O sistema Monitor APS exibe indicadores de qualidade, vínculo territorial, visitas ACS e cadastros de cidadãos, todos filtráveis por equipe (parâmetro `?ine=`). Atualmente qualquer usuário autenticado com acesso às páginas vê todas as equipes do município.

Este design adiciona uma camada de restrição: usuários identificados como **Responsáveis Técnicos de Equipe PSF (RT PSF)** passam a ver apenas as equipes explicitamente autorizadas a eles. O filtro é aplicado no servidor.

---

## Escopo

Páginas afetadas:
- `/monitor-aps/vinculo`
- `/monitor-aps/qualidade`
- `/monitor-aps/equipe`
- `/monitor-aps/visitas`
- `/monitor-aps/visitas/mapa`
- `/monitor-aps/visitas/evolucao`
- `/monitor-aps/cidadaos`

---

## Regras de Negócio

| `is_rt_psf` | `rt_all_teams` | Equipes em `user_equipe_aps` | Comportamento |
|---|---|---|---|
| `false` | qualquer | qualquer | Acesso irrestrito — vê todas as equipes |
| `true` | `true` | qualquer | RT mas com acesso total a todas as equipes |
| `true` | `false` | `[A, B, C]` | Filtrado — vê apenas A, B e C |
| `true` | `false` | vazio | Não vê nenhuma equipe (edge case — UI deve alertar) |

Um usuário com `is_rt_psf = false` que tenha acesso às páginas via perfil de acesso continua vendo todas as equipes, sem alteração de comportamento.

---

## Banco de Dados

### Migration 1 — `add_rt_psf_to_users_table`

Adiciona à tabela `users`:

```php
$table->boolean('is_rt_psf')->default(false)->after('is_driver');
$table->boolean('rt_all_teams')->default(false)->after('is_rt_psf');
```

### Migration 2 — `create_user_equipe_aps_table`

```php
Schema::create('user_equipe_aps', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->string('nu_ine', 10);
    $table->string('no_equipe', 100);
    $table->unique(['user_id', 'nu_ine']);
    $table->timestamps();
});
```

`no_equipe` é armazenado localmente (cache) para evitar dependência de conexão ao eSUS PEC na exibição do nome da equipe no modal de cadastro.

---

## Backend

### Modelo `User`

Adicionar ao `$fillable`: `is_rt_psf`, `rt_all_teams`.

Novo relacionamento:
```php
public function equipeAps()
{
    return $this->hasMany(UserEquipeAps::class, 'user_id');
}
```

### Novo Modelo `UserEquipeAps`

```
App\Models\UserEquipeAps
fillable: user_id, nu_ine, no_equipe
```

### Endpoints

#### `PUT /api/users/{id}/equipe-aps` (middleware: auth:sanctum + admin)

Payload:
```json
{
  "is_rt_psf": true,
  "rt_all_teams": false,
  "equipes": [
    { "nu_ine": "0001234567", "no_equipe": "ESF CENTRO" },
    { "nu_ine": "0009876543", "no_equipe": "ESF NORTE" }
  ]
}
```

Ação: atualiza `is_rt_psf` e `rt_all_teams` no usuário; sincroniza `user_equipe_aps` via `sync()` (deleta os removidos, insere os novos).

#### `GET /api/monitor-aps/minhas-equipes` (middleware: auth:sanctum)

Retorna as equipes que o usuário logado pode ver:

```json
{
  "is_rt": true,
  "all_teams": false,
  "equipes": [
    { "nu_ine": "0001234567", "no_equipe": "ESF CENTRO" }
  ]
}
```

Se `is_rt = false` ou `all_teams = true`, retorna `equipes: []` com flag indicando acesso irrestrito.

#### `GET /api/monitor-aps/config/equipes`

Removido do grupo `middleware('admin')` — liberado para qualquer usuário autenticado. Necessário para popular o seletor de equipes no UserModal.

### Middleware `EnsureEquipeAps`

Aplicado a todas as rotas `/monitor-aps/` exceto `/config/save`, `/config/test`, `/config/explorar` (que permanecem admin).

```php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();

    if (!$user->is_rt_psf || $user->rt_all_teams) {
        // sem restrição — injeta null (sem filtro)
        $request->attributes->set('_ines_permitidos', null);
        return $next($request);
    }

    $ines = $user->equipeAps->pluck('nu_ine')->toArray();
    $request->attributes->set('_ines_permitidos', $ines);

    return $next($request);
}
```

### Helper em `MonitorApsBaseController`

```php
protected function resolveAllowedInes(Request $request): ?array
{
    return $request->attributes->get('_ines_permitidos'); // null = sem filtro
}

protected function assertIneAllowed(Request $request, ?string $ine): void
{
    if ($ine === null) return;
    $allowed = $this->resolveAllowedInes($request);
    if ($allowed !== null && !in_array($ine, $allowed, true)) {
        abort(403, 'Equipe não autorizada.');
    }
}
```

### Ajustes nos Controllers

Nos endpoints que recebem `?ine=`:

```php
$ine = $request->query('ine');
$this->assertIneAllowed($request, $ine);

// Se ine não foi passado e o usuário tem restrição, aplicar filtro automático
$allowedInes = $this->resolveAllowedInes($request);
if ($ine === null && $allowedInes !== null) {
    // query filtra por IN ($allowedInes) em vez de trazer todas
}
```

Controllers afetados:
- `MonitorApsController::vinculo()`
- `MonitorApsController::qualidade()`
- `MonitorApsController::qualidadeIndicador()`
- `MonitorApsController::historico()`
- `VisitaAcsController` — todos os endpoints (index, resumo, lista, mapa, agentes, evolucao, responsabilidade)
- `CidadaoAcsController::index()` e `::agentes()`

**Nota sobre cache:** a chave de cache deve incluir os INEs do usuário quando há restrição, para evitar que um cache de "todas as equipes" seja devolvido a um usuário restrito. Formato sugerido: `aps_vinculo_{ano}_{quad}_{ine ?? 'all'}_{inesHash}` onde `inesHash` é `md5(implode(',', $allowedInes ?? []))`.

### `UserController`

`store()` e `update()` passam a aceitar e persistir `is_rt_psf` e `rt_all_teams` via `$fillable`. As equipes (`equipes[]`) são tratadas no endpoint separado `PUT /users/{id}/equipe-aps` para manter separação de responsabilidade.

---

## Frontend

### Hook `useEquipesPermitidas()`

Novo hook em `src/services/monitorApsApi.js` ou em `src/hooks/useEquipesPermitidas.js`:

```js
// Chama GET /api/monitor-aps/minhas-equipes
// Retorna { equipes, allTeams, isRt, loading }
// Usado nas 7 páginas para limitar o seletor de equipe
```

### UserModal — novo bloco (visível apenas para `userProfile === 'admin'`)

Campos adicionados ao formulário:

```
[ Switch ] É RT de Equipe PSF?
  └── se marcado (is_rt_psf = true):
      [ Checkbox ] Acesso a todas as equipes  (rt_all_teams)
      └── se desmarcado:
          [ Autocomplete multiple ] Equipes autorizadas
            - Fonte: GET /api/monitor-aps/config/equipes
            - Label: no_equipe
            - Valor salvo: { nu_ine, no_equipe }
            - Carregado lazy ao abrir o seletor
```

Ao salvar, o UserModal faz:
1. `PUT /api/users/{id}` com dados pessoais + `is_rt_psf` + `rt_all_teams`
2. Se `is_rt_psf = true`: `PUT /api/users/{id}/equipe-aps` com lista de equipes

Ao carregar para edição, o UserModal faz:
1. `GET /api/users/{id}` (já existente) — retorna `is_rt_psf`, `rt_all_teams`
2. `GET /api/users/{id}/equipe-aps` — retorna equipes vinculadas (novo endpoint de leitura)

### Seletor de Equipe nas 7 Páginas

Todas as páginas que possuem seletor de equipe (`?ine=`) passam a usar `useEquipesPermitidas()`:

- **`isRt = false` ou `allTeams = true`:** seletor exibe todas as equipes (comportamento atual)
- **`isRt = true` e equipes específicas:** seletor exibe apenas as equipes autorizadas + opção "Todas as minhas equipes" (que remove `?ine=` da query e agrega)

A opção "Todas as minhas equipes" envia a requisição sem `?ine=`, e o backend aplica automaticamente o filtro por todos os INEs do usuário (via `_ines_permitidos`).

---

## Segurança

- O filtro é aplicado no servidor via middleware — manipulação de URL pelo usuário resulta em 403.
- O endpoint `GET /monitor-aps/config/equipes` retorna apenas `nu_ine` e `no_equipe` — sem dados sensíveis.
- O endpoint `PUT /users/{id}/equipe-aps` é restrito a `admin`.
- Cache keys incluem hash dos INEs para evitar cross-contamination de cache entre usuários.

---

## Fora do Escopo

- Páginas do monitor-aps que não constam na lista (ex: `/monitor-aps/configuracoes`, `/monitor-aps/fila-esus`) — não recebem filtro.
- Histórico de alterações de equipes por usuário (auditoria de quem atribuiu quais equipes).
- Sincronização automática quando uma equipe some do eSUS PEC (equipes removidas do eSUS não são automaticamente removidas de `user_equipe_aps`).
