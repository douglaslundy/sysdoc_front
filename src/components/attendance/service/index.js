import React, { useEffect, useState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
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
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const load = async () => {
    if (!normalizedTicketId) return;

    setError("");
    setSuccess("");
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
    setSuccess("");
    try {
      await attendanceApi.startService(normalizedTicketId);
      await load();
      setSuccess("Atendimento iniciado com sucesso.");
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao iniciar atendimento.");
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await attendanceApi.saveNotes(normalizedTicketId, { notes });
      await load();
      setSuccess("Observacoes salvas com sucesso.");
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao salvar observacoes.");
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await attendanceApi.finishService(normalizedTicketId, { notes });
      await load();
      const savedNotes = response?.data?.record?.notes;
      if ((savedNotes || "") !== (notes || "")) {
        setError("Atendimento finalizado, mas as observacoes nao foram confirmadas.");
        return;
      }
      setSuccess("Atendimento finalizado e observacoes salvas.");
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao finalizar atendimento.");
    } finally {
      setLoading(false);
    }
  };

  const noShow = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await attendanceApi.noShowTicket(normalizedTicketId);
      await load();
      setSuccess("Nao comparecimento registrado com sucesso.");
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

      {success ? <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert> : null}
      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
    </BaseCard>
  );
}
