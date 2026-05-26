/**
 * Catalogo estatico de navegacao.
 * Nao contem regras de autorizacao - o filtro por perfil acontece em Sidebar.js
 * usando myPermissions carregado do banco via AuthContext.
 */

export const DashboardItem = { title: "Dashboard", icon: "pie-chart", href: "/dashboard" };

const Menuitems = [
  {
    title: "Administracao",
    icon: "shield",
    group: true,
    children: [
      { title: "Usuarios", icon: "user", href: "/users" },
      { title: "Perfis de Acesso", icon: "shield", href: "/perfis" },
      { title: "Paginas do Sistema", icon: "layout", href: "/paginas-sistema" },
      { title: "Categorias de Paginas", icon: "tag", href: "/paginas-categorias" },
    ],
  },
  {
    title: "Cadastros",
    icon: "users",
    group: true,
    children: [
      { title: "Clientes", icon: "users", href: "/clients" },
      { title: "Cliente Report", icon: "bar-chart-2", href: "/client_report" },
      { title: "Especialidades", icon: "award", href: "/specialities" },
    ],
  },
  {
    title: "Laboratorio",
    icon: "thermometer",
    group: true,
    children: [
      { title: "Exames", icon: "thermometer", href: "/laboratorio/exames" },
      { title: "Pedidos", icon: "clipboard", href: "/laboratorio/pedidos" },
      { title: "Categorias", icon: "tag", href: "/laboratorio/categorias" },
      { title: "Medicos", icon: "user-check", href: "/laboratorio/medicos" },
      { title: "Agenda", icon: "calendar", href: "/laboratorio/agenda" },
      { title: "Configuracoes", icon: "settings", href: "/laboratorio/configuracoes", profile: ["admin"] },
    ],
  },
  {
    title: "TFD",
    icon: "send",
    group: true,
    children: [
      { title: "Veiculos", icon: "truck", href: "/vehicles" },
      { title: "Rotas", icon: "map", href: "/routes" },
      { title: "Viagens", icon: "map-pin", href: "/trips" },
    ],
  },
  {
    title: "Atendimento",
    icon: "activity",
    group: true,
    children: [
      { title: "Emissao de Senha", icon: "hash", href: "/attendance/tickets" },
      { title: "Fila do Atendente", icon: "list", href: "/attendance/queue" },
      { title: "Atendimento Atual", icon: "user-check", href: "/attendance/service" },
      { title: "Atendimentos Realizados", icon: "check-square", href: "/attendance/history" },
      { title: "Salas de Atendimento", icon: "home", href: "/attendance/rooms" },
      { title: "Painel Publico", icon: "monitor", href: "/attendance/panel" },
      { title: "Fila", icon: "layers", href: "/queue" },
    ],
  },
  {
    title: "Documentos",
    icon: "file-text",
    group: true,
    children: [
      { title: "Oficios", icon: "send", href: "/letters" },
      { title: "Portarias", icon: "file-text", href: "/ordinance" },
      { title: "Modelos IA", icon: "cpu", href: "/models" },
    ],
  },
  {
    title: "Vigilancia Sanitaria",
    icon: "shield",
    group: true,
    children: [
      { title: "Estabelecimentos", icon: "home", href: "/estabelecimentos" },
      { title: "Alvaras", icon: "award", href: "/alvaras" },
      { title: "Configuracoes", icon: "settings", href: "/vigilancia/configuracoes", profile: ["admin"] },
    ],
  },
  {
    title: "Farmacia Basica",
    icon: "package",
    group: true,
    children: [
      { title: "Medicamentos", icon: "archive", href: "/pharmacy/medicines" },
      { title: "Status Diario", icon: "calendar", href: "/pharmacy/daily-status" },
      { title: "Importar Estoque", icon: "upload", href: "/pharmacy/stock-import" },
      { title: "Aquisicoes Mensais", icon: "bar-chart-2", href: "/pharmacy/monthly-acquisitions" },
      { title: "Config. Painel", icon: "sliders", href: "/pharmacy/panel-settings" },
      { title: "Conformidade", icon: "check-square", href: "/pharmacy/compliance" },
    ],
  },
  {
    title: "Monitor APS",
    icon: "activity",
    group: true,
    children: [
      { title: "Dashboard",            icon: "bar-chart-2",  href: "/monitor-aps" },
      { title: "Vinculo Territorial",  icon: "map-pin",      href: "/monitor-aps/vinculo" },
      { title: "Indicadores",          icon: "check-circle", href: "/monitor-aps/qualidade" },
      { title: "Por Equipe",           icon: "users",        href: "/monitor-aps/equipe" },
      { title: "Visitas ACS/TACS",     icon: "home",         href: "/monitor-aps/visitas" },
      { title: "Mapa de Visitas",      icon: "map",          href: "/monitor-aps/visitas/mapa" },
      { title: "Evolução Anual",       icon: "trending-up",  href: "/monitor-aps/visitas/evolucao" },
      { title: "Cidadãos",             icon: "users",        href: "/monitor-aps/cidadaos" },
      { title: "Configuracoes APS",    icon: "settings",     href: "/monitor-aps/configuracoes", profile: ["admin"] },
    ],
  },
  {
    title: "Sistema",
    icon: "settings",
    group: true,
    children: [
      { title: "Auditoria", icon: "eye", href: "/auditoria" },
      { title: "Logs de Erro", icon: "alert-triangle", href: "/errorlogs" },
      { title: "Logs de QRCODE", icon: "maximize", href: "/qrcodelogs" },
    ],
  },
];

export default Menuitems;
