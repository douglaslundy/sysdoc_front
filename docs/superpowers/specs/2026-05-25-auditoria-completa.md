# Auditoria Completa — Observers CRUD + Middleware READ

**Data:** 2026-05-25
**Escopo:** Cobertura total de auditoria em todas as páginas do sistema

---

## Objetivo

Garantir que toda ação do usuário — criação, edição, exclusão e visualização — seja registrada em `audit_logs`. Hoje apenas 7 models têm cobertura via Observer. 15 models com CRUD ficam sem Observer (alguns têm chamadas manuais frágeis). Páginas de leitura do Monitor APS não têm auditoria alguma.

---

## Arquitetura

Dois mecanismos com responsabilidades distintas:

1. **Observers** — capturam mutações (CREATE/UPDATE/DELETE) em todos os models
2. **Middleware `AuditReadAccess`** — captura acessos de leitura (READ) nas rotas do Monitor APS

---

## Parte 1 — Observers CRUD

### Models que ganham Observer (novos, sem cobertura alguma)

| Model | Página |
|-------|--------|
| `MedicineItem` | `/pharmacy/medicines` |
| `MedicineDailyStatus` | `/pharmacy/daily-status` |
| `MedicineMonthlyAcquisition` | `/pharmacy/monthly-acquisitions` |
| `VigilanciaConfig` | `/vigilancia/configuracoes` |
| `MonitorApsConfig` | `/monitor-aps/configuracoes` |

### Models que migram de AuditService manual para Observer

| Model | Página | Controller afetado |
|-------|--------|--------------------|
| `Exame` | `/laboratorio/exames` | ExameController |
| `CategoriaExame` | `/laboratorio/categorias` | CategoriaExameController |
| `MedicoSolicitante` | `/laboratorio/medicos` | MedicoSolicitanteController |
| `Vehicle` | `/vehicles` | VehicleController |
| `Route` | `/routes` | RouteController |
| `Letter` | `/letters` | LetterController |
| `Ordinance` | `/ordinance` | OrdinanceController |
| `Estabelecimento` | `/estabelecimentos` | EstabelecimentoController |
| `Alvara` | `/alvaras` | AlvaraController |
| `SystemPage` | `/paginas-sistema` | SystemPageController |
| `PageCategory` | `/paginas-categorias` | PageCategoryController |

### Padrão de cada Observer

Seguir exatamente o `UserObserver` existente:

```php
class MedicineItemObserver
{
    public function created(MedicineItem $model): void
    {
        AuditService::record('CREATE', $model, null, $model->toArray());
    }

    public function updated(MedicineItem $model): void
    {
        $dirty    = $model->getDirty();
        $original = array_intersect_key($model->getOriginal(), $dirty);
        AuditService::record('UPDATE', $model, $original, $dirty);
    }

    public function deleted(MedicineItem $model): void
    {
        AuditService::record('DELETE', $model, $model->toArray(), null);
    }
}
```

### Registro em AppServiceProvider

Cada Observer adicionado ao `boot()` de `AppServiceProvider`:

```php
MedicineItem::observe(MedicineItemObserver::class);
```

### Remoção das chamadas manuais

Nos 11 controllers que já chamam `AuditService::record()` manualmente, remover essas chamadas após criar o Observer correspondente — o Observer cobre automaticamente.

---

## Parte 2 — Middleware AuditReadAccess

### Arquivo

`app/Http/Middleware/AuditReadAccess.php`

### Funcionamento

Roda no `terminate()` (após a resposta, sem adicionar latência). Grava `READ` com os query params como `new_values` (representa os filtros aplicados).

```php
public function terminate(Request $request, $response): void
{
    AuditService::record('READ', null, null, $request->query() ?: null);
}
```

### Rotas cobertas

Aplicado nos grupos de rota autenticados do Monitor APS em `routes/api.php`:

- `GET /monitor-aps/indicadores/*`
- `GET /monitor-aps/visitas/*`
- `GET /monitor-aps/config`

Captura automaticamente:
- **Abertura de página** — primeira requisição ao endpoint
- **Filtros aplicados** — nova requisição com query params diferentes (ano, mês, INE, agente)
- **Registro aberto** — busca por CPF/CNS/nome gera requisição com `busca=...`

---

## Parte 3 — Tela de Auditoria (frontend)

**Arquivo:** `sysdoc_front/src/components/monitor-aps/` (tela existente em `/auditoria`)

Única mudança: adicionar `READ` como opção no filtro de `action`. Por padrão `READ` fica **desmarcado** para não poluir a visão padrão de mutações. O admin ativa quando quiser ver acessos de leitura.

---

## Arquivos a criar/modificar

### Criar (Observers novos — 15 arquivos)
- `app/Observers/MedicineItemObserver.php`
- `app/Observers/MedicineDailyStatusObserver.php`
- `app/Observers/MedicineMonthlyAcquisitionObserver.php`
- `app/Observers/VigilanciaConfigObserver.php`
- `app/Observers/MonitorApsConfigObserver.php`
- `app/Observers/ExameObserver.php`
- `app/Observers/CategoriaExameObserver.php`
- `app/Observers/MedicoSolicitanteObserver.php`
- `app/Observers/VehicleObserver.php`
- `app/Observers/RouteObserver.php`
- `app/Observers/LetterObserver.php`
- `app/Observers/OrdinanceObserver.php`
- `app/Observers/EstabelecimentoObserver.php`
- `app/Observers/AlvaraObserver.php`
- `app/Observers/SystemPageObserver.php`
- `app/Observers/PageCategoryObserver.php`

### Criar (Middleware)
- `app/Http/Middleware/AuditReadAccess.php`

### Modificar
- `app/Providers/AppServiceProvider.php` — registrar os 16 novos Observers
- `app/Http/Kernel.php` — registrar o middleware `AuditReadAccess`
- `routes/api.php` — aplicar middleware nos grupos do Monitor APS
- 11 controllers — remover chamadas manuais de `AuditService::record()`
- `sysdoc_front/src/pages/auditoria.js` (ou componente similar) — adicionar `READ` no filtro de ação

---

## O que não muda

- Schema da tabela `audit_logs` — nenhuma migration necessária
- `AuditService.php` — nenhuma alteração
- Os 7 Observers já existentes — nenhuma alteração
- Controllers do Monitor APS — nenhuma alteração (middleware cuida de tudo)
