# Product Discovery

## Nome do produto

**Sysdoc** — Sistema de Gestão Municipal de Saúde

## Descrição curta

Plataforma digital integrada para gestão de saúde pública municipal: laboratório, farmácia, vigilância sanitária, fila de atendimento, TFD, documentos com IA e indicadores APS.

## Problema resolvido

Prefeituras municipais operam múltiplos serviços de saúde (laboratório, farmácia, TFD, vigilância sanitária) sem integração entre eles, sem rastreabilidade das ações e sem dados para tomada de decisão. O Sysdoc centraliza tudo em um único sistema auditado.

## Público-alvo

- Prefeituras municipais de pequeno e médio porte
- Secretarias Municipais de Saúde
- Administradores de saúde pública
- Profissionais de saúde (laboratoristas, farmacêuticos, recepcionistas)
- Motoristas de TFD

## Usuários identificados

| Perfil | Acesso |
|--------|--------|
| admin | Acesso total ao sistema |
| manager | Laboratório + Documentos |
| user | Clientes + Pedidos básicos |
| tfd | Veículos, rotas, viagens |
| driver | Painel + viagens (motorista) |
| partner | Apenas clientes |

## Entidades principais

- **Client** — paciente/cidadão (CNS, CPF, data de nascimento, endereço)
- **PedidoExame** — requisição laboratorial com state machine (solicitado→coletado→em_analise→liberado)
- **ResultadoExame** — resultado com protocolo único e geração de laudo PDF
- **AttendanceTicket** — senha de atendimento com fila em tempo real
- **Alvara** — alvará sanitário com controle de vencimento e PDF
- **MedicineItem** — medicamento com disponibilidade diária e aquisições mensais
- **Trip** — viagem TFD com controle de presença de pacientes
- **Letter / Ordinance** — ofícios e portarias com geração por IA

## Fluxos principais

1. **Laboratório:** Cadastro de exame → Pedido → Coleta → Análise → Resultado → Laudo PDF → Consulta pública por protocolo
2. **Atendimento:** Emissão de senha → Fila em tempo real → Chamada → Atendimento → Finalização
3. **Farmácia:** Cadastro de medicamento → Status diário → Aquisição mensal → Painel público (Lei 2488)
4. **TFD:** Rota → Viagem → Pacientes confirmados → Motorista atribuído
5. **Documentos:** Redigir ofício/portaria → Gerar com IA → Anexos → Numeração automática
6. **Vigilância Sanitária:** Estabelecimento → Alvará → PDF → Controle de vencimento

## Integrações

- **OpenAI** — geração assistida de ofícios e portarias
- **eSUS PEC** — leitura de indicadores APS via banco PostgreSQL (somente leitura)
- **DomPDF** — geração de laudos, alvarás e PDFs em geral

## Stack técnico

- **Backend:** Laravel 10, PHP 8.1+, MySQL
- **Auth:** JWT (tymon/jwt-auth) + Sanctum
- **Frontend:** Next.js 12 (React 17, Redux Toolkit, MUI v5) — repositório separado
- **Hospedagem backend:** dlsistemas.com.br
- **Hospedagem frontend:** Vercel (sysvendas.vercel.app)
- **Municipalidade:** Ilicínea-MG (IBGE 313050)

## Observações

- Sistema em produção e evolução contínua (último deploy: maio 2026)
- Auditoria completa de todas as ações (CREATE/UPDATE/DELETE/VIEW/LOGIN)
- Dois sistemas de fila: legacy (Call/Queue) + novo (AttendanceTicket) — migração em andamento
- Throttling em endpoints públicos (consulta de exames: 10 req/min)
- Transparência pública Lei 2488 implementada na farmácia
- Rota `/` atual: view `welcome` (padrão Laravel — a ser substituída)
