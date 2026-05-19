import React, { useEffect, useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";
import InputSelectClient from "../../inputs/inputSelectClient";

export default function AttendanceTickets() {
  const [selectedClient, setSelectedClient] = useState({});
  const [clients, setClients] = useState([]);
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
    Promise.all([loadTickets(), attendanceApi.listClients().then((res) => setClients(res.data || []))])
      .catch(() => setError("Não foi possível carregar os dados iniciais."));
  }, []);

  const handleCreate = async () => {
    if (!selectedClient?.id) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await attendanceApi.createTicket({ clientId: Number(selectedClient.id), prefix });
      setCreated(data);
      setSelectedClient({});
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
        <InputSelectClient
          label="Cliente"
          name="client"
          setClient={setSelectedClient}
          clients={clients}
          value={selectedClient?.id || ""}
          wd={"50%"}
        />
        <TextField select label="Prefixo" value={prefix} onChange={(e) => setPrefix(e.target.value)} sx={{ width: 120 }}>
          <MenuItem value="A">A</MenuItem>
          <MenuItem value="G">G</MenuItem>
          <MenuItem value="P">P</MenuItem>
        </TextField>
        <Button variant="contained" onClick={handleCreate} disabled={loading || !selectedClient?.id}>
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
