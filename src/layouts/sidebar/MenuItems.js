/**
 * Catálogo estático de navegação.
 * Não contém regras de autorização — o filtro por perfil acontece em Sidebar.js
 * usando myPermissions carregado do banco via AuthContext.
 *
 * public: true  →  visível para qualquer usuário autenticado (sem checar permissão)
 * (ausente)     →  filtrado pelo array myPermissions do banco
 */

// Botão fixo exibido acima de todos grupos — sem dropdown
export const DashboardItem = { title: "Dashboard", icon: "pie-chart", href: "/dashboard" };

const Menuitems = [
  {
    title: "Administração",
    icon: "shield",
    group: true,
    children: [
      { title: "Usuários",           icon: "user",   href: "/users" },
      { title: "Perfis de Acesso",   icon: "shield", href: "/perfis" },
      { title: "Páginas do Sistema", icon: "layout", href: "/paginas-sistema" },
    ],
  },
  {
    title: "Cadastros",
    icon: "users",
    group: true,
    children: [
      { title: "Clientes",       icon: "users",       href: "/clients" },
      { title: "Cliente Report", icon: "bar-chart-2", href: "/client_report" },
      { title: "Especialidades", icon: "award",       href: "/specialities" },
    ],
  },
  {
    title: "Laboratório",
    icon: "thermometer",
    group: true,
    children: [
      { title: "Exames",     icon: "thermometer", href: "/laboratorio/exames" },
      { title: "Pedidos",    icon: "clipboard",   href: "/laboratorio/pedidos" },
      { title: "Categorias", icon: "tag",         href: "/laboratorio/categorias" },
      { title: "Médicos",    icon: "user-check",  href: "/laboratorio/medicos" },
      { title: "Agenda",     icon: "calendar",    href: "/laboratorio/agenda" },
    ],
  },
  {
    title: "TFD",
    icon: "send",
    group: true,
    children: [
      { title: "Veículos", icon: "truck",   href: "/vehicles" },
      { title: "Rotas",    icon: "map",     href: "/routes" },
      { title: "Viagens",  icon: "map-pin", href: "/trips" },
    ],
  },
  {
    title: "Atendimento",
    icon: "activity",
    group: true,
    children: [
      { title: "Fila",             icon: "layers",      href: "/queue" },
      { title: "Salas",            icon: "grid",        href: "/rooms" },
      { title: "Minha Sala",       icon: "monitor",     href: "/listing_calls" },
      { title: "Em Atendimento",   icon: "activity",    href: "/attending" },
      { title: "Novo Atendimento", icon: "plus-circle", href: "/call" },
      { title: "Painel",           icon: "layout",      href: "/panel" },
      { title: "Serviços",         icon: "tool",        href: "/service_calls" },
    ],
  },
  {
    title: "Documentos",
    icon: "file-text",
    group: true,
    children: [
      { title: "Ofícios",    icon: "send",      href: "/letters" },
      { title: "Portarias",  icon: "file-text", href: "/ordinance" },
      { title: "Modelos IA", icon: "cpu",       href: "/models" },
    ],
  },
  {
    title: "Sistema",
    icon: "settings",
    group: true,
    children: [
      { title: "Auditoria",      icon: "eye",            href: "/auditoria" },
      { title: "Logs",           icon: "clipboard",      href: "/logs" },
      { title: "Logs de Erro",   icon: "alert-triangle", href: "/errorlogs" },
      { title: "Logs de QRCODE", icon: "maximize",       href: "/qrcodelogs" },
    ],
  },
];

export default Menuitems;
