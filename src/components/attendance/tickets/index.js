import React, { useEffect, useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";

export default function AttendanceTickets() {
  const [clientId, setClientId] = useState("");
  const [prefix, setPrefix] = useState("A");
  const [created, setCreated] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTickets = async () => {
    const { data } = await attendanceApi.listTickets({ status: "aguardando" });
    setTickets(data || []);
  };

  useEffect(() => {
    loadTickets().catch(() => setError("Não foi possível carregar as senhas."));
  }, []);

  const handleCreate = async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await attendanceApi.createTicket({ clientId: Number(clientId), prefix });
      setCreated(data);
      setClientId("");
      await loadTickets();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao gerar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseCard title="Emissão de Senha">
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <TextField
          label="ID do cliente"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField select label="Prefixo" value={prefix} onChange={(e) => setPrefix(e.target.value)} sx={{ width: 120 }}>
          <MenuItem value="A">A</MenuItem>
          <MenuItem value="G">G</MenuItem>
          <MenuItem value="P">P</MenuItem>
        </TextField>
        <Button variant="contained" onClick={handleCreate} disabled={loading || !clientId}>
          {loading ? "Gerando..." : "Gerar senha"}
        </Button>
      </Box>

      {error ? <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> : null}
      {created ? (
        <Typography sx={{ mb: 2 }}>
          Senha gerada: <strong>{created.display_code}</strong> para {created.client?.name || `cliente #${created.client_id}`}
        </Typography>
      ) : null}

      <Typography variant="h6" sx={{ mb: 1 }}>Fila atual (aguardando)</Typography>
      {tickets.length === 0 ? (
        <Typography>Nenhum cliente aguardando atendimento.</Typography>
      ) : (
        tickets.map((t) => (
          <Typography key={t.id}>
            {t.display_code} - {t.client?.name || `Cliente #${t.client_id}`}
          </Typography>
        ))
      )}
    </BaseCard>
  );
}

