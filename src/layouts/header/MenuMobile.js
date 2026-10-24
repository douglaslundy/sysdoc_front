import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Menu } from "lucide-react";
import { Button } from "../../components/ui/button";
import MenuDeNavegacao from "../sidebar/MenuDeNavegacao";

/** Gaveta do celular: botão, painel com véu, Esc, foco e fecha ao navegar. */
export default function MenuMobile({ menu }) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef(null);
  const painel = useRef(null);
  const router = useRouter();

  function fechar() {
    setAberto(false);
    botao.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return undefined;
    painel.current?.querySelector("a, button")?.focus();
    function aoTeclar(e) {
      if (e.key === "Escape") {
        setAberto(false);
        botao.current?.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Qualquer troca de rota (inclusive voltar do navegador) fecha a gaveta.
  useEffect(() => {
    const fecharAoMudar = () => setAberto(false);
    router.events.on("routeChangeStart", fecharAoMudar);
    return () => router.events.off("routeChangeStart", fecharAoMudar);
  }, [router.events]);

  return (
    <div className="ui-reset no-print md:hidden">
      <Button ref={botao} variant="ghost" size="icon" aria-label="Abrir menu" aria-expanded={aberto} onClick={() => setAberto(true)}>
        <Menu className="size-5" />
      </Button>
      {aberto ? (
        <>
          <div data-testid="veu-do-menu" className="fixed inset-0 z-[99] bg-black/50" onClick={fechar} />
          <div ref={painel} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-y-0 left-0 z-[100] w-[min(280px,85vw)] border-r border-border bg-surface">
            <MenuDeNavegacao menu={menu} pathname={router.pathname} rotulo="Navegação do menu" aoNavegar={() => setAberto(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
