import Menuitems, { DashboardItem } from "../layouts/sidebar/MenuItems";

const TITLE_OVERRIDES = {
  "/dashboard": "Painel",
  "/monitor-aps": "Painel APS",
  "/attendance/panel": "Painel Público",
  "/transparency/medicines": "Medicamentos em Transparência",
  "/transparency/medicines-panel": "Painel de Medicamentos",
  "/transparency/medicines-monthly-acquisitions": "Aquisições Mensais de Medicamentos",
  "/showqueue": "Consulta de Senha",
  "/showqueue/[...uuid]": "Consulta de Senha",
  "/showqueue/[[...uuid]]": "Consulta de Senha",
  "/painel-esus": "Painel eSUS",
};

const SEGMENT_OVERRIDES = {
  administracao: "Administração",
  atendimento: "Atendimento",
  backup: "Backup",
  categorias: "Categorias",
  cidadaos: "Cidadãos",
  configuracoes: "Configurações",
  consultas: "Consultas",
  dashboard: "Painel",
  documentos: "Documentos",
  evolucao: "Evolução",
  farmacia: "Farmácia",
  exames: "Exames",
  laboratoria: "Laboratória",
  laboratorio: "Laboratório",
  lista: "Lista",
  medicamentos: "Medicamentos",
  medico: "Médico",
  medicos: "Médicos",
  modulos: "Módulos",
  paginas: "Páginas",
  painel: "Painel",
  painelpublico: "Painel Público",
  portarias: "Portarias",
  processos: "Processos",
  programas: "Programas",
  qualidades: "Qualidades",
  sanitario: "Sanitário",
  sanitaria: "Sanitária",
  usuarios: "Usuários",
  veiculos: "Veículos",
  vigilancia: "Vigilância",
};

const titleMap = new Map();

const normalizePath = (pathname) => {
  if (!pathname) return "/";
  return String(pathname).split("?")[0].replace(/\/+$/, "") || "/";
};

const registerMenuItem = (item) => {
  if (!item) return;
  if (item.href && item.title) {
    titleMap.set(item.href, item.title);
  }
  if (Array.isArray(item.children)) {
    item.children.forEach(registerMenuItem);
  }
};

registerMenuItem(DashboardItem);
Menuitems.forEach(registerMenuItem);

const formatSegment = (segment) => {
  const decoded = decodeURIComponent(segment || "");
  const compact = decoded
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!compact) return "";

  const normalizedKey = compact
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");

  if (SEGMENT_OVERRIDES[normalizedKey]) {
    return SEGMENT_OVERRIDES[normalizedKey];
  }

  return compact
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (/^[0-9]+$/.test(word)) return word;
      if (word === word.toUpperCase() && word.length <= 4) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const fallbackTitle = (pathname) => {
  const normalized = normalizePath(pathname);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return "Painel";
  return segments.map(formatSegment).join(" / ");
};

const findMappedTitle = (pathname) => {
  const normalized = normalizePath(pathname);
  if (titleMap.has(normalized)) return titleMap.get(normalized);

  let bestMatch = "";
  titleMap.forEach((title, href) => {
    if (normalized === href || normalized.startsWith(`${href}/`)) {
      if (href.length > bestMatch.length) {
        bestMatch = href;
      }
    }
  });

  return bestMatch ? titleMap.get(bestMatch) : null;
};

export const getPageTitle = (pathname) => {
  const mappedTitle = findMappedTitle(pathname);
  if (mappedTitle) return mappedTitle;

  const override = TITLE_OVERRIDES[normalizePath(pathname)];
  if (override) return override;

  const normalized = normalizePath(pathname);
  if (normalized.startsWith("/showqueue")) return "Consulta de Senha";
  if (normalized.startsWith("/painel-esus")) return "Painel eSUS";

  return fallbackTitle(pathname);
};
