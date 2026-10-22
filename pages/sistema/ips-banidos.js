import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BaseCard from "../../src/components/baseCard/BaseCard";
import { api } from "../../src/services/api";

const formatDate = (value) => (value ? new Date(value).toLocaleString("pt-BR") : "—");

export default function IpsBanidosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [limit, setLimit] = useState("5");
  const [saved, setSaved] = useState(false);

  const [page, setPage] = useState(0); // base 0 (TablePagination); a API usa base 1
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/banned-ips", {
        params: {
          page: page + 1,
          per_page: perPage,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
      // Desbaniu o último item da página: volta uma página.
      if (!res.data.data?.length && page > 0) setPage(page - 1);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.errors?.date_to?.[0] || e?.response?.data?.message || "Não foi possível carregar os IPs banidos.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn) => {
    try {
      await fn();
      setError("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Operação não concluída.");
    }
  };

  const ban = () => act(async () => {
    await api.post("/banned-ips", { ip: ip.trim(), reason: reason.trim() || undefined });
    setIp("");
    setReason("");
  });

  const unban = (item) => act(() => api.delete(`/banned-ips/${item.id}`));

  useEffect(() => {
    api.get("/banned-ips/settings")
      .then((res) => setLimit(String(res.data.strike_limit)))
      .catch(() => setError("Não foi possível carregar a configuração de tentativas."));
  }, []);

  const saveLimit = async () => {
    try {
      const res = await api.put("/banned-ips/settings", { strike_limit: Number(limit) });
      setLimit(String(res.data.strike_limit));
      setError("");
      setSaved(true);
    } catch (e) {
      setSaved(false);
      setError(e?.response?.data?.errors?.strike_limit?.[0] || e?.response?.data?.message || "Não foi possível salvar.");
    }
  };

  return (
    <BaseCard title="IPs banidos" subtitle="Robôs que varrem rotas inexistentes são banidos automaticamente. Desbane aqui se necessário.">
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={1}>
        <TextField size="small" type="number" label="Tentativas até bloquear" value={limit}
          inputProps={{ min: 1, max: 1000 }} sx={{ width: 220 }}
          onChange={(e) => { setLimit(e.target.value); setSaved(false); }}
          helperText="404 em rotas inexistentes em 10 min (padrão 5)" />
        <Button variant="outlined" disabled={!limit || Number(limit) < 1} onClick={saveLimit}>Salvar</Button>
        {saved ? <Typography color="success.main" variant="body2">Salvo.</Typography> : null}
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
        <TextField size="small" label="IP" value={ip} onChange={(e) => setIp(e.target.value)} />
        <TextField size="small" label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button variant="contained" disabled={!ip.trim()} onClick={ban}>Banir IP</Button>
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
        <TextField size="small" type="date" label="Banido de" InputLabelProps={{ shrink: true }} value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} />
        <TextField size="small" type="date" label="Banido até" InputLabelProps={{ shrink: true }} value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(0); }} />
        {dateFrom || dateTo ? (
          <Button size="small" onClick={() => { setDateFrom(""); setDateTo(""); setPage(0); }}>Limpar período</Button>
        ) : null}
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          Total: <strong>{total}</strong> {total === 1 ? "registro" : "registros"}
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" py={3}>Nenhum IP banido.</Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>IP</TableCell>
                <TableCell>Origem do IP</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Origem</TableCell>
                <TableCell>Banido em</TableCell>
                <TableCell>Expira em</TableCell>
                <TableCell align="right">Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{item.ip}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{item.origin || "—"}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>{item.reason || "—"}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" color={item.source === "auto" ? "warning" : "info"}
                      label={item.source === "auto" ? "Automático" : "Manual"} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(item.created_at)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{item.expires_at ? formatDate(item.expires_at) : "Permanente"}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" onClick={() => unban(item)}>Desbanir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={perPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
        labelRowsPerPage="Itens por página"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />    </BaseCard>
  );
}
