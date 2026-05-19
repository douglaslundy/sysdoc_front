import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";

export default function AttendanceService() {
  const router = useRouter();
  const { ticketId } = router.query;
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!ticketId) return;
    const { data } = await attendanceApi.getServiceData(ticketId);
    setData(data);
    setNotes(data?.record?.notes || "");
  };

  useEffect(() => {
    load().catch(() => setError("Não foi possível carregar o atendimento."));
  }, [ticketId]);

  const doStart = async () => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.startService(ticketId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao iniciar atendimento.");
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.saveNotes(ticketId, { notes });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao salvar observações.");
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.finishService(ticketId, { notes });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao finalizar atendimento.");
    } finally {
      setLoading(false);
    }
  };

  const noShow = async () => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.noShowTicket(ticketId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao marcar não comparecimento.");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return <BaseCard title="Atendimento"><Typography>Carregando...</Typography></BaseCard>;
  }

  const ticket = data.ticket || {};

  return (
    <BaseCard title={`Atendimento - ${ticket.display_code || ""}`}>
      <Typography sx={{ mb: 1 }}>Cliente: <strong>{ticket.client?.name || `#${ticket.client_id}`}</strong></Typography>
      <Typography sx={{ mb: 1 }}>Status: <strong>{ticket.status}</strong></Typography>
      <Typography sx={{ mb: 2 }}>Sala: <strong>{ticket.room?.name || "-"}</strong></Typography>

      <Typography variant="h6" sx={{ mb: 1 }}>Pendências</Typography>
      {(data.pendingSummary || []).length === 0 ? (
        <Typography sx={{ mb: 2 }}>Nenhuma pendência encontrada.</Typography>
      ) : (
        <Box sx={{ mb: 2 }}>
          {data.pendingSummary.map((p) => (
            <Typography key={p.type}>{p.label}: {p.count}</Typography>
          ))}
        </Box>
      )}

      <TextField
        label="Registro do atendimento"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        fullWidth
        multiline
        minRows={6}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={doStart} disabled={loading}>Iniciar</Button>
        <Button variant="outlined" onClick={saveNotes} disabled={loading}>Salvar observações</Button>
        <Button variant="contained" onClick={finish} disabled={loading}>Finalizar atendimento</Button>
        <Button variant="contained" color="warning" onClick={noShow} disabled={loading}>Não compareceu</Button>
      </Box>

      {error ? <Typography color="error" sx={{ mt: 2 }}>{error}</Typography> : null}
    </BaseCard>
  );
}

