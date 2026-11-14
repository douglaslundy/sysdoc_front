import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { normalizeIconName, resolveIconForPath } from "../../utils/iconResolver";
import { DashboardItem } from "./MenuItems";

const CATEGORY_ICONS = {
  Administracao: "shield",
  Cadastros: "users",
  Laboratorio: "thermometer",
  TFD: "send",
  Atendimento: "activity",
  Documentos: "file-text",
  "Vigilancia Sanitaria": "shield",
  Farmacia: "package",
  "Farmacia Basica": "package",
  Sistema: "settings",
  Geral: "grid",
  Relatorios: "bar-chart-2",
  Outros: "grid",
};

const normalizeCategory = (value) => {
  if (!value) return "Outros";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Páginas cuja API é só do administrador: não aparecem no menu de outro perfil, mesmo liberadas.
export const ADMIN_ONLY_PATHS = ["/sistema/mensagens-enviadas"];

const normalizePath = (value) => String(value || "").split("?")[0].replace(/\/+$/, "");

export const hasPermissionForPath = (allowedPaths, targetPath) => {
  const normalizedTarget = normalizePath(targetPath);
  return (Array.isArray(allowedPaths) ? allowedPaths : []).some((allowed) => {
    const normalizedAllowed = normalizePath(allowed);
    return (
      normalizedAllowed === normalizedTarget ||
      normalizedTarget.startsWith(`${normalizedAllowed}/`)
    );
  });
};

/**
 * Menu lateral montado a partir das páginas autorizadas do usuário (regras de permissão inalteradas).
 * Devolve os grupos já filtrados e se o Dashboard aparece.
 */
export function useMenuGroups() {
  const { profile, myPermissions, authorizedPages, permissionsLoaded } = useContext(AuthContext);
  const [adminCategories, setAdminCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    if (!permissionsLoaded || profile !== "admin") {
      setAdminCategories([]);
      return undefined;
    }

    api.get("/page-categories")
      .then((res) => {
        if (isMounted) {
          setAdminCategories(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAdminCategories([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile, permissionsLoaded]);

  const resolveCategory = (pg) => {
    const category = pg?.category || null;
    const title = category?.nome || pg?.categoria || "Outros";
    const normalizedTitle = normalizeCategory(title);
    const fallbackOrder = category?.ordem ?? null;
    const mappedOrder = categoryOrderByName.get(normalizedTitle);
    return {
      title,
      icon: category?.icone,
      order: Number.isFinite(Number(mappedOrder))
        ? Number(mappedOrder)
        : (Number.isFinite(Number(fallbackOrder)) ? Number(fallbackOrder) : 999),
    };
  };

  const categoryOrderByName = useMemo(() => {
    const map = new Map();

    const sourceCategories = profile === "admin" && Array.isArray(adminCategories) && adminCategories.length > 0
      ? adminCategories
      : [];

    sourceCategories.forEach((category) => {
      const title = normalizeCategory(category?.nome || "Outros");
      const order = Number(category?.ordem);

      if (!Number.isFinite(order)) return;

      const current = map.get(title);
      if (current == null || order < current) {
        map.set(title, order);
      }
    });

    (Array.isArray(authorizedPages) ? authorizedPages : []).forEach((pg) => {
      const category = pg?.category || null;
      const title = normalizeCategory(category?.nome || pg?.categoria || "Outros");
      const order = Number(category?.ordem);

      if (!Number.isFinite(order)) return;

      const current = map.get(title);
      if (current == null || order < current) {
        map.set(title, order);
      }
    });

    return map;
  }, [adminCategories, authorizedPages, profile]);

  const dynamicMenu = useMemo(() => {
    const pages = Array.isArray(authorizedPages) ? authorizedPages : [];

    const visiblePages = pages.filter((pg) => {
      if (!pg?.ativo) return false;
      if (pg.path === DashboardItem.href) return false;
      // O cadastro de protocolo é o modal da Caixa de Entrada; a rota /protocolo/novo segue válida, mas sem item de menu.
      if (pg.path === '/protocolo/novo') return false;
      if (resolveCategory(pg).title === 'Dashboard') return false;
      if (profile === "admin") return true;
      if (ADMIN_ONLY_PATHS.includes(normalizePath(pg.path))) return false;
      return hasPermissionForPath(myPermissions, pg.path);
    });

    if (visiblePages.length === 0) return [];

    const grouped = visiblePages.reduce((acc, pg) => {
      const category = resolveCategory(pg);
      if (!acc[category.title]) {
        acc[category.title] = { children: [], icon: category.icon, order: category.order };
      }
      if (!acc[category.title].icon && category.icon) acc[category.title].icon = category.icon;
      acc[category.title].children.push({
        title: pg.titulo,
        icon: resolveIconForPath(pg.path, pg.icone, "circle"),
        href: pg.path,
        order: Number(pg.ordem ?? 999),
      });
      return acc;
    }, {});

    const groups = Object.entries(grouped)
      .map(([category, groupData]) => {
        const normalized = normalizeCategory(category);
        return {
          title: category,
          icon: normalizeIconName(groupData.icon, CATEGORY_ICONS[normalized] || groupData.children[0]?.icon || "grid"),
          order: groupData.order ?? 999,
          group: true,
          children: groupData.children.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title)),
        };
      })
      .sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));

    return groups.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
  }, [authorizedPages, profile, myPermissions]);


  // Grupos sem nenhum filho permitido não aparecem.
  const groups = useMemo(
    () =>
      dynamicMenu
        .map((group) => ({
          ...group,
          children: group.children.filter((child) => child.public || profile === "admin" || hasPermissionForPath(myPermissions, child.href)),
        }))
        .filter((group) => group.children.length > 0),
    [dynamicMenu, profile, myPermissions],
  );

  const isDashboardVisible = profile === "admin" || myPermissions.includes(DashboardItem.href);

  return { groups, isDashboardVisible };
}
