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
            icon: pg.icone || "circle",
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
              icon: groupData.icon || CATEGORY_ICONS[normalized] || groupData.children[0]?.icon || "grid",
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
      <ListItem
        button
        onClick={onSidebarClose}
        selected={pathname === item.href}
        sx={{
          pl: 4,
          mb: 0.5,
          borderRadius: 1,
          ...(pathname === item.href && {
            color: theme.palette.primary.contrastText,
            backgroundColor: `${theme.palette.primary.main}!important`,
          }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <FeatherIcon
            icon={item.icon}
            width="18"
            height="18"
            style={{
              color:
                pathname === item.href
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.secondary,
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={item.title}
          primaryTypographyProps={{ fontSize: "0.85rem" }}
        />
      </ListItem>
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
            borderRadius: 1,
            mb: 0.5,
            ...(hasActive && !isOpen && {
              color: theme.palette.primary.main,
            }),
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FeatherIcon
              icon={group.icon}
              width="20"
              height="20"
              style={{
                color: hasActive && !isOpen
                  ? theme.palette.primary.main
                  : theme.palette.text.primary,
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={group.title}
            primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }}
          />
          <FeatherIcon
            icon={isOpen ? "chevron-up" : "chevron-down"}
            width="16"
            height="16"
            style={{ color: theme.palette.text.secondary }}
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
    <Box p={2} height="100%" sx={{ mt: "64px" }}>
      <LogoIcon />
      <Box mt={2}>
        <List disablePadding>
          {isDashboardVisible && (
            <NextLink href={DashboardItem.href} passHref>
              <ListItem
                button
                onClick={onSidebarClose}
                selected={pathname === DashboardItem.href}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  ...(pathname === DashboardItem.href && {
                    color: theme.palette.primary.contrastText,
                    backgroundColor: `${theme.palette.primary.main}!important`,
                  }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <FeatherIcon
                    icon={DashboardItem.icon}
                    width="20"
                    height="20"
                    style={{
                      color:
                        pathname === DashboardItem.href
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.primary,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={DashboardItem.title}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }}
                />
              </ListItem>
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
          boxShadow: "0px 7px 30px 0px rgb(113 122 131 / 11%)",
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
