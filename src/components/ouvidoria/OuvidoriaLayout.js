import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

/**
 * Moldura das páginas públicas da ouvidoria: cabeçalho com a marca e o botão de tema,
 * formulário centralizado e largura que se adapta do celular ao computador.
 * Sempre abre no tema escuro. A troca vale só aqui: não grava a preferência do sistema
 * e devolve o tema anterior ao sair da página.
 */
export default function OuvidoriaLayout({ titulo, descricao, destaque, children, rodape }) {
  const [modo, setModo] = useState("dark");

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
        <div className="flex items-center gap-2.5">
          <span className="flex size-[30px] items-center justify-center rounded-[7px] bg-primary font-display text-[13px] font-extrabold text-primary-foreground">DL</span>
          <span className="font-display text-base font-extrabold tracking-[0.03em]">DL Sistemas</span>
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
          <section className="w-full max-w-xl text-center">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{destaque.titulo}</h1>
            {destaque.texto ? <p className="mt-2 text-sm text-muted-foreground sm:text-base">{destaque.texto}</p> : null}
            {destaque.beneficios?.length ? (
              <ul className="mt-4 flex flex-col items-center gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5">
                {destaque.beneficios.map((item) => (
                  <li key={item} className="flex gap-2">
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
