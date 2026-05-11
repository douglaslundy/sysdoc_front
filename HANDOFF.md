# HANDOFF.md — Contexto para continuação

**Última atualização:** 2026-05-11 — checkpoint 6ª sessão (Fase N concluída)
**Fase atual:** nenhuma — implementação completa A–N, todos os commits pushados
**Próxima ação:** deploy em produção — migrate + seed + cache:forget

---

## CHECKPOINT 6ª SESSÃO — 2026-05-11 (Fase N)

### Estado resumido
1 tarefa concluída: auditoria de CREATE/UPDATE/DELETE implementada em todos os controllers que estavam sem cobertura (15 controllers + 1 observer). Um único commit pushado. **Nenhum blocker de código — blocker apenas operacional (migrations em produção).**

### O que foi implementado (N1 — Auditoria completa do sistema)

`AuditService::record()` adicionado em todos os controllers que não tinham cobertura:

| Controller | CREATE | UPDATE | DELETE |
|---|---|---|---|
| LetterController | ✓ store | ✓ update | ✓ destroy |
| OrdinanceController | ✓ store | ✓ update | ✓ destroy |
| QueueController | ✓ store | ✓ update | ✓ destroy |
| ExameController | ✓ store | ✓ update | ✓ destroy |
| CategoriaExameController | ✓ store | ✓ update | ✓ destroy |
| ExameCampoController | ✓ store | ✓ update | ✓ destroy |
| CampoReferenciaController | ✓ store | ✓ update | ✓ destroy |
| MedicoSolicitanteController | ✓ store | ✓ update | ✓ destroy |
| VehicleController | ✓ store | ✓ update | ✓ destroy (active=false) |
| RouteController | ✓ store | ✓ update | ✓ destroy (active=false) |
| RoomController | ✓ store | ✓ update | ✓ destroy |
| CallController | ✓ store | ✓ update | — (destroy não impl.) |
| CallServiceController | ✓ store | ✓ update | ✓ destroy |
| SystemPageController | ✓ store | ✓ update | ✓ destroy |
| SectorController | ✓ insert | ✓ update | ✓ delete |
| PedidoExameObserver | — | — | ✓ forceDeleted() |

**Detalhe do PedidoExameObserver:** `forceDelete()` dispara o evento `forceDeleted`, NÃO `deleted`. O método `deleted()` existente no observer não era chamado. Adicionado `forceDeleted()` para capturar a auditoria de exclusão física de pedidos.

**Padrão usado em todos os controllers:**
```php
// store()
$model = Model::create($data); // ou $model->save()
AuditService::record('CREATE', $model, null, $model->toArray());

// update()
$old = $model->toArray();
$model->update($data); // ou $model->save()
AuditService::record('UPDATE', $model, $old, $model->toArray());

// destroy()
AuditService::record('DELETE', $model, $model->toArray(), null);
$model->delete(); // ou forceDelete() ou active=false
```

### Commits desta sessão

**sysdoc_back:**
| Hash | Descrição |
|---|---|
| `845a784` | feat(audit): adiciona AuditService::record() em todos os controllers sem cobertura |

**sysdoc_front:** nenhum commit nesta sessão.

### Cobertura de auditoria atual (pós-sessão N)

| Ação | Cobertura |
|---|---|
| LOGIN | ✓ AuthController::login() |
| LOGOUT | ✓ LogUserAction middleware |
| CREATE | ✓ 100% dos controllers relevantes |
| UPDATE | ✓ 100% dos controllers relevantes |
| DELETE | ✓ 100% dos controllers relevantes (incluindo forceDelete via observer) |
| VIEW (individual) | ✓ ResultadoExame, Client, PedidoExame, Queue |
| VIEW_REPORT | ✓ ClientController::detailedClientReport() |
| DOWNLOAD | ✓ ResultadoExameController::downloadPdf() |
| LIBERAR | ✓ ResultadoExameController::liberar() |

---

## CHECKPOINT 5ª SESSÃO — 2026-05-11 (Fase M)

### Estado resumido
6 tarefas concluídas: cascade deletion, bloco Exames no client_report, fix fatal error PHP, fix crítico de auditoria (ENUM → VARCHAR), melhorias na página de auditoria, e exibição de endpoint nas ações VIEW. Todos os commits pushados em ambos os repos.

### Bugs críticos corrigidos

#### M3 — QueueController show() duplicado (FATAL ERROR)
O método `show()` foi adicionado com audit (L2) mas o `show()` original não foi removido. PHP não boot. **Detectado via `php artisan route:list` durante verificação estática.** Removido o duplicado — commit `0d82c3e`.

#### M4 — audit_logs.action ENUM restrito (AUDIT SILENCIOSO)
**Este era o bug mais crítico.** A coluna `action` era `ENUM('LOGIN','LOGOUT','CREATE','UPDATE','DELETE')`. Ações `VIEW`, `VIEW_REPORT`, `LIBERAR`, `DOWNLOAD` eram rejeitadas pelo MySQL com constraint error, engolido pelo `catch (\Throwable)` do `AuditService`. **Zero logs gravados para essas ações desde o início.** Fix: migration `VARCHAR(30)`. Commit `acbcd4e`.

### Commits desta sessão

**sysdoc_back:**
| Hash | Descrição |
|---|---|
| `b727d85` | fix: usar forceDelete() ao excluir pedido de exame |
| `c619d20` | feat: inclui pedidosExame no relatorio detalhado de cliente |
| `0d82c3e` | fix: remove show() duplicado no QueueController |
| `acbcd4e` | fix: converte audit_logs.action de ENUM para VARCHAR(30) |
| `970c534` | feat: filtro por user_name e endpoint /audit-logs/users |

**sysdoc_front:**
| Hash | Descrição |
|---|---|
| `3d4c478` | feat: bloco Exames e contadores de registros no client_report |
| `3c8ca9f` | feat: select de usuarios, recurso uppercase e acoes completas na auditoria |
| `b74e89a` | feat: exibe endpoint apos acao VIEW e VIEW_REPORT na auditoria |

---

## PENDÊNCIAS OPERACIONAIS — PRODUÇÃO

**ORDEM EXATA para deploy em produção:**
```bash
# 1. Migrations (inclui a CRÍTICA do VARCHAR audit_logs)
php artisan migrate --force

# 2. Permissões de acesso
php artisan db:seed --class=AccessProfileSeeder --force

# 3. Limpar cache do dashboard lab
php artisan cache:forget dashboard.laboratorio

# 4. Frontend — já deployado via Vercel (push já realizado)
```

**Migrations pendentes em produção:**
```
2026_05_10_300000_add_trigger_prevent_delete_pedido_liberado  → trigger BEFORE UPDATE
2026_05_10_400000_alter_audit_logs_action_to_varchar          → CRÍTICA — sem ela, VIEW/LIBERAR/DOWNLOAD não gravam
```

**Risco CRÍTICO R1:** Enquanto a migration `400000` não rodar em produção, **nenhum log de VIEW, VIEW_REPORT, LIBERAR ou DOWNLOAD é gravado.** O sistema funciona normalmente mas sem auditoria dessas ações.

---

## PRÓXIMOS PASSOS (se houver nova sessão de desenvolvimento)

**Não há backlog de código pendente.** A implementação A–N está 100% concluída e pushada.

Possíveis tópicos para sessões futuras:
- Testes de feature no backend (PHPUnit para controllers de auditoria)
- Correção dos 4 warnings de importação no build do frontend (`inactiveCallFetch`, `editQueueFetch`, `turnModalViewService`, `setFilteredCalls`)
- Funcionalidades novas solicitadas pelo usuário

---

## PADRÕES DO PROJETO (não quebrar)

- Commits por feature/fix — nunca commits em branco
- Validações em `App\Http\Requests`, nunca inline em controllers
- Redux: ducks em `store/ducks/<feature>`, async em `store/fetchActions/<feature>`
- `AuditService::record()` silencia exceções — nunca quebra a app
- PDF download: sempre `api.get(blob)` + `URL.createObjectURL`
- Datas: sempre `s.substring(0,10).split('-')` — nunca `new Date(str)` (offset UTC-3)
- forceDelete() para pedidos de exame — não usar soft delete
- Padrão view*Fetch: sempre chamar GET antes de abrir modal que precisa de audit
- VehicleController/RouteController::destroy() usa `active=false` (não delete físico)
- SectorController usa nomes customizados: `insert()`, `update()`, `delete()`
- audit_logs.action é VARCHAR(30) — pode receber qualquer string, sem migration para novos tipos

---

## HISTÓRICO DE CHECKPOINTS ANTERIORES

Ver commits nos repositórios para contexto completo:
- `sysdoc_back`: main, commits `5b8113c` até `845a784`
- `sysdoc_front`: main, commits `b0bcfdc` até `b74e89a`
