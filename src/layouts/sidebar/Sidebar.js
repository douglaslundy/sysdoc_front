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
import Menuitems from "./MenuItems";
import { useRouter } from "next/router";
import { AuthContext } from "../../contexts/AuthContext";

const Sidebar = ({ isSidebarOpen, onSidebarClose }) => {
  const { profile, myPermissions } = useContext(AuthContext);
  const { pathname } = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [openGroups, setOpenGroups] = useState([]);

  // Auto-expandir o grupo que contém a rota ativa
  useEffect(() => {
    Menuitems.forEach((group) => {
      const hasActive = group.children.some((child) => pathname === child.href);
      if (hasActive) {
        setOpenGroups((prev) =>
          prev.includes(group.title) ? prev : [...prev, group.title]
        );
      }
    });
  }, [pathname]);

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
      // Admin vê tudo
      if (profile === 'admin') return true;
      // Perfis predefinidos (backward compat com arrays estáticos)
      if (child.profile.includes(profile)) return true;
      // Perfis dinâmicos criados via banco de dados
      if (myPermissions.includes(child.href)) return true;
      return false;
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
          <List disablePadding>
            {visibleChildren.map((child) => renderLeaf(child))}
          </List>
        </Collapse>
      </Box>
    );
  };

  const SidebarContent = (
    <Box p={2} height="100%" sx={{ mt: "64px" }}>
      <LogoIcon />
      <Box mt={2}>
        <List disablePadding>
          {Menuitems.map((group) => renderGroup(group))}
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
      PaperProps={{
        sx: {
          width: "265px",
          border: "0 !important",
          boxShadow: "0px 7px 30px 0px rgb(113 122 131 / 11%)",
          // position:fixed evita que o DrawerDockedRoot adicione height no flex-column do MainWrapper (SSR→hydration shift).
          ...(isDesktop && {
            position: "fixed",
            top: 0,
            height: "100vh",
          }),
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
