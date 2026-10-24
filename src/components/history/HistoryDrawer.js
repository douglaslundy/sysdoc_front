import React from "react";
import { Loader2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";
import { Gaveta } from "../ui/gaveta";
import { Pilula } from "../ui/pilula";

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = parseISO(String(value));
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy HH:mm") : "—";
};

/**
 * Painel lateral de histórico (mesmo padrão visual da "Movimentação" de protocolos e
 * documentos). Genérico: quem usa fornece os itens já na ordem de exibição
 * (mais recente em cima) no formato { id, titulo, detalhe, usuario, data }.
 */
export default function HistoryDrawer({
  open,
  onClose,
  title = "Histórico",
  subtitle = "",
  items = [],
  loading = false,
  error = "",
  hasMore = false,
  onLoadMore,
  extra = null,
}) {
  return (
    <Gaveta aberto={Boolean(open)} aoFechar={onClose} titulo={title} subtitulo={subtitle}>
      {extra ? <div className="mb-4">{extra}</div> : null}

      {error ? <div className="mb-4"><Banner tom="perigo">{error}</Banner></div> : null}

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Pilula tom="neutro" contorno>{item.usuario || "Sistema"}</Pilula>
                {item.badge ? <Pilula tom="info">{item.badge}</Pilula> : null}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.data)}</span>
            </div>
            <p data-testid="history-item-title" className="mt-2 text-sm font-bold">{item.titulo}</p>
            {item.detalhe ? <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{item.detalhe}</p> : null}
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-5 animate-spin" />
          Carregando histórico...
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Nenhum registro.</p> : null}

      {hasMore && !loading ? (
        <Button variant="outline" onClick={onLoadMore} className="mt-4 self-center">Carregar mais</Button>
      ) : null}
    </Gaveta>
  );
}
