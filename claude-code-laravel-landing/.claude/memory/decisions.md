# Decisions

## Posicionamento do produto

**Produto:** Sysdoc — Sistema de Gestão Municipal de Saúde
**Público-alvo:** Secretarias Municipais de Saúde, Prefeituras de pequeno e médio porte
**Problema central:** Fragmentação dos serviços de saúde municipal sem integração, rastreabilidade ou dados para decisão
**Proposta de valor:** Um único sistema integrado que conecta laboratório, farmácia, vigilância sanitária, TFD, atendimento e documentação, com auditoria completa e indicadores APS em tempo real

---

## Mensagens principais

- "Gestão de saúde municipal integrada, auditada e em tempo real"
- "Do laboratório à farmácia, do TFD à vigilância sanitária — tudo em um só lugar"
- "Transparência pública com conformidade à Lei 2488"
- "Laudos de exame com protocolo único e consulta pública online"
- "Inteligência Artificial para redigir ofícios e portarias"
- "Indicadores APS direto do eSUS PEC, sem exportação manual"

---

## Benefícios centrais

1. Elimina planilhas e sistemas isolados
2. Rastreabilidade completa com auditoria de todas as ações
3. Transparência pública automática (farmácia, exames)
4. Tomada de decisão com dashboards por módulo
5. Conformidade com legislação (Lei 2488, Portaria GM/MS 6.907/2025)
6. Geração de documentos assistida por IA
7. Fila de atendimento com painel TV em tempo real

---

## Diferenciais reais

| Diferencial | Evidência |
|-------------|-----------|
| Auditoria automática de todas as ações | LogUserAction middleware + AuditService |
| Consulta pública de exames por protocolo | ConsultaPublicaController (throttle 10/min) |
| Transparência farmacêutica (Lei 2488) | MedicineTransparencyPublicController |
| Geração de documentos com IA (OpenAI) | LetterController::createLetterAi |
| Indicadores APS do eSUS PEC em tempo real | MonitorApsController (PostgreSQL read-only) |
| State machine de pedidos de laboratório | PedidoExameController::atualizarStatus |
| RBAC granular por perfil e por página | AccessProfile + ProfilePagePermission |

---

## Palavras-chave SEO

- sistema de gestão municipal de saúde
- software para prefeitura de saúde
- gestão de laboratório municipal
- farmácia municipal transparência pública
- vigilância sanitária digital
- TFD transporte fretado delegado sistema
- fila de atendimento municipal
- Monitor APS eSUS indicadores
- gestão de documentos ofícios portarias IA

---

## CTAs definidos

- **Principal:** "Solicitar demonstração"
- **Secundário:** "Conhecer funcionalidades"
- **Manual:** "Baixar manual de uso"

---

## Decisões técnicas de implementação

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-05-20 | Landing page em welcome.blade.php (inline CSS) | Sem dependência de build frontend, compatível com Laravel Mix existente |
| 2026-05-20 | Não criar nova rota `/` — apenas substituir a view | Rota já existe em routes/web.php linha 17, sem necessidade de alterar PHP |
| 2026-05-20 | Manual PDF via DomPDF (barryvdh/laravel-dompdf) | Já instalado no projeto (usado para laudos e alvarás) |
| 2026-05-20 | Manual HTML em public/manual/manual.html | Acessível diretamente sem rota Laravel |
| 2026-05-20 | Paleta de cores: azul institucional (#1e3a5f) + verde saúde (#2d9e6b) | Setor público de saúde, transmite confiança e profissionalismo |

---

## Decisões de copy

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-05-20 | Não mencionar "Jr Ferragens" na landing page | Referência interna ao desenvolvimento — não faz parte do produto |
| 2026-05-20 | Mencionar Ilicínea como case real | É o único município evidenciado no código (IBGE 313050) |
| 2026-05-20 | Usar "Sysdoc" como nome do produto | Nome do repositório e identidade do sistema |
| 2026-05-20 | Não mencionar sistema de fila legacy (Call/Queue) | Está sendo depreciado em favor do Attendance |
