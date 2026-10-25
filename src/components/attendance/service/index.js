import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { attendanceApi } from "../../../services/attendanceApi";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CampoTexto } from "../../ui/campos";
import { Carregando } from "../../ui/carregando";

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
      setError(e?.response?.data?.message || "Não foi possível carregar o atendimento.");
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
    return (
      <Card>
        <CardHeader><CardTitle>Atendimento</CardTitle></CardHeader>
        <CardContent><Carregando>Carregando...</Carregando></CardContent>
      </Card>
    );
  }

  if (!data && initialLoadDone) {
    return (
      <Card>
        <CardHeader><CardTitle>Atendimento</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <Banner tom="perigo">{error || "Falha ao carregar atendimento."}</Banner>
          <div><Button variant="outline" onClick={load}>Tentar novamente</Button></div>
        </CardContent>
      </Card>
    );
  }

  const ticket = data.ticket || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>{`Atendimento - ${ticket.display_code || ""}`}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1">
          <p>Cliente: <strong>{ticket.client?.name || `#${ticket.client_id}`}</strong></p>
          <p>Status: <strong>{ticket.status}</strong></p>
          <p>Sala: <strong>{ticket.room?.name || "-"}</strong></p>
        </div>

        <div>
          <h3 className="mb-1 font-display text-base font-bold">Pendencias</h3>
          {(data.pendingSummary || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pendencia encontrada.</p>
          ) : (
            <div>
              {data.pendingSummary.map((p) => (
                <p key={p.type}>{p.label}: {p.count}</p>
              ))}
            </div>
          )}
        </div>

        <CampoTexto id="atendimento-registro" label="Registro do atendimento" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={doStart} disabled={loading}>Iniciar</Button>
          <Button variant="outline" onClick={saveNotes} disabled={loading}>Salvar observacoes</Button>
          <Button onClick={finish} disabled={loading}>Finalizar atendimento</Button>
          <Button variant="secondary" onClick={noShow} disabled={loading}>Nao compareceu</Button>
        </div>

        {success ? <Banner tom="sucesso">{success}</Banner> : null}
        {error ? <Banner tom="perigo">{error}</Banner> : null}
      </CardContent>
    </Card>
  );
}
