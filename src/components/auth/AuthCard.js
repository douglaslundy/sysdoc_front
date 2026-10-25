import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

/**
 * Moldura das telas de acesso (login, esqueci/redefinir senha), como o AuthCard do CRM:
 * painel de marca à esquerda (só a partir de 1024px) e cartão do formulário à direita.
 * No celular só aparece o cartão, com a marca em cima.
 */
export default function AuthCard({ titulo, descricao, destaque, children, rodape }) {
  return (
    <main className="ui-raiz flex min-h-dvh bg-background font-sans text-foreground">
      <aside
        data-testid="painel-de-marca"
        className="hidden flex-1 flex-col justify-center bg-surface bg-[radial-gradient(circle_at_30%_50%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_60%)] p-14 lg:flex"
      >
        <span className="flex size-[72px] items-center justify-center rounded-[18px] bg-primary font-display text-3xl font-extrabold text-primary-foreground">DL</span>
        <p className="mt-6 font-display text-4xl font-extrabold">{destaque?.titulo || "DL Sistemas"}</p>
        <p className="mt-2 max-w-xl text-base text-muted-foreground">{destaque?.texto || "Gestão municipal em um só lugar."}</p>
        {destaque?.beneficios?.length ? (
          <ul className="mt-10 space-y-3 text-[15px] text-muted-foreground">
            {destaque.beneficios.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-primary-text">✓</span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </aside>
      <div className="flex w-full flex-col items-center justify-center gap-6 p-4 sm:p-6 lg:w-[480px] lg:shrink-0 lg:p-12">
        <div className="flex items-center gap-2.5 lg:hidden">
          <span className="flex size-[30px] items-center justify-center rounded-[7px] bg-primary font-display text-[13px] font-extrabold text-primary-foreground">DL</span>
          <span className="font-display text-base font-extrabold tracking-[0.03em]">DL Sistemas</span>
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">{titulo}</CardTitle>
            {descricao ? <CardDescription>{descricao}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {rodape}
        <p className="text-center text-xs text-muted-foreground">Copyright © DL Sistemas {new Date().getFullYear()} • Todos os direitos reservados.</p>
      </div>
    </main>
  );
}
