import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";

export default function AttendanceService() {
  const router = useRouter();
  const { ticketId } = router.query;
  const normalizedTicketId = Array.isArray(ticketId) ? ticketId[0] : ticketId;
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const load = async () => {
    if (!normalizedTicketId) return;

    setError("");
    try {
      const { data } = await attendanceApi.getServiceData(normalizedTicketId);
      setData(data);
      setNotes(data?.record?.notes || "");
    } catch (e) {
      setData(null);
      setError(e?.response?.data?.message || "Nao foi possivel carregar o atendimento.");
    } finally {
      setInitialLoadDone(true);
    }
  };

  useEffect(() => {
    if (!normalizedTicketId) return;
    load();
  }, [normalizedTicketId]);

  const doStart = async () => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.startService(normalizedTicketId);
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
      await attendanceApi.saveNotes(normalizedTicketId, { notes });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao salvar observacoes.");
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.finishService(normalizedTicketId, { notes });
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
      await attendanceApi.noShowTicket(normalizedTicketId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao marcar nao comparecimento.");
    } finally {
      setLoading(false);
    }
  };

  if (!data && !initialLoadDone) {
    return <BaseCard title="Atendimento"><Typography>Carregando...</Typography></BaseCard>;
  }

  if (!data && initialLoadDone) {
    return (
      <BaseCard title="Atendimento">
        <Typography color="error" sx={{ mb: 2 }}>{error || "Falha ao carregar atendimento."}</Typography>
        <Button variant="outlined" onClick={load}>Tentar novamente</Button>
      </BaseCard>
    );
  }

  const ticket = data.ticket || {};

  return (
    <BaseCard title={`Atendimento - ${ticket.display_code || ""}`}>
      <Typography sx={{ mb: 1 }}>Cliente: <strong>{ticket.client?.name || `#${ticket.client_id}`}</strong></Typography>
      <Typography sx={{ mb: 1 }}>Status: <strong>{ticket.status}</strong></Typography>
      <Typography sx={{ mb: 2 }}>Sala: <strong>{ticket.room?.name || "-"}</strong></Typography>

      <Typography variant="h6" sx={{ mb: 1 }}>Pendencias</Typography>
      {(data.pendingSummary || []).length === 0 ? (
        <Typography sx={{ mb: 2 }}>Nenhuma pendencia encontrada.</Typography>
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
        minRows={3}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={doStart} disabled={loading}>Iniciar</Button>
        <Button variant="outlined" onClick={saveNotes} disabled={loading}>Salvar observacoes</Button>
        <Button variant="contained" onClick={finish} disabled={loading}>Finalizar atendimento</Button>
        <Button variant="contained" color="warning" onClick={noShow} disabled={loading}>Nao compareceu</Button>
      </Box>

      {error ? <Typography color="error" sx={{ mt: 2 }}>{error}</Typography> : null}
    </BaseCard>
  );
}
