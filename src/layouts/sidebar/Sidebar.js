import React, { useContext, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import PropTypes from "prop-types";
import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import LogoIcon from "../logo/LogoIcon";
import Menuitems, { DashboardItem } from "./MenuItems";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../contexts/AuthContext";
import { getAllPages } from "../../store/fetchActions/accessProfiles";
import { normalizeIconName } from "../../utils/iconResolver";

const SIDEBAR_WIDTH = 318;

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

const Sidebar = ({ isSidebarOpen, onSidebarClose }) => {
  const dispatch = useDispatch();
  const reduxPages = useSelector((state) => state.accessProfiles.pages);
  const { profile, myPermissions, permissionsLoaded } = useContext(AuthContext);
  const { pathname } = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [openGroups, setOpenGroups] = useState([]);

  // Aguarda o token estar disponível antes de buscar as páginas, evitando 401 na corrida de inicialização.
  useEffect(() => {
    if (!permissionsLoaded) return;
    dispatch(getAllPages());
  }, [dispatch, profile, myPermissions, permissionsLoaded]);

  const dynamicMenu = useMemo(() => {
    const pages = Array.isArray(reduxPages) ? reduxPages : [];

    const visiblePages = pages.filter((pg) => {
      if (!pg?.ativo) return false;
      if (pg.path === DashboardItem.href) return false;
      if ((pg.category?.nome || pg.categoria) === 'Dashboard') return false;
      if (profile === "admin") return true;
      return myPermissions.includes(pg.path);
    });

    if (visiblePages.length === 0) return [];

    const grouped = visiblePages.reduce((acc, pg) => {
      const category = pg.category?.nome || pg.categoria || "Outros";
      if (!acc[category]) {
        acc[category] = { children: [], icon: pg.category?.icone, order: pg.category?.ordem ?? 999 };
      }
      if (!acc[category].icon && pg.category?.icone) acc[category].icon = pg.category.icone;
      acc[category].children.push({
        title: pg.titulo,
        icon: normalizeIconName(pg.icone, "circle"),
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

    const existingPaths = new Set(groups.flatMap((g) => g.children.map((c) => c.href)));
    const fallbackGroups = Menuitems.map((g) => ({ ...g, children: [...g.children] }));
    fallbackGroups.forEach((g) => {
      const missingChildren = g.children.filter((c) => {
        if (existingPaths.has(c.href)) return false;
        if (profile === "admin") return true;
        return myPermissions.includes(c.href);
      });
      if (missingChildren.length === 0) return;

      const group = groups.find((x) => x.title === g.title);
      if (group) {
        group.children = [...group.children, ...missingChildren]
          .sort((a, b) => ((a.order ?? 999) - (b.order ?? 999)) || a.title.localeCompare(b.title));
      } else {
        groups.push({
          title: g.title,
          icon: g.icon,
          order: 999,
          group: true,
          children: missingChildren.sort((a, b) => a.title.localeCompare(b.title)),
        });
      }
    });

    return groups.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
  }, [reduxPages, profile, myPermissions]);

  const menuGroups = dynamicMenu.length > 0 ? dynamicMenu : Menuitems;

  useEffect(() => {
    menuGroups.forEach((group) => {
      const hasActive = group.children.some((child) => pathname === child.href);
      if (hasActive) {
        setOpenGroups((prev) =>
          prev.includes(group.title) ? prev : [...prev, group.title]
        );
      }
    });
  }, [pathname, menuGroups]);

  const toggleGroup = (title) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const renderLeaf = (item) => (
    <NextLink href={item.href} passHref key={item.href}>
      <ListItemButton
        onClick={onSidebarClose}
        sx={{
          pl: 3,
          py: 1.1,
          mb: 0.6,
          borderRadius: "12px",
          color: "var(--lg-nav-color)",
          transition: "background 0.14s ease, color 0.14s ease",
          "&:hover": {
            background: "var(--lg-nav-hover-bg)",
            color: "var(--lg-text-primary)",
          },
          ...(pathname === item.href && {
            background: "linear-gradient(90deg, rgba(var(--lg-accent-rgb),0.34), rgba(var(--lg-accent-rgb),0.16))",
            border: "1px solid rgba(var(--lg-accent-rgb),0.45)",
            boxShadow: "0 0 22px rgba(var(--lg-accent-rgb),0.28), inset 0 0 18px rgba(var(--lg-accent-rgb),0.10)",
            color: "var(--lg-nav-active-color)",
            fontWeight: 500,
          }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 34 }}>
          <FeatherIcon
            icon={normalizeIconName(item.icon, "circle")}
            width="18"
            height="18"
            style={{
              color:
                pathname === item.href
                  ? "var(--lg-nav-active-color)"
                  : "var(--lg-nav-color)",
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={item.title}
          primaryTypographyProps={{ fontSize: "0.82rem" }}
        />
      </ListItemButton>
    </NextLink>
  );

  const renderGroup = (group) => {
    const visibleChildren = group.children.filter((child) => {
      if (child.public) return true;
      if (profile === "admin") return true;
      return myPermissions.includes(child.href);
    });
    if (visibleChildren.length === 0) return null;

    const isOpen = openGroups.includes(group.title);
    const hasActive = visibleChildren.some((child) => pathname === child.href);

    return (
      <Box key={group.title}>
        <ListItemButton
          onClick={() => toggleGroup(group.title)}
          sx={{
            borderRadius: "10px",
            mb: 0.6,
            color: "var(--lg-text-primary)",
            "&:hover": {
              background: "var(--lg-nav-hover-bg)",
            },
            ...(hasActive && !isOpen && {
              color: "var(--lg-nav-active-color)",
            }),
          }}
        >
          <ListItemIcon sx={{ minWidth: 34 }}>
            <FeatherIcon
              icon={normalizeIconName(group.icon, "grid")}
              width="20"
              height="20"
              style={{
                color: hasActive && !isOpen
                  ? "var(--lg-nav-active-color)"
                  : "var(--lg-text-primary)",
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={group.title}
            primaryTypographyProps={{
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--lg-text-muted)",
            }}
          />
          <FeatherIcon
            icon={isOpen ? "chevron-up" : "chevron-down"}
            width="16"
            height="16"
            style={{ color: "var(--lg-text-muted)", opacity: 0.4 }}
          />
        </ListItemButton>

        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List disablePadding>{visibleChildren.map((child) => renderLeaf(child))}</List>
        </Collapse>
      </Box>
    );
  };

  const isDashboardVisible =
    profile === "admin" || myPermissions.includes(DashboardItem.href);

  const SidebarContent = (
    <Box
      p={2}
      height="100%"
      sx={{
        mt: "64px",
        position: "relative",
        overflowY: "auto",
      }}
    >
      <Box
        sx={{
          borderBottom: "0.5px solid var(--lg-border)",
          pb: 1.5,
          mb: 1.5,
        }}
      >
        <LogoIcon />
      </Box>
      <Box mt={2}>
        <List disablePadding>
          {isDashboardVisible && (
            <NextLink href={DashboardItem.href} passHref>
              <ListItemButton
                onClick={onSidebarClose}
                sx={{
                  mb: 0.8,
                  borderRadius: "12px",
                  color: "var(--lg-nav-color)",
                  transition: "background 0.14s ease, color 0.14s ease",
                  "&:hover": {
                    background: "var(--lg-nav-hover-bg)",
                    color: "var(--lg-text-primary)",
                  },
                  ...(pathname === DashboardItem.href && {
                    background: "linear-gradient(90deg, rgba(var(--lg-accent-rgb),0.34), rgba(var(--lg-accent-rgb),0.16))",
                    border: "1px solid rgba(var(--lg-accent-rgb),0.45)",
                    boxShadow: "0 0 22px rgba(var(--lg-accent-rgb),0.28), inset 0 0 18px rgba(var(--lg-accent-rgb),0.10)",
                    color: "var(--lg-nav-active-color)",
                  }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <FeatherIcon
                    icon={DashboardItem.icon}
                    width="20"
                    height="20"
                    style={{
                      color:
                        pathname === DashboardItem.href
                          ? "var(--lg-nav-active-color)"
                          : "var(--lg-nav-color)",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={DashboardItem.title}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: "0.82rem" }}
                />
              </ListItemButton>
            </NextLink>
          )}

          {menuGroups.map((group) => renderGroup(group))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="left"
      open={isSidebarOpen}
      onClose={onSidebarClose}
      variant={isDesktop ? "persistent" : "temporary"}
      sx={{
        ...(isDesktop && {
          "& .MuiDrawer-paper": {
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
          },
        }),
      }}
      PaperProps={{
        className: "lg-sidebar-paper",
        sx: {
          width: `${SIDEBAR_WIDTH}px`,
          border: "0 !important",
          background: `
            radial-gradient(112% 102% at 8% 92%, rgba(var(--lg-accent-rgb), 0.14) 0%, rgba(var(--lg-accent-rgb), 0) 52%),
            linear-gradient(180deg, var(--lg-glass-sidebar) 0%, var(--lg-glass-sidebar) 100%)
          `,
          backdropFilter: "var(--lg-blur-sidebar)",
          WebkitBackdropFilter: "var(--lg-blur-sidebar)",
          borderRight: "1px solid var(--lg-border-sidebar)",
          boxShadow: "inset -1px 0 0 rgba(var(--lg-accent-rgb), 0.12), 0 20px 38px rgba(1, 7, 26, 0.24)",
          overflow: "hidden",
          position: "relative",
        },
      }}
    >
      {SidebarContent}
      {/* Glow effects posicionados relativos ao Paper, contidos pelo overflow:hidden */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 168,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* Glow base discreto */}
        <Box
          sx={{
            position: "absolute",
            left: "-92px",
            bottom: "-106px",
            width: "292px",
            height: "194px",
            background: "radial-gradient(circle at 40% 44%, rgba(var(--lg-accent-rgb), 0.24), rgba(var(--lg-accent-rgb), 0) 62%)",
            filter: "blur(9px)",
            opacity: 0.66,
          }}
        />
        {/* Arcos de luz no mesmo padrão da referência */}
        <Box
          sx={{
            position: "absolute",
            left: "-86px",
            bottom: "-44px",
            width: "312px",
            height: "126px",
            opacity: 0.86,
            background: `
              radial-gradient(134% 122% at 0% 100%, transparent 65.3%, rgba(var(--lg-accent-rgb), 0.50) 66.0%, transparent 66.7%),
              radial-gradient(134% 122% at 0% 100%, transparent 71.2%, rgba(var(--lg-accent-rgb), 0.42) 71.9%, transparent 72.6%),
              radial-gradient(134% 122% at 0% 100%, transparent 77.1%, rgba(var(--lg-accent-rgb), 0.34) 77.8%, transparent 78.5%)
            `,
            filter: "drop-shadow(0 0 6px rgba(var(--lg-accent-rgb), 0.34))",
          }}
        />
      </Box>
    </Drawer>
  );
};

Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  onSidebarClose: PropTypes.func.isRequired,
};

export default Sidebar;
