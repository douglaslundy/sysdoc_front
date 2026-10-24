import React from "react";
import Link from "next/link";

const diasDeLicenca = () =>
  Math.round(
    (new Date("2027-01-01") - new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`)) /
      (1000 * 60 * 60 * 24),
  );

const Footer = () => (
  <footer className="ui-reset no-print px-4 py-6 text-center text-sm text-muted-foreground">
    <p>
      © 2022 All rights reserved by{" "}
      <Link href="https://www.dlsistemas.com.br">
        <a className="text-primary-text underline-offset-4 hover:underline">www.dlsistemas.com.br</a>
      </Link>
    </p>
    <p className="mt-1 font-display text-base font-bold text-foreground">Licença: {diasDeLicenca()} dias restantes</p>
  </footer>
);

export default Footer;
