import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { attendanceApi } from "../../../services/attendanceApi";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CampoSelecao } from "../../ui/campos";
import { EstadoVazio } from "../../ui/estado-vazio";

export default function AttendanceQueue() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadQueue = async (selectedRoomId = roomId) => {
    const { data } = await attendanceApi.listQueue({ roomId: selectedRoomId });
    setQueue(data || []);
  };

  useEffect(() => {
    attendanceApi.listRooms()
      .then((res) => setRooms(res.data || []))
      .catch(() => setError("Não foi possível carregar dados da fila."));
  }, []);

  useEffect(() => {
    if (!roomId) {
      setQueue([]);
      return;
    }
    loadQueue(roomId).catch(() => setError("Não foi possível carregar a fila da sala."));
  }, [roomId]);

  const callNext = async () => {
    if (!roomId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await attendanceApi.callNext({ roomId: Number(roomId) });
      if (typeof window !== "undefined" && data?.id) {
        localStorage.setItem("attendance.currentTicketId", String(data.id));
      }
      await loadQueue(roomId);
      router.push(`/attendance/service/${data.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao chamar próximo.");
    } finally {
      setLoading(false);
    }
  };

  const callSpecific = async (ticketId) => {
    if (!roomId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await attendanceApi.callSpecific(ticketId, { roomId: Number(roomId) });
      if (typeof window !== "undefined" && data?.id) {
        localStorage.setItem("attendance.currentTicketId", String(data.id));
      }
      await loadQueue(roomId);
      router.push(`/attendance/service/${data.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao chamar senha específica.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fila de Atendimento</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="attendance-queue__toolbar flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-[260px]">
            <CampoSelecao id="atendimento-sala" label="Sala" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="attendance-queue__room-select">
              <option value="">Selecione</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </CampoSelecao>
          </div>
          <Button className="attendance-queue__call-next" onClick={callNext} disabled={loading || !roomId}>
            Chamar próximo
          </Button>
        </div>
        {error ? <Banner tom="perigo">{error}</Banner> : null}
        {!roomId ? (
          <EstadoVazio titulo="Selecione uma sala para visualizar os cidadãos aguardando." />
        ) : queue.length === 0 ? (
          <EstadoVazio titulo="Nenhum cliente aguardando atendimento." />
        ) : (
          <ul className="divide-y divide-border">
            {queue.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p>
                  <strong>{item.display_code}</strong> - {item.client?.name || `Cliente #${item.client_id}`} ({item.waitingMinutes || 0} min)
                </p>
                <Button variant="outline" onClick={() => callSpecific(item.id)} disabled={loading || !roomId}>
                  Chamar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
