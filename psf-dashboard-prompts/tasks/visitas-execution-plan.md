# tasks/visitas-execution-plan.md — Fase 6: Visitas ACS/TACS

> Módulo de monitoramento de visitas domiciliares dos ACS/TACS, com lista filtrável, detalhe com relato e geolocalização, e mapa interativo da cidade.

---

## FASE 6A: Backend API (Agent 06)

### Task 6A.1 — Explorar schema de visitas no banco de produção ✅/⬜

```sql
-- Executar no banco de produção (187.108.119.178:5433 / banco: esus)
-- Via php artisan tinker ou via MonitorApsConfigController::explorar

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name ILIKE '%visita%';

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'tb_fat_visita_domiciliar'
ORDER BY ordinal_position;

SELECT DISTINCT nu_cbo, COUNT(*) FROM tb_fat_visita_domiciliar GROUP BY nu_cbo ORDER BY 2 DESC LIMIT 10;

SELECT DISTINCT co_dim_desfecho_visita, COUNT(*) FROM tb_fat_visita_domiciliar
GROUP BY co_dim_desfecho_visita ORDER BY 2 DESC;

SELECT t.nu_ano, t.nu_mes, COUNT(*) as total
FROM tb_fat_visita_domiciliar v
JOIN tb_dim_tempo t ON t.co_dim_tempo = v.co_dim_tempo
GROUP BY t.nu_ano, t.nu_mes ORDER BY 1 DESC, 2 DESC LIMIT 10;
```

**Critério:** Identificar nome exato das colunas de: profissional, CBO, geolocalização, desfecho, instrumento, relato.

### Task 6A.2 — Criar `VisitaAcsController.php` ⬜

Arquivo: `sysdoc_back/app/Http/Controllers/VisitaAcsController.php`

Métodos (usar nomes de colunas confirmados na Task 6A.1):
- `index(Request $request): JsonResponse` — lista paginada
- `show(int $id): JsonResponse` — detalhe
- `mapa(Request $request): JsonResponse` — apenas registros com lat/lng
- `equipes(): JsonResponse` — equipes com ACS
- `agentes(Request $request): JsonResponse` — agentes por equipe

### Task 6A.3 — Registrar rotas ⬜

Arquivo: `sysdoc_back/routes/api.php`

Dentro do grupo `monitor-aps` existente:
```php
Route::prefix('visitas')->group(function () {
    Route::get('/',        [VisitaAcsController::class, 'index']);
    Route::get('/mapa',    [VisitaAcsController::class, 'mapa']);
    Route::get('/equipes', [VisitaAcsController::class, 'equipes']);
    Route::get('/agentes', [VisitaAcsController::class, 'agentes']);
    Route::get('/{id}',    [VisitaAcsController::class, 'show'])->whereNumber('id');
});
```

### Task 6A.4 — Testar todos os endpoints ⬜

Verificar com curl ou tinker usando ano/mês com dados reais:

```bash
curl -H "Authorization: Bearer {TOKEN}" "http://localhost:8000/api/monitor-aps/visitas?ano={ano}&mes={mes}"
curl -H "Authorization: Bearer {TOKEN}" "http://localhost:8000/api/monitor-aps/visitas/mapa?ano={ano}&mes={mes}"
curl -H "Authorization: Bearer {TOKEN}" "http://localhost:8000/api/monitor-aps/visitas/equipes"
curl -H "Authorization: Bearer {TOKEN}" "http://localhost:8000/api/monitor-aps/visitas/agentes?ine={ine}"
curl -H "Authorization: Bearer {TOKEN}" "http://localhost:8000/api/monitor-aps/visitas/{id}"
```

**Se qualquer query falhar:** analisar erro, revisar colunas/tabelas, corrigir, retestar.

### Task 6A.5 — Commit ⬜

```bash
git commit -m "feat(monitor-aps): adiciona API de visitas ACS/TACS"
```

**Checklist 6A:**
- [ ] Tabela e colunas confirmadas no banco de produção
- [ ] Controller criado com 5 métodos
- [ ] Rotas registradas em `api.php`
- [ ] `GET /visitas?ano=X&mes=Y` retorna array com `data` e `meta`
- [ ] `GET /visitas/mapa` retorna apenas visitas com lat/lng
- [ ] `GET /visitas/{id}` retorna `notes`, `lat`, `lng`
- [ ] `GET /visitas/equipes` lista equipes com ACS
- [ ] `GET /visitas/agentes?ine=X` lista agentes da equipe
- [ ] Commit realizado

---

## FASE 6B: Frontend — Lista de Visitas (Agent 07)

**Pré-requisito:** Fase 6A concluída (todos os critérios acima marcados)

### Task 6B.1 — Instalar dependências ⬜

```bash
cd sysdoc_front
npm install react-leaflet leaflet
mkdir -p public/leaflet
cp node_modules/leaflet/dist/images/marker-icon.png public/leaflet/
cp node_modules/leaflet/dist/images/marker-icon-2x.png public/leaflet/
cp node_modules/leaflet/dist/images/marker-shadow.png public/leaflet/
```

### Task 6B.2 — Configurar Leaflet no `_app.js` ⬜

Adicionar import do CSS e fix dos ícones no `sysdoc_front/pages/_app.js`.

### Task 6B.3 — Criar duck Redux `visitasAcs` ⬜

Arquivo: `sysdoc_front/src/store/ducks/visitasAcs/index.js`
Adicionar ao combineReducers em `src/store/index.js`.

### Task 6B.4 — Criar fetch actions ⬜

Arquivo: `sysdoc_front/src/store/fetchActions/visitasAcs/index.js`

### Task 6B.5 — Criar `VisitaDetailModal.js` ⬜

Arquivo: `sysdoc_front/src/components/monitor-aps/visitas/VisitaDetailModal.js`

Incluir:
- Seção de informações da visita
- Seção de relato/anotação
- Seção de localização (mapa Leaflet + painel Mapillary)

### Task 6B.6 — Criar `VisitasList.js` ⬜

Arquivo: `sysdoc_front/src/components/monitor-aps/visitas/VisitasList.js`

Incluir: filtros (ano, mês, equipe, agente), tabela paginada, botão "Ver".

### Task 6B.7 — Criar page wrapper ⬜

Arquivo: `sysdoc_front/pages/monitor-aps/visitas.js`

### Task 6B.8 — Adicionar ao menu lateral ⬜

Link "Visitas ACS" → `/monitor-aps/visitas` com ícone `map-pin`.

### Task 6B.9 — Testar no browser ⬜

Acessar http://localhost:3000/monitor-aps/visitas e verificar todos os critérios.

### Task 6B.10 — Commit ⬜

```bash
git commit -m "feat(monitor-aps): tela de listagem de visitas ACS/TACS"
```

**Checklist 6B:**
- [ ] `npm install` sem erros
- [ ] Leaflet CSS e ícones configurados
- [ ] Duck Redux criado e integrado ao store
- [ ] Fetch actions funcionando (sem erros de console)
- [ ] Tabela exibe visitas reais do banco
- [ ] Filtros ano e mês funcionam
- [ ] Filtro equipe carrega lista da API
- [ ] Filtro agente habilita apenas quando equipe selecionada
- [ ] Botão "Ver" abre modal com dados corretos
- [ ] Modal exibe relato (ou "Nenhum relato registrado.")
- [ ] Modal exibe mapa Leaflet para visitas com geolocalização
- [ ] Modal exibe fallback quando street view não está disponível
- [ ] Paginação funciona
- [ ] Menu lateral tem link "Visitas ACS"
- [ ] Commit realizado

---

## FASE 6C: Frontend — Mapa da Cidade (Agent 08)

**Pré-requisito:** Fase 6B concluída

### Task 6C.1 — Criar `MapaVisitas.js` ⬜

Arquivo: `sysdoc_front/src/components/monitor-aps/visitas/MapaVisitas.js`

Incluir:
- Filtros: modo, equipe, agente, ano, mês
- Mapa Leaflet com CircleMarker por visita
- Cores por equipe / agente / desfecho conforme modo
- Tooltip no hover
- Legenda dinâmica
- Contador de pins

### Task 6C.2 — Criar page wrapper do mapa ⬜

Arquivo: `sysdoc_front/pages/monitor-aps/visitas/mapa.js`

### Task 6C.3 — Adicionar "Mapa de Visitas" ao menu ⬜

Link "Mapa de Visitas" → `/monitor-aps/visitas/mapa` com ícone `map`.

### Task 6C.4 — Testar no browser ⬜

1. Acessar `/monitor-aps/visitas/mapa`
2. Verificar mapa carrega com OpenStreetMap
3. Verificar pins georreferenciados
4. Testar todos os modos de cor
5. Testar hover tooltip e click no pin

**Se não houver pins:**
```sql
-- Verificar no banco
SELECT COUNT(*) FROM tb_fat_visita_domiciliar
WHERE nu_latitude IS NOT NULL AND nu_longitude IS NOT NULL;
```
Se zero, registros sem geolocalização → funcionalidade correta (mapa vazio), documentar.

### Task 6C.5 — Commit ⬜

```bash
git commit -m "feat(monitor-aps): mapa de visitas com pins georreferenciados"
```

**Checklist 6C:**
- [ ] Mapa carrega centralizado em Ilicínea/MG
- [ ] Pins aparecem com lat/lng corretos
- [ ] Modo Todos: cor por equipe
- [ ] Modo Equipe: cor por agente
- [ ] Modo Agente: cor por desfecho
- [ ] Legenda atualiza por modo
- [ ] Tooltip no hover: agente, equipe, data/hora, desfecho
- [ ] Click no pin: modal com detalhe e street view
- [ ] Filtros ano e mês atualizam pins
- [ ] Filtro equipe filtra pins
- [ ] Menu tem "Mapa de Visitas"
- [ ] Sem erros de console
- [ ] Commit realizado

---

## Verificação Final (Após 6A + 6B + 6C)

```bash
# 1. Backend (curl ou Postman):
GET /api/monitor-aps/visitas?ano={ano}&mes={mes}        → array paginado
GET /api/monitor-aps/visitas/mapa?ano={ano}&mes={mes}   → visitas com lat/lng
GET /api/monitor-aps/visitas/{id}                       → detalhe + notes + lat + lng

# 2. Frontend (browser):
/monitor-aps/visitas           → lista com filtros e paginação
/monitor-aps/visitas/mapa      → mapa com pins e legenda
Modal de detalhe               → relato + mapa + street view

# 3. Banco de produção (confirmar dados reais):
SELECT COUNT(*) FROM tb_fat_visita_domiciliar WHERE nu_latitude IS NOT NULL;
```
