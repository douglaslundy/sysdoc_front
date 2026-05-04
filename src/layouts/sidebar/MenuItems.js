const Menuitems = [
  {
    title: "Geral",
    icon: "home",
    group: true,
    children: [
      { title: "Dashboard",  icon: "home",      href: "/",          profile: ["admin", "tfd", "manager", "user", "partner", "driver"] },
      { title: "Dashboards", icon: "pie-chart",  href: "/dashboards", profile: ["admin", "manager"] },
    ],
  },
  {
    title: "Administração",
    icon: "shield",
    group: true,
    children: [
      { title: "Usuários",           icon: "user",   href: "/users",          profile: ["admin"] },
      { title: "Perfis de Acesso",   icon: "shield", href: "/perfis",         profile: ["admin"] },
      { title: "Páginas do Sistema", icon: "layout", href: "/paginas-sistema", profile: ["admin"] },
    ],
  },
  {
    title: "Cadastros",
    icon: "users",
    group: true,
    children: [
      { title: "Clientes",       icon: "users",     href: "/clients",        profile: ["admin", "user", "tfd", "manager", "partner"] },
      { title: "Cliente Report", icon: "bar-chart-2", href: "/client_report", profile: ["admin", "user", "tfd"] },
      { title: "Especialidades", icon: "award",     href: "/specialities",   profile: ["admin"] },
    ],
  },
  {
    title: "Laboratório",
    icon: "thermometer",
    group: true,
    children: [
      { title: "Exames",     icon: "thermometer", href: "/laboratorio/exames",    profile: ["admin", "manager"] },
      { title: "Pedidos",    icon: "clipboard",   href: "/laboratorio/pedidos",   profile: ["admin", "manager", "user"] },
      { title: "Categorias", icon: "tag",         href: "/laboratorio/categorias", profile: ["admin", "manager"] },
      { title: "Médicos",    icon: "user-check",  href: "/laboratorio/medicos",   profile: ["admin", "manager"] },
      { title: "Agenda",     icon: "calendar",    href: "/laboratorio/agenda",    profile: ["admin", "manager", "user"] },
    ],
  },
  {
    title: "TFD",
    icon: "send",
    group: true,
    children: [
      { title: "Veículos", icon: "truck",   href: "/vehicles", profile: ["admin", "tfd"] },
      { title: "Rotas",    icon: "map",     href: "/routes",   profile: ["admin", "tfd"] },
      { title: "Viagens",  icon: "map-pin", href: "/trips",    profile: ["admin", "tfd", "driver", "manager"] },
    ],
  },
  {
    title: "Atendimento",
    icon: "activity",
    group: true,
    children: [
      { title: "Fila",             icon: "layers",      href: "/queue",         profile: ["admin", "user", "tfd", "manager"] },
      { title: "Salas",            icon: "grid",        href: "/rooms",         profile: ["admin"] },
      { title: "Minha Sala",       icon: "monitor",     href: "/listing_calls", profile: ["admin"] },
      { title: "Em Atendimento",   icon: "activity",    href: "/attending",     profile: ["admin"] },
      { title: "Novo Atendimento", icon: "plus-circle", href: "/call",          profile: ["admin"] },
      { title: "Painel",           icon: "layout",      href: "/panel",         profile: ["admin"] },
    ],
  },
  {
    title: "Documentos",
    icon: "file-text",
    group: true,
    children: [
      { title: "Ofícios",    icon: "send",      href: "/letters",   profile: ["admin", "manager", "tfd"] },
      { title: "Portarias",  icon: "file-text", href: "/ordinance", profile: ["admin", "manager", "tfd"] },
      { title: "Modelos IA", icon: "cpu",       href: "/models",    profile: ["admin"] },
    ],
  },
  {
    title: "Sistema",
    icon: "settings",
    group: true,
    children: [
      { title: "Auditoria",       icon: "eye",           href: "/auditoria",     profile: ["admin"] },
      { title: "Serviços",        icon: "tool",          href: "/service_calls", profile: ["admin"] },
      { title: "Logs",            icon: "clipboard",     href: "/logs",          profile: ["admin"] },
      { title: "Logs de Erro",    icon: "alert-triangle", href: "/errorlogs",    profile: ["admin"] },
      { title: "Logs de QRCODE",  icon: "maximize",      href: "/qrcodelogs",   profile: ["admin"] },
    ],
  },
];

export default Menuitems;
