/**
 * Catálogo estático de navegação.
 * Não contém regras de autorização - o filtro por perfil acontece em Sidebar.js
 * usando myPermissions carregado do banco via AuthContext.
 */

export const DashboardItem = { title: "Dashboard", icon: "pie-chart", href: "/dashboard" };

const Menuitems = [
  {
    title: "Administração",
    icon: "shield",
    group: true,
    children: [
      { title: "Usuários", icon: "user", href: "/users" },
      { title: "Perfis de Acesso", icon: "shield", href: "/perfis" },
      { title: "Páginas do Sistema", icon: "layout", href: "/paginas-sistema" },
      { title: "Categorias de Páginas", icon: "tag", href: "/paginas-categorias" },
      { title: "Backup do Banco", icon: "database", href: "/backup" },
      { title: "Modelos IA", icon: "cpu", href: "/models" },
      { title: "Auditoria", icon: "eye", href: "/auditoria" },
      { title: "Logs de Erro", icon: "alert-triangle", href: "/errorlogs" },
      { title: "Logs de QRCODE", icon: "maximize", href: "/qrcodelogs" },
      { title: "Avisos", icon: "bell", href: "/avisos" },
      { title: "Status dos Painéis", icon: "monitor", href: "/painel-esus/statuses" },
    ],
  },
  {
    title: "Cadastros",
    icon: "users",
    group: true,
    children: [
      { title: "Cidadãos", icon: "users", href: "/clients" },
      { title: "Especialidades", icon: "award", href: "/specialities" },
    ],
  },
  {
    title: "Relatórios",
    icon: "bar-chart-2",
    group: true,
    children: [
      { title: "Cliente Report", icon: "bar-chart-2", href: "/client_report" },
    ],
  },
  {
    title: "Laboratório",
    icon: "thermometer",
    group: true,
    children: [
      { title: "Exames", icon: "thermometer", href: "/laboratorio/exames" },
      { title: "Pedidos", icon: "clipboard", href: "/laboratorio/pedidos" },
      { title: "Categorias", icon: "tag", href: "/laboratorio/categorias" },
      { title: "Médicos", icon: "user-check", href: "/laboratorio/medicos" },
      { title: "Agenda", icon: "calendar", href: "/laboratorio/agenda" },
      { title: "Configurações", icon: "settings", href: "/laboratorio/configuracoes", profile: ["admin"] },
    ],
  },
  {
    title: "TFD",
    icon: "send",
    group: true,
    children: [
      { title: "Veículos", icon: "truck", href: "/vehicles" },
      { title: "Rotas", icon: "map", href: "/routes" },
      { title: "Viagens", icon: "map-pin", href: "/trips" },
    ],
  },
  {
    title: "Atendimento",
    icon: "activity",
    group: true,
    children: [
      { title: "Emissão de Senha", icon: "hash", href: "/attendance/tickets" },
      { title: "Fila do Atendente", icon: "list", href: "/attendance/queue" },
      { title: "Atendimento Atual", icon: "user-check", href: "/attendance/service" },
      { title: "Atendimentos Realizados", icon: "check-square", href: "/attendance/history" },
      { title: "Salas de Atendimento", icon: "home", href: "/attendance/rooms" },
      { title: "Painel Público", icon: "monitor", href: "/attendance/panel" },
      { title: "Fila", icon: "layers", href: "/queue" },
    ],
  },
  {
    title: "Documentos",
    icon: "file-text",
    group: true,
    children: [
      { title: "Documentos", icon: "file-text", href: "/documentos" },
      { title: "Tipos de Documentos", icon: "list", href: "/documentos/tipos" },
      { title: "Aprovações", icon: "check-circle", href: "/documentos/aprovacoes" },
      { title: "Configurações", icon: "settings", href: "/documentos/configuracoes", profile: ["admin"] },
      { title: "Ofícios", icon: "send", href: "/letters" },
      { title: "Portarias", icon: "file-text", href: "/ordinance" },
    ],
  },
  {
    title: "Protocolo",
    icon: "inbox",
    group: true,
    children: [
      { title: "Protocolo", icon: "inbox", href: "/protocolo" },
      { title: "Caixa de Entrada", icon: "mail", href: "/protocolo/caixa-entrada" },
      { title: "Novo Protocolo", icon: "plus-circle", href: "/protocolo/novo" },
      { title: "Estrutura Organizacional", icon: "layers", href: "/protocolo/estrutura" },
      { title: "Configurações", icon: "settings", href: "/protocolo/configuracoes", profile: ["admin"] },
      { title: "Tipos de Protocolo", icon: "list", href: "/protocolo/tipos" },
    ],
  },
  {
    title: "Kanban",
    icon: "columns",
    group: true,
    children: [
      { title: "Kanban Geral", icon: "columns", href: "/kanban" },
    ],
  },
  {
    title: "Sistema",
    icon: "settings",
    group: true,
    children: [
      { title: "Alertas", icon: "bell", href: "/sistema/alertas" },
      { title: "Configurações WhatsApp", icon: "message-circle", href: "/configuracoes/whatsapp", profile: ["admin"] },
      { title: "Configurações E-mail", icon: "mail", href: "/configuracoes/email", profile: ["admin"] },
    ],
  },
  {
    title: "Vigilância Sanitária",
    icon: "shield",
    group: true,
    children: [
      { title: "Estabelecimentos", icon: "home", href: "/estabelecimentos" },
      { title: "Alvarás", icon: "award", href: "/alvaras" },
      { title: "Fiscalizações", icon: "clipboard", href: "/fiscalizacoes" },
      { title: "Configurações", icon: "settings", href: "/vigilancia/configuracoes", profile: ["admin"] },
    ],
  },
  {
    title: "Farmácia Básica",
    icon: "package",
    group: true,
    children: [
      { title: "Consulta de Medicamentos", icon: "search", href: "/pharmacy/consulta-medicamentos" },
      { title: "Medicamentos", icon: "archive", href: "/pharmacy/medicines" },
      { title: "Status Diário", icon: "calendar", href: "/pharmacy/daily-status" },
      { title: "Importar Estoque", icon: "upload", href: "/pharmacy/stock-import" },
      { title: "Aquisições Mensais", icon: "bar-chart-2", href: "/pharmacy/monthly-acquisitions" },
      { title: "Config. Painel", icon: "sliders", href: "/pharmacy/panel-settings" },
      { title: "Conformidade", icon: "check-square", href: "/pharmacy/compliance" },
    ],
  },
  {
    title: "Monitor APS",
    icon: "activity",
    group: true,
    children: [
      { title: "Painel APS", icon: "bar-chart-2", href: "/monitor-aps" },
      { title: "Vínculo Territorial", icon: "map-pin", href: "/monitor-aps/vinculo" },
      { title: "Indicadores", icon: "check-circle", href: "/monitor-aps/qualidade" },
      { title: "Por Equipe", icon: "users", href: "/monitor-aps/equipe" },
      { title: "Visitas ACS/TACS", icon: "home", href: "/monitor-aps/visitas" },
      { title: "Mapa de Visitas", icon: "map", href: "/monitor-aps/visitas/mapa" },
      { title: "Evolução Anual", icon: "trending-up", href: "/monitor-aps/visitas/evolucao" },
      { title: "Cidadãos", icon: "users", href: "/monitor-aps/cidadaos" },
      { title: "Configurações APS", icon: "settings", href: "/monitor-aps/configuracoes", profile: ["admin"] },
    ],
  },
];

export default Menuitems;
