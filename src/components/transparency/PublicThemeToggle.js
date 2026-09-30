import React, { useContext } from "react";
import { IconButton, Tooltip } from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { ColorModeContext } from "../../contexts/ThemeContext";

// Botão de tema (claro/escuro) das páginas públicas de transparência, que não têm o cabeçalho do sistema.
export default function PublicThemeToggle() {
  const { toggleColorMode, mode } = useContext(ColorModeContext);

  return (
    <Tooltip title={mode === "dark" ? "Modo claro" : "Modo escuro"}>
      <IconButton
        onClick={toggleColorMode}
        aria-label="Alternar tema"
        size="small"
        className="theme-toggle-btn"
        sx={{ position: "fixed", top: 12, right: 12, zIndex: 1300 }}
      >
        <FeatherIcon icon={mode === "dark" ? "sun" : "moon"} width="18" height="18" />
      </IconButton>
    </Tooltip>
  );
}
