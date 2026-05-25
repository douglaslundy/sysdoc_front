# Feature Inventory

Inventário completo das funcionalidades reais do Sysdoc com evidências no código.

---

## 1. AUTENTICAÇÃO E CONTROLE DE ACESSO

**Evidências:** `AuthController.php`, `app/Models/User.php`, `AccessProfileSeeder.php`, `middleware/AdminOnly.php`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Login por CPF + senha | POST /login | AuthController::login |
| Logout com revogação de token | POST /logout | AuthController::logout |
| Validação de token ativo | POST /validate | AuthController::validate |
| Registro de usuário | POST /register | AuthController::register (throttle 5/min) |
| Reset de senha | POST /forgot-password | PasswordResetController |
| Consulta de permissões do usuário | GET /auth/my-permissions | AuthController::myPermissions |
| RBAC por perfil (6 perfis) | middleware:admin, can: | AdminOnly, AccessProfile |
| Permissões granulares por página | profile_page_permissions | AccessProfileController |

---

## 2. LABORATÓRIO

**Evidências:** `ExameController.php`, `PedidoExameController.php`, `ResultadoExameController.php`, `Laboratorio/LaudoPdfService.php`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Cadastro de exames com campos dinâmicos | POST /laboratorio/exames | ExameController, ExameCampoController |
| Categorias de exames | CRUD /laboratorio/categorias | CategoriaExameController |
| Faixas de referência por campo | CRUD /laboratorio/campos-referencia | CampoReferenciaController |
| Pedido de exame | POST /laboratorio/pedidos | PedidoExameController |
| State machine de status do pedido | PATCH /laboratorio/pedidos/{id}/status | PedidoExameController::atualizarStatus |
| Resultado e campos de resultado | POST /laboratorio/pedidos/{id}/resultado | ResultadoExameController |
| Liberação de resultado | POST /laboratorio/resultados/{id}/liberar | ResultadoExameController::liberar |
| Laudo em PDF com protocolo único | GET /laboratorio/resultados/{id}/pdf | LaudoPdfService |
| Consulta pública por protocolo | POST /consulta-exame | ConsultaPublicaController (throttle 10/min) |
| Download PDF público | POST /consulta-exame/pdf/{protocolo} | ConsultaPublicaController |
| Cadastro de médicos solicitantes | CRUD /laboratorio/medicos | MedicoSolicitanteController |
| Agenda de coleta | GET /laboratorio/agenda | AgendaColetaController |
| Configuração do laboratório | CRUD /laboratorio/config | LabConfigController |

---

## 3. FILA DE ATENDIMENTO

**Evidências:** `AttendanceController.php`, migrations `create_attendance_tickets_table`, `Attendance/AttendanceTicketService.php`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Emissão de senha com número sequencial diário | POST /attendance/tickets | AttendanceTicketService |
| Fila em tempo real (ordenada por prioridade) | GET /attendance/queue | AttendanceQueueService |
| Chamar próximo cliente | POST /attendance/queue/call-next | AttendanceController |
| Painel público TV (sem auth) | GET /attendance/panel/state | AttendancePanelService |
| Iniciar / finalizar atendimento | POST /attendance/service/{id}/start,finish | AttendanceServiceFlowService |
| Cancelar senha / não compareceu | PATCH tickets/{id}/cancel, /no-show | AttendanceController |
| CRUD de salas de atendimento | GET /attendance/rooms-admin | AttendanceController |

---

## 4. FARMÁCIA / TRANSPARÊNCIA PÚBLICA

**Evidências:** `MedicineItemController.php`, `MedicineTransparencyPublicController.php`, seeders `Remume2025MedicinesSeeder`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Cadastro de medicamentos | CRUD /pharmacy/medicines | MedicineItemController |
| Status de disponibilidade diária | CRUD /pharmacy/medicines/daily-statuses | MedicineDailyStatusController |
| Aquisições mensais (Lei 2488) | CRUD /pharmacy/medicines/monthly-acquisitions | MedicineMonthlyAcquisitionController |
| Painel público de disponibilidade | GET /public/pharmacy/medicines/panel | MedicineTransparencyPublicController |
| Aquisições mensais públicas | GET /public/pharmacy/medicines/monthly-acquisitions | MedicineTransparencyPublicController |
| Catálogos auxiliares | GET /pharmacy/catalogs | PharmacyCatalogController |

---

## 5. VIGILÂNCIA SANITÁRIA

**Evidências:** `EstabelecimentoController.php`, `AlvaraController.php`, `AlvaraPdfService.php`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Cadastro de estabelecimentos | CRUD /estabelecimentos | EstabelecimentoController |
| Emissão de alvarás sanitários | CRUD /alvaras | AlvaraController |
| Download do alvará em PDF | GET /alvaras/{id}/pdf | AlvaraPdfService |
| Controle de status e nível de risco | campos status, nivel_risco | Alvara model |

---

## 6. TFD — TRANSPORTE FRETADO DELEGADO

**Evidências:** `TripController.php`, `VehicleController.php`, `RouteController.php`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Cadastro de viagens com pacientes | CRUD /trips + /trip-clients | TripController |
| Confirmação de presença | PATCH /confirm-trip-client/{id} | TripController |
| Cadastro de veículos e rotas | CRUD /vehicles, /routes | VehicleController, RouteController |
| Dashboard TFD | GET /dashboard/tfd | DashboardController |

---

## 7. DOCUMENTOS COM IA

**Evidências:** `LetterController.php`, `OrdinanceController.php`, `config/openai.php`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Criar ofício manualmente ou com IA | POST /letters, /letters/newLetter | LetterController |
| Criar portaria manualmente ou com IA | POST /ordinances, /ordinances/newOrdinance | OrdinanceController |
| Numeração anual automática | campo number_anual | LetterController |
| Anexos com upload e download | POST/GET /letters/{id}/attachments | LetterAttachmentController |

---

## 8. MONITOR APS

**Evidências:** `MonitorApsController.php`, `MonitorApsConfigController.php`

| Funcionalidade | Rota | Evidência |
|----------------|------|-----------|
| Indicadores de vínculo territorial | GET /monitor-aps/indicadores/vinculo | MonitorApsController |
| Indicadores de qualidade (15) | GET /monitor-aps/indicadores/qualidade | MonitorApsController |
| Indicadores de repasse federal | GET /monitor-aps/indicadores/repasse | MonitorApsController |
| Configuração da conexão eSUS PEC | POST /monitor-aps/config/save (admin) | MonitorApsConfigController |

---

## 9. DASHBOARDS ANALÍTICOS

**Evidências:** `DashboardController.php`, `DashboardService.php`

| Dashboard | Rota | Métricas principais |
|-----------|------|---------------------|
| Início | GET /dashboard/inicio | Clientes, especialidades, ofícios, portarias |
| Laboratório | GET /dashboard/laboratorio | Pedidos por status/mês, top exames, top médicos |
| TFD | GET /dashboard/tfd | Viagens, pessoas, km, top motoristas/rotas |
| Farmácia | GET /dashboard/farmacia | Disponibilidade, aquisições, top indisponíveis |
| Vigilância | GET /dashboard/vigilancia | Alvarás vigentes/vencidos/a vencer |
| Logs | GET /dashboard/logs | Acessos QR e links públicos por dia/mês |

---

## 10. AUDITORIA COMPLETA

**Evidências:** `AuditService.php`, `LogUserAction.php` middleware, `AuditLogController.php`

| Funcionalidade | Evidência |
|----------------|-----------|
| Registro automático de todas as requisições autenticadas | LogUserAction middleware |
| Registro de CREATE/UPDATE/DELETE em 15 controllers | AuditService::record() |
| Sanitização de dados sensíveis | AuditService::sanitize() |
| Consulta de logs filtrados | AuditLogController |

---

## INTEGRAÇÕES EXTERNAS

| Integração | Finalidade | Evidência |
|------------|------------|-----------|
| OpenAI (GPT) | Geração de ofícios e portarias | config/openai.php, LetterController, OrdinanceController |
| eSUS PEC (PostgreSQL read-only) | Indicadores APS | MonitorApsBaseController, APS_DB_* env vars |
| DomPDF | Laudos, alvarás, manuais PDF | barryvdh/laravel-dompdf em composer.json |

---

## FUNCIONALIDADES PÚBLICAS (sem autenticação)

| Funcionalidade | Rota | Throttle |
|----------------|------|---------|
| Consulta de exame por protocolo | POST /consulta-exame | 10 req/min |
| Download PDF de exame público | POST /consulta-exame/pdf/{protocolo} | 10 req/min |
| Painel de farmácia público | GET /public/pharmacy/medicines/panel | — |
| Aquisições mensais (Lei 2488) | GET /public/pharmacy/medicines/monthly-acquisitions | — |
| Painel TV de atendimento | GET /attendance/panel/state | — |
| Fila pública (legacy) | GET /showPublicQueue | — |
| Log de localização QR (legacy) | POST /public-queue-log | — |

---

## RESUMO DE VOLUMES

- **Controllers:** 54 arquivos
- **Models:** 55 modelos / tabelas
- **Services:** 22 arquivos
- **Middleware:** 10 arquivos
- **Rotas API:** ~120 rotas
- **Rotas Web:** 3
