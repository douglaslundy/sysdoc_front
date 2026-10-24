import { useEffect, useState } from "react";
import Link from "next/link";
import FeatherIcon from "feather-icons-react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { normalizeIconName } from "../../utils/iconResolver";
import { DashboardItem } from "./MenuItems";
import LogoIcon from "../logo/LogoIcon";

const CLASSE_ITEM =
  "mx-1.5 flex items-center gap-2.5 rounded-[7px] border-l-2 border-transparent px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none";
const CLASSE_ITEM_ATIVO = "border-primary bg-primary/8 font-semibold text-foreground";

function ItemDeLink({ href, titulo, icone, ativo, aoNavegar, recuo = false }) {
  return (
    <Link href={href}>
      <a
        onClick={aoNavegar}
        aria-current={ativo ? "page" : undefined}
        className={cn(CLASSE_ITEM, recuo && "pl-6", ativo && CLASSE_ITEM_ATIVO)}
      >
        <FeatherIcon icon={normalizeIconName(icone, "circle")} size={16} className="shrink-0" aria-hidden />
        <span className="min-w-0 leading-tight break-words">{titulo}</span>
      </a>
    </Link>
  );
}

/**
 * Marca + itens + grupos recolhíveis: o mesmo conteúdo no menu fixo (md+) e na gaveta (celular).
 * menu = { groups, isDashboardVisible } vindo de useMenuGroups.
 */
export default function MenuDeNavegacao({ menu, pathname, rotulo, aoNavegar }) {
  const [abertos, setAbertos] = useState([]);

  // Abre sozinho o grupo da página atual.
  useEffect(() => {
    menu.groups.forEach((grupo) => {
      if (grupo.children.some((filho) => filho.href === pathname)) {
        setAbertos((anterior) => (anterior.includes(grupo.title) ? anterior : [...anterior, grupo.title]));
      }
    });
  }, [pathname, menu.groups]);

  const alternar = (titulo) =>
    setAbertos((anterior) => (anterior.includes(titulo) ? anterior.filter((t) => t !== titulo) : [...anterior, titulo]));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[60px] shrink-0 items-center border-b border-border px-4">
        <LogoIcon />
      </div>
      <nav aria-label={rotulo} className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-3">
        {menu.isDashboardVisible ? (
          <ItemDeLink href={DashboardItem.href} titulo={DashboardItem.title} icone={DashboardItem.icon} ativo={pathname === DashboardItem.href} aoNavegar={aoNavegar} />
        ) : null}
        {menu.groups.map((grupo) => {
          const aberto = abertos.includes(grupo.title);
          const temAtivo = grupo.children.some((filho) => filho.href === pathname);
          const idLista = `grupo-${grupo.title.replace(/\s+/g, "-")}`;
          return (
            <div key={grupo.title}>
              <button
                type="button"
                aria-expanded={aberto}
                aria-controls={idLista}
                onClick={() => alternar(grupo.title)}
                className={cn(
                  "mx-1.5 mt-1 flex w-[calc(100%-0.75rem)] items-center gap-2.5 rounded-[7px] px-3.5 py-2 text-left text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none",
                  temAtivo && !aberto && "text-primary-text",
                )}
              >
                <FeatherIcon icon={normalizeIconName(grupo.icon, "grid")} size={16} className="shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 leading-tight">{grupo.title}</span>
                <ChevronDown aria-hidden className={cn("size-4 shrink-0 transition-transform", aberto && "rotate-180")} />
              </button>
              {aberto ? (
                <div id={idLista} className="flex flex-col gap-0.5">
                  {grupo.children.map((filho) => (
                    <ItemDeLink key={filho.href} href={filho.href} titulo={filho.title} icone={filho.icon} ativo={pathname === filho.href} aoNavegar={aoNavegar} recuo />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
