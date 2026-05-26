import React from "react";
import PropTypes from "prop-types";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { useRouter } from "next/router";
import ProfileDD from "./ProfileDD";

const ROUTE_TITLES_PT = {
  "/": "Inicio",
  "/dashboard": "Dashboard",
  "/users": "Usuarios",
  "/clients": "Clientes",
  "/client_report": "Relatorio de Clientes",
  "/trips": "Viagens",
  "/routes": "Rotas",
  "/queue": "Fila",
  "/specialities": "Especialidades",
  "/logs": "Logs",
  "/errorlogs": "Erros",
  "/qrcodelogs": "Logs QR Code",
  "/auditoria": "Auditoria",
  "/estabelecimentos": "Estabelecimentos",
  "/alvaras": "Alvaras",
  "/paginas-sistema": "Paginas do Sistema",
  "/paginas-categorias": "Categorias de Paginas",
  "/pharmacy/medicines": "Farmacia - Medicamentos",
  "/pharmacy/daily-status": "Farmacia - Status Diario",
  "/pharmacy/monthly-acquisitions": "Farmacia - Aquisicoes Mensais",
  "/pharmacy/panel-settings": "Farmacia - Configuracao do Painel",
  "/pharmacy/compliance": "Farmacia - Compliance",
  "/laboratorio/agenda": "Laboratorio - Agenda",
  "/laboratorio/exames": "Laboratorio - Exames",
  "/laboratorio/pedidos": "Laboratorio - Pedidos",
  "/laboratorio/medicos": "Laboratorio - Medicos",
  "/laboratorio/categorias": "Laboratorio - Categorias",
  "/attendance/tickets": "Atendimento - Emissao de Senha",
  "/attendance/queue": "Atendimento - Fila do Atendente",
  "/attendance/service": "Atendimento - Atendimento Atual",
  "/attendance/rooms": "Atendimento - Salas de Atendimento",
  "/attendance/panel": "Atendimento - Painel Publico",
  "/attendance/history": "Atendimento - Atendimentos Realizados",
};

const Header = ({ sx, customClass, toggleSidebar, position = "fixed" }) => {
  const router = useRouter();

  const normalizedPath = `/${router.pathname.replace(/^\/+/, "").replace(/\/\d+$/, "")}`;
  const mappedTitle = ROUTE_TITLES_PT[normalizedPath];
  const fallbackTitle = normalizedPath
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[-_]/g, " ");
  const pageTitle = mappedTitle || fallbackTitle || "Inicio";

  return (
    <AppBar
      sx={{
        ...sx,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "var(--lg-glass-topbar)",
        backdropFilter: "var(--lg-blur-topbar)",
        WebkitBackdropFilter: "var(--lg-blur-topbar)",
        borderBottom: "0.5px solid var(--lg-border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset",
        color: "var(--lg-text-primary)",
      }}
      position={position}
      elevation={0}
      className={customClass}
    >
      <Toolbar sx={{ px: "22px !important", py: "13px", minHeight: "64px !important" }}>
        <IconButton
          size="large"
          color="inherit"
          aria-label="open sidebar"
          edge="start"
          onClick={toggleSidebar}
          sx={{
            mr: 2,
            display: "flex",
            background: "var(--lg-glass-chip)",
            border: "0.5px solid var(--lg-border)",
            borderRadius: "10px",
            "&:hover": {
              background: "var(--lg-glass-panel-hover)",
            },
          }}
        >
          <FeatherIcon icon="menu" width="20" height="20" />
        </IconButton>

        <Typography
          sx={{
            fontSize: "17px",
            fontWeight: 600,
            color: "var(--lg-text-primary)",
            letterSpacing: "-0.01em",
            textTransform: "capitalize",
          }}
        >
          {pageTitle}
        </Typography>

        <Box flexGrow={1} />

        <ProfileDD />
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
  customClass: PropTypes.string,
  position: PropTypes.string,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Header;
