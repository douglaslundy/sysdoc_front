import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/router";
import ProfileDD from "./ProfileDD";
import MenuMobile from "./MenuMobile";
import { getPageTitle } from "../../utils/pageTitle";
import ProtocolBell from "../../components/protocolo/ProtocolBell";
import KanbanShortcut from "../../components/kanban/KanbanShortcut";
import { Button } from "../../components/ui/button";
import { ColorModeContext } from "../../contexts/ThemeContext";

/** Barra superior de 60px: gaveta (celular), título da página, atalhos, tema e usuário. */
const Header = ({ menu }) => {
  const { pathname } = useRouter();
  const pageTitle = getPageTitle(pathname);
  const { toggleColorMode, mode } = useContext(ColorModeContext);
  // O tema vem do navegador (localStorage); só desenha o ícone depois de montar para não divergir do HTML do servidor (React 17 não corrige o SVG na hidratação).
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const rotuloTema = mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <header className="no-print sticky top-0 z-50 flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <MenuMobile menu={menu} />
        <p className="truncate font-display text-lg leading-tight font-extrabold capitalize sm:text-xl">{pageTitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <KanbanShortcut />
        <ProtocolBell />
        <Button variant="ghost" size="icon" aria-label={rotuloTema} title={rotuloTema} onClick={toggleColorMode}>
          {montado ? mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" /> : <span className="size-5" />}
        </Button>
        <ProfileDD />
      </div>
    </header>
  );
};

Header.propTypes = {
  menu: PropTypes.object.isRequired,
};

export default Header;
