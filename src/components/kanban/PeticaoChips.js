import React from "react";
import { Button } from "../ui/button";
import { Pilula } from "../ui/pilula";

// Identificação de um card gerado por petição pública: unidade responsável, protocolo e atalho
// para a fiscalização. Cards comuns (sem fiscalização) não mostram nada.
export default function PeticaoChips({ item, onOpen }) {
  const protocolo = item?.fiscalizacao?.protocolo;
  if (!protocolo) return null;

  return (
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
      {item.unit?.nome ? <Pilula tom="info">{item.unit.nome}</Pilula> : null}
      <Pilula tom="neutro" contorno>{protocolo}</Pilula>
      <Button
        variant="link"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(protocolo);
        }}
      >
        Abrir fiscalização
      </Button>
    </div>
  );
}
