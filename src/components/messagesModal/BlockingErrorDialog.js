import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Dialogo, DialogoDescricao, DialogoRodape, DialogoTitulo } from "../ui/dialogo";

/**
 * Aviso de erro que PRECISA ser lido: fica na frente de tudo, em destaque (borda vermelha) e
 * só fecha no botão "Entendi" — clique fora ou Esc não o fecham (ao contrário das faixas
 * temporárias, que somem sozinhas).
 */
export default function BlockingErrorDialog({ open, title = "Atenção", message = "", onClose }) {
  return (
    <Dialogo aberto={Boolean(open)} aoFechar={() => onClose && onClose()} bloqueante alerta tamanho="md" elevado className="border-2 border-danger">
      <div className="flex items-center gap-3">
        <AlertTriangle aria-hidden className="size-7 shrink-0 text-danger" />
        <DialogoTitulo className="text-danger">{title}</DialogoTitulo>
      </div>
      <DialogoDescricao className="mt-4 whitespace-pre-wrap text-base font-semibold text-foreground">{message}</DialogoDescricao>
      <DialogoRodape>
        <Button variant="destructive" size="lg" autoFocus onClick={() => onClose && onClose()}>Entendi</Button>
      </DialogoRodape>
    </Dialogo>
  );
}
