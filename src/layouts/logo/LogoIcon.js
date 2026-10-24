import React from "react";
import NextLink from "next/link";

const LogoIcon = () => (
  <NextLink href="/dashboard">
    <a className="flex min-w-0 items-center gap-2.5 no-underline">
      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[7px] bg-primary font-display text-[13px] font-extrabold text-primary-foreground">
        DL
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-base leading-tight font-extrabold tracking-[0.03em] text-foreground">DL Sistemas</span>
        <span className="block truncate text-[9.5px] leading-none tracking-[0.06em] text-muted-foreground uppercase">Gestão Municipal</span>
      </span>
    </a>
  </NextLink>
);

export default LogoIcon;
