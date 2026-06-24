/**
 * Cat�logo est�tico de navega��o.
 * N�o cont�m regras de autoriza��o - o filtro por perfil acontece em Sidebar.js
 * usando myPermissions carregado do banco via AuthContext.
 */

export const DashboardItem = { title: "Dashboard", icon: "pie-chart", href: "/dashboard" };

const Menuitems = [
  {
    title: "Administra��o",
    icon: "shield",
    group: true,
    children: [
      { title: "Usu�rios", icon: "user", href: "/users" },
      { title: "Perfis de Acesso", icon: "shield", href: "/perfis" },
      { title: "P�ginas do Sistema", icon: "layout", href: "/paginas-sistema" },
      { title: "Categorias de P�ginas", icon: "tag", href: "/paginas-categorias" },
      { title: "Backup do Banco", icon: "database", href: "/backup" },
      { title: "Modelos IA", icon: "cpu", href: "/models" },
      { title: "Auditoria", icon: "eye", href: "/auditoria" },
      { title: "Logs de Erro", icon: "alert-triangle", href: "/errorlogs" },
      { title: "Logs de QRCODE", icon: "maximize", href: "/qrcodelogs" },
      { title: "Avisos", icon: "bell", href: "/avisos" },
      { title: "Status dos Pain�is", icon: "monitor", href: "/painel-esus/statuses" },
    ],
  },
  {
    title: "Cadastros",
    icon: "users",
    group: true,
    children: [
      { title: "Cidad�os", icon: "users", href: "/clients" },
      { title: "Especialidades", icon: "award", href: "/specialities" },
    ],
  },
  {
    title: "Relat�rios",
    icon: "bar-chart-2",
    group: true,
    children: [
      { title: "Cliente Report", icon: "bar-chart-2", href: "/client_report" },
    ],
  },
  {
    title: "Laborat�rio",
    icon: "thermometer",
    group: true,
    children: [
      { title: "Exames", icon: "thermometer", href: "/laboratorio/exames" },
      { title: "Pedidos", icon: "clipboard", href: "/laboratorio/pedidos" },
      { title: "Categorias", icon: "tag", href: "/laboratorio/categorias" },
      { title: "M�dicos", icon: "user-check", href: "/laboratorio/medicos" },
      { title: "Agenda", icon: "calendar", href: "/laboratorio/agenda" },
      { title: "Configura��es", icon: "settings", href: "/laboratorio/configuracoes", profile: ["admin"] },
    ],
  },
  {
    title: "TFD",
    icon: "send",
    group: true,
    children: [
      { title: "Ve�culos", icon: "truck", href: "/vehicles" },
      { title: "Rotas", icon: "map", href: "/routes" },
      { title: "Viagens", icon: "map-pin", href: "/trips" },
    ],
  },
  {
    title: "Atendimento",
    icon: "activity",
    group: true,
    children: [
      { title: "Emiss�o de Senha", icon: "hash", href: "/attendance/tickets" },
      { title: "Fila do Atendente", icon: "list", href: "/attendance/queue" },
      { title: "Atendimento Atual", icon: "user-check", href: "/attendance/service" },
      { title: "Atendimentos Realizados", icon: "check-square", href: "/attendance/history" },
      { title: "Salas de Atendimento", icon: "home", href: "/attendance/rooms" },
      { title: "Painel P�blico", icon: "monitor", href: "/attendance/panel" },
      { title: "Fila", icon: "layers", href: "/queue" },
    ],
  },
  {
    title: "Documentos",
    icon: "file-text",
    group: true,
    children: [
      { title: "Of�cios", icon: "send", href: "/letters" },
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
      { title: "Configura��es", icon: "settings", href: "/protocolo/configuracoes", profile: ["admin"] },
      { title: "Tipos de Protocolo", icon: "list", href: "/protocolo/tipos" },
    ],
  },
  {
    title: "Sistema",
    icon: "settings",
    group: true,
    children: [
      { title: "Alertas", icon: "bell", href: "/sistema/alertas" },
      { title: "Configura��es WhatsApp", icon: "message-circle", href: "/configuracoes/whatsapp", profile: ["admin"] },
      { title: "Configura��es E-mail", icon: "mail", href: "/configuracoes/email", profile: ["admin"] },
    ],
  },
  {
    title: "Vigil�ncia Sanit�ria",
    icon: "shield",
    group: true,
    children: [
      { title: "Estabelecimentos", icon: "home", href: "/estabelecimentos" },
      { title: "Alvar�s", icon: "award", href: "/alvaras" },
      { title: "Configura��es", icon: "settings", href: "/vigilancia/configuracoes", profile: ["admin"] },
    ],
  },
  {
    title: "Farm�cia B�sica",
    icon: "package",
    group: true,
    children: [
      { title: "Consulta de Medicamentos", icon: "search", href: "/pharmacy/consulta-medicamentos" },
      { title: "Medicamentos", icon: "archive", href: "/pharmacy/medicines" },
      { title: "Status Di�rio", icon: "calendar", href: "/pharmacy/daily-status" },
      { title: "Importar Estoque", icon: "upload", href: "/pharmacy/stock-import" },
      { title: "Aquisi��es Mensais", icon: "bar-chart-2", href: "/pharmacy/monthly-acquisitions" },
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
      { title: "V�nculo Territorial", icon: "map-pin", href: "/monitor-aps/vinculo" },
      { title: "Indicadores", icon: "check-circle", href: "/monitor-aps/qualidade" },
      { title: "Por Equipe", icon: "users", href: "/monitor-aps/equipe" },
      { title: "Visitas ACS/TACS", icon: "home", href: "/monitor-aps/visitas" },
      { title: "Mapa de Visitas", icon: "map", href: "/monitor-aps/visitas/mapa" },
      { title: "Evolu��o Anual", icon: "trending-up", href: "/monitor-aps/visitas/evolucao" },
      { title: "Cidad�os", icon: "users", href: "/monitor-aps/cidadaos" },
      { title: "Configura��es APS", icon: "settings", href: "/monitor-aps/configuracoes", profile: ["admin"] },
    ],
  },
];

export default Menuitems;
