import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import HistoryDrawer from "../history/HistoryDrawer";
import { api } from "../../services/api";
import { printFiscalizacaoPdf } from "../../reports/fiscalizacao";

/** Histórico da fiscalização (painel lateral, somente leitura) + PDF. O histórico é gerado pelas edições da própria fiscalização. */
export default function FiscalizacaoHistorico({ open, onClose, fiscalizacao }) {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fiscalizacaoId = fiscalizacao?.id;

  const load = useCallback(async () => {
    if (!fiscalizacaoId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/fiscalizacoes/${fiscalizacaoId}/historico`);
      setMovimentacoes(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }, [fiscalizacaoId]);

  useEffect(() => {
    if (open && fiscalizacaoId) {
      setMovimentacoes([]);
      load();
    }
  }, [open, fiscalizacaoId, load]);

  const items = movimentacoes.map((mov) => ({ ...mov, badge: mov.publico ? "Público" : undefined }));

  return (
    <HistoryDrawer
      open={open}
      onClose={onClose}
      title={`Histórico ${fiscalizacao?.protocolo || ""}`.trim()}
      subtitle={fiscalizacao?.estabelecimento?.nome_estabelecimento || ""}
      items={items}
      loading={loading}
      error={error}
      extra={
        <Stack spacing={1.5}>
          <Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => printFiscalizacaoPdf({ fiscalizacao, movimentacoes, modo: "interno" })}
            >
              Imprimir PDF
            </Button>
          </Box>
        </Stack>
      }
    />
  );
}
