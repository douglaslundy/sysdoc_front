import React, { useContext } from "react";
import { Moon, Sun } from "lucide-react";
import { ColorModeContext } from "../../contexts/ThemeContext";
import { Button } from "../ui/button";

// Botão de tema (claro/escuro) das páginas públicas de transparência, que não têm o cabeçalho do sistema.
export default function PublicThemeToggle() {
  const { toggleColorMode, mode } = useContext(ColorModeContext);
  const rotulo = mode === "dark" ? "Modo claro" : "Modo escuro";

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggleColorMode}
      aria-label="Alternar tema"
      title={rotulo}
      className="fixed top-3 right-3 z-50 bg-card"
    >
      {mode === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
