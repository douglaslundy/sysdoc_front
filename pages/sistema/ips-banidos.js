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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/banned-ips", { params: { per_page: 200 } });
      setItems(res.data.data || []);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.message || "Não foi possível carregar os IPs banidos.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <BaseCard title="IPs banidos" subtitle="Robôs que varrem rotas inexistentes são banidos automaticamente. Desbane aqui se necessário.">
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
        <TextField size="small" label="IP" value={ip} onChange={(e) => setIp(e.target.value)} />
        <TextField size="small" label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button variant="contained" disabled={!ip.trim()} onClick={ban}>Banir IP</Button>
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
    </BaseCard>
  );
}
