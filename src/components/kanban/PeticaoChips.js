import React from "react";
import { Button, Chip, Stack } from "@mui/material";

// Identificação de um card gerado por petição pública: unidade responsável, protocolo e atalho
// para a fiscalização. Cards comuns (sem fiscalização) não mostram nada.
export default function PeticaoChips({ item, onOpen }) {
  const protocolo = item?.fiscalizacao?.protocolo;
  if (!protocolo) return null;

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1, minWidth: 0 }} flexWrap="wrap" useFlexGap alignItems="center">
      {item.unit?.nome ? <Chip size="small" color="info" label={item.unit.nome} /> : null}
      <Chip size="small" variant="outlined" label={protocolo} />
      <Button
        size="small"
        variant="text"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(protocolo);
        }}
      >
        Abrir fiscalização
      </Button>
    </Stack>
  );
}
