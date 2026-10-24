import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Dialogo, DialogoDescricao, DialogoRodape, DialogoTitulo } from "../ui/dialogo";

export default function DestructiveConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  loading = false,
  onClose,
  onConfirm,
}) {
  return (
    <Dialogo aberto={Boolean(open)} aoFechar={() => !loading && onClose()} tamanho="sm" alerta>
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 size-6 shrink-0 text-danger" />
        <div className="min-w-0 space-y-2">
          <DialogoTitulo>{title}</DialogoTitulo>
          <DialogoDescricao>{message}</DialogoDescricao>
        </div>
      </div>
      <DialogoRodape>
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
          {loading ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {loading ? "Excluindo..." : confirmLabel}
        </Button>
      </DialogoRodape>
    </Dialogo>
  );
}
