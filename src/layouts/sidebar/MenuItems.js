const Menuitems = [
  {
    title: "Dashbaord",
    icon: "home",
    href: "/",
    profile: ["admin", "tfd", "manager", "user", "partner", "driver"],
  },
  {
    title: "Usuarios",
    icon: "users",
    href: "/users",
    // profile: "admin",
    profile: ["admin"],
  },
  {
    title: "Clientes",
    icon: "users",
    href: "/clients",
    profile: ["admin","user", "tfd", "manager", "partner"],
  },
  {
    title: "Especialidades",
    icon: "users",
    href: "/specialities",
    profile: ["admin"],
  },
  {
    title: "Fila",
    icon: "users",
    href: "/queue",
    profile: ["admin","user", "tfd"],
  },
  {
    title: "Veículos",
    icon: "users",
    href: "/vehicles",
    profile: ["admin", "tfd"],
  },
  {
    title: "Rotas",
    icon: "users",
    href: "/routes",
    profile: ["admin", "tfd"],
  },
  {
    title: "Viagens",
    icon: "users",
    href: "/trips",
    profile: ["admin", "tfd", "driver"],
  },
  {
    title: "Oficios",
    icon: "send",
    href: "/letters",
    profile: ["admin", "manager", "tfd"],
  },
  {
    title: "Modelos IA",
    icon: "list",
    href: "/models",
    profile: ["admin"],
  },
  {
    title: "Serviços",
    icon: "list",
    href: "/service_calls",
    profile: ["admin"],
  },
  {
    title: "Salas",
    icon: "list",
    href: "/rooms",
    profile: ["admin"],
  },
  {
    title: "Minha Sala",
    icon: "list",
    href: "/listing_calls",
    profile: ["admin"],
  },

  {
    title: "Em Atendimento",
    icon: "list",
    href: "/attending",
    profile: ["admin"],
  },
  {
    title: "Novo Atendimento",
    icon: "list",
    href: "/call",
    profile: ["admin"],
  },
  {
    title: "Painel",
    icon: "list",
    href: "/panel",
    profile: ["admin"],
  },
  {
    title: "Logs",
    icon: "list",
    href: "/logs",
    profile: ["admin"],
  },
  {
    title: "Logs de Erro",
    icon: "list",
    href: "/errorlogs",
    profile: ["admin"],
  },
  {
    title: "Logs de QRCODE",
    icon: "list",
    href: "/qrcodelogs",
    profile: ["admin"],
  }
];

export default Menuitems;
