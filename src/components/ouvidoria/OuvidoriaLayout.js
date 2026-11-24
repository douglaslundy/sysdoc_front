import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { buscarConfigPortal } from "../../services/ouvidoria";
import { CONFIG_PADRAO } from "./configPadrao";

/**
 * Moldura das páginas públicas da ouvidoria: cabeçalho com a marca e o botão de tema,
 * formulário centralizado e largura que se adapta do celular ao computador.
 * Marca, títulos e itens vêm da configuração do admin (secao = "registrar" | "consultar").
 * Sempre abre no tema escuro. A troca vale só aqui: não grava a preferência do sistema
 * e devolve o tema anterior ao sair da página.
 */
export default function OuvidoriaLayout({ secao, titulo, descricao, children, rodape }) {
  const [modo, setModo] = useState("dark");
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarConfigPortal()
      .then((dados) => { if (ativo && dados?.[secao]) setConfig(dados); })
      .catch(() => {})
      .finally(() => { if (ativo) setCarregado(true); });
    return () => { ativo = false; };
  }, [secao]);

  // Até a config chegar, marca e textos ocupam o espaço mas ficam invisíveis: não pisca "DL Sistemas".
  const oculto = carregado ? {} : { "aria-hidden": true, className: "invisible" };

  const destaque = config[secao];

  useEffect(() => {
    const anterior = document.documentElement.getAttribute("data-theme");
    return () => {
      if (anterior) document.documentElement.setAttribute("data-theme", anterior);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", modo);
  }, [modo]);

  const escuro = modo === "dark";

  return (
    <main className="ui-raiz flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className={`flex items-center gap-2.5 ${oculto.className || ""}`} aria-hidden={oculto["aria-hidden"]}>
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.nome_marca} className="h-[30px] w-auto max-w-[120px] object-contain" />
          ) : (
            <span className="flex size-[30px] items-center justify-center rounded-[7px] bg-primary font-display text-[13px] font-extrabold text-primary-foreground">DL</span>
          )}
          <span className="font-display text-base font-extrabold tracking-[0.03em]">{config.nome_marca}</span>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setModo(escuro ? "light" : "dark")}
          aria-label={escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
          title={escuro ? "Tema claro" : "Tema escuro"}
        >
          {escuro ? <Sun /> : <Moon />}
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 sm:px-6 sm:py-12">
        {destaque ? (
          <section className={`w-full max-w-xl text-center ${oculto.className || ""}`} aria-hidden={oculto["aria-hidden"]}>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{destaque.titulo}</h1>
            {destaque.texto ? <p className="mt-2 text-sm text-muted-foreground sm:text-base">{destaque.texto}</p> : null}
            {destaque.itens?.length ? (
              <ul className="mt-4 flex flex-col items-center gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5">
                {destaque.itens.map((item, i) => (
                  <li key={`${i}-${item}`} className="flex gap-2">
                    <span aria-hidden className="text-primary-text">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-xl">{titulo}</CardTitle>
            {descricao ? <CardDescription>{descricao}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {rodape}
      </div>

      <p className="px-4 pb-6 text-center text-xs text-muted-foreground">Copyright © DL Sistemas {new Date().getFullYear()} • Todos os direitos reservados.</p>
    </main>
  );
}
