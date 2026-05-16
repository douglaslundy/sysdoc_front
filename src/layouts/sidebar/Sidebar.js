import React, { useContext, useEffect, useState } from "react";
import NextLink from "next/link";
import PropTypes from "prop-types";
import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItem,
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
import { AuthContext } from "../../contexts/AuthContext";
import { api } from "../../services/api";

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

const normalizeIconName = (iconName, fallback = "circle") => {
  if (typeof iconName !== "string") return fallback;
  const normalized = iconName
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  return normalized.length > 0 ? normalized : fallback;
};

const getForcedIconByPath = (href) => {
  if (href === "/errorlogs") return "alert-triangle";
  if (href === "/qrcodelogs") return "maximize";
  return null;
};

const Sidebar = ({ isSidebarOpen, onSidebarClose }) => {
  const { profile, myPermissions } = useContext(AuthContext);
  const { pathname } = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [openGroups, setOpenGroups] = useState([]);
  const [dynamicMenu, setDynamicMenu] = useState([]);

  const menuGroups = dynamicMenu.length > 0 ? dynamicMenu : Menuitems;

  useEffect(() => {
    let mounted = true;

    const buildDynamicMenu = async () => {
      try {
        const res = await api.get("/system-pages");
        const pages = Array.isArray(res.data) ? res.data : [];

        const visiblePages = pages.filter((pg) => {
          if (!pg?.ativo) return false;
          if (pg.path === DashboardItem.href) return false;
          if (profile === "admin") return true;
          return myPermissions.includes(pg.path);
        });

        if (visiblePages.length === 0) {
          if (mounted) setDynamicMenu([]);
          return;
        }

        const grouped = visiblePages.reduce((acc, pg) => {
          const category = pg.category?.nome || pg.categoria || "Outros";
          if (!acc[category]) {
            acc[category] = { children: [], icon: pg.category?.icone, order: pg.category?.ordem ?? 999 };
          }
          if (!acc[category].icon && pg.category?.icone) acc[category].icon = pg.category.icone;
          acc[category].children.push({
            title: pg.titulo,
            icon: getForcedIconByPath(pg.path) || normalizeIconName(pg.icone, "circle"),
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

        if (mounted) setDynamicMenu(groups.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title)));
      } catch (_) {
        if (mounted) setDynamicMenu([]);
      }
    };

    buildDynamicMenu();

    return () => {
      mounted = false;
    };
  }, [profile, myPermissions]);

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
          pl: 4.5,
          py: 0.9,
          mb: 0.6,
          borderRadius: "10px",
          color: "var(--lg-nav-color)",
          position: "relative",
          transition: "background 0.14s ease, color 0.14s ease",
          "&:hover": {
            background: "var(--lg-nav-hover-bg)",
            color: "var(--lg-text-primary)",
          },
          ...(pathname === item.href && {
            background: "var(--lg-nav-active-bg)",
            color: "var(--lg-nav-active-color)",
            fontWeight: 500,
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: "20%",
              height: "60%",
              width: "3px",
              background: "var(--lg-nav-active-bar)",
              borderRadius: "0 3px 3px 0",
            },
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
              fontSize: "9px",
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
                  borderRadius: "10px",
                  color: "var(--lg-nav-color)",
                  position: "relative",
                  transition: "background 0.14s ease, color 0.14s ease",
                  "&:hover": {
                    background: "var(--lg-nav-hover-bg)",
                    color: "var(--lg-text-primary)",
                  },
                  ...(pathname === DashboardItem.href && {
                    background: "var(--lg-nav-active-bg)",
                    color: "var(--lg-nav-active-color)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: "20%",
                      height: "60%",
                      width: "3px",
                      background: "var(--lg-nav-active-bar)",
                      borderRadius: "0 3px 3px 0",
                    },
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
        sx: {
          width: "265px",
          border: "0 !important",
          background: "var(--lg-glass-sidebar)",
          backdropFilter: "var(--lg-blur-sidebar)",
          WebkitBackdropFilter: "var(--lg-blur-sidebar)",
          borderRight: "0.5px solid var(--lg-border-sidebar)",
          boxShadow: "var(--lg-shadow-panel)",
        },
      }}
    >
      {SidebarContent}
    </Drawer>
  );
};

Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  onSidebarClose: PropTypes.func.isRequired,
};

export default Sidebar;
