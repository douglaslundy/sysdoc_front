import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import HistoryDrawer from "../history/HistoryDrawer";
import { api } from "../../services/api";
import { printFiscalizacaoPdf } from "../../reports/fiscalizacao";

/** Histórico de movimentação da fiscalização (painel lateral) + nova movimentação + PDF. */
export default function FiscalizacaoHistorico({ open, onClose, fiscalizacao }) {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [descricao, setDescricao] = useState("");
  const [publico, setPublico] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setDescricao("");
      setPublico(false);
      load();
    }
  }, [open, fiscalizacaoId, load]);

  const handleAdd = async () => {
    if (!descricao.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/fiscalizacoes/${fiscalizacaoId}/movimentacoes`, { descricao: descricao.trim(), publico });
      setDescricao("");
      setPublico(false);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível registrar a movimentação.");
    } finally {
      setSaving(false);
    }
  };

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
          <TextField
            label="Nova movimentação"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 2000 }}
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={publico} onChange={(event) => setPublico(event.target.checked)} />}
            label="Visível ao denunciante"
          />
          <Box>
            <Button variant="contained" size="small" onClick={handleAdd} disabled={saving || !descricao.trim()}>
              Adicionar
            </Button>
          </Box>
        </Stack>
      }
    />
  );
}
