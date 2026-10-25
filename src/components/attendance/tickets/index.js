import React, { useEffect, useState } from "react";
import { attendanceApi } from "../../../services/attendanceApi";
import InputSelectClient from "../../inputs/inputSelectClient";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CampoSelecao } from "../../ui/campos";

export default function AttendanceTickets() {
  const [selectedClient, setSelectedClient] = useState({});
  const [clients, setClients] = useState([]);
  const [prefix, setPrefix] = useState("A");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [created, setCreated] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTickets = async (selectedRoomId = roomId) => {
    const { data } = await attendanceApi.listTickets({
      status: "aguardando",
      roomId: selectedRoomId || undefined,
    });
    setTickets(data || []);
  };

  useEffect(() => {
    Promise.all([
      attendanceApi.listRooms().then((res) => setRooms(res.data || [])),
      attendanceApi.listClients().then((res) => setClients(res.data || [])),
    ])
      .catch(() => setError("Não foi possível carregar os dados iniciais."));
  }, []);

  useEffect(() => {
    if (!roomId) {
      setTickets([]);
      return;
    }
    loadTickets(roomId).catch(() => setError("Não foi possível carregar a fila da sala."));
  }, [roomId]);

  const handleCreate = async () => {
    if (!selectedClient?.id || !roomId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await attendanceApi.createTicket({
        clientId: Number(selectedClient.id),
        prefix,
        roomId: Number(roomId),
      });
      setCreated(data);
      setSelectedClient({});
      await loadTickets(roomId);
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao gerar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="ui-reset">
      <CardHeader>
        <CardTitle>Emissão de Senha</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="attendance-tickets__toolbar flex flex-wrap items-end gap-3">
          <div className="attendance-tickets__client-field w-full min-w-[260px] md:w-1/2">
            <InputSelectClient
              label="Cliente"
              name="client"
              setClient={setSelectedClient}
              clients={clients}
              value={selectedClient?.id || ""}
              wd={"100%"}
            />
          </div>
          <div className="w-full sm:w-[260px]">
            <CampoSelecao id="senha-sala" label="Sala" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="attendance-tickets__room-select">
              <option value="">Selecione</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </CampoSelecao>
          </div>
          <div className="w-[120px]">
            <CampoSelecao id="senha-prefixo" label="Prefixo" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="attendance-tickets__prefix-select">
              <option value="A">A</option>
              <option value="G">G</option>
              <option value="P">P</option>
            </CampoSelecao>
          </div>
          <Button className="attendance-tickets__generate" onClick={handleCreate} disabled={loading || !selectedClient?.id || !roomId}>
            {loading ? "Gerando..." : "Gerar senha"}
          </Button>
        </div>

        {error ? <Banner tom="perigo">{error}</Banner> : null}
        {created ? (
          <Banner tom="sucesso">
            Senha gerada: <strong>{created.display_code}</strong> para {created.client?.name || `cliente #${created.client_id}`}
          </Banner>
        ) : null}

        <div>
          <h3 className="mb-1 font-display text-base font-bold">Fila atual da sala</h3>
          {!roomId ? (
            <p className="text-sm text-muted-foreground">Selecione uma sala para visualizar a fila.</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente aguardando atendimento.</p>
          ) : (
            tickets.map((t) => (
              <p key={t.id}>
                {t.display_code} - {t.client?.name || `Cliente #${t.client_id}`} ({t.room?.name || "Sem sala"})
              </p>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
