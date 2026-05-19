import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";

export default function AttendanceQueue() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadQueue = async () => {
    const { data } = await attendanceApi.listQueue();
    setQueue(data || []);
  };

  useEffect(() => {
    loadQueue().catch(() => setError("Não foi possível carregar a fila."));
  }, []);

  const callNext = async () => {
    if (!roomId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await attendanceApi.callNext({ roomId: Number(roomId) });
      await loadQueue();
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
      await loadQueue();
      router.push(`/attendance/service/${data.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao chamar senha específica.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseCard title="Fila de Atendimento">
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField label="Sala (ID)" value={roomId} onChange={(e) => setRoomId(e.target.value)} sx={{ width: 180 }} />
        <Button variant="contained" onClick={callNext} disabled={loading || !roomId}>
          Chamar próximo
        </Button>
      </Box>
      {error ? <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> : null}
      {queue.length === 0 ? (
        <Typography>Nenhum cliente aguardando atendimento.</Typography>
      ) : (
        queue.map((item) => (
          <Box key={item.id} sx={{ py: 1.5, borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography>
              <strong>{item.display_code}</strong> - {item.client?.name || `Cliente #${item.client_id}`} ({item.waitingMinutes || 0} min)
            </Typography>
            <Button variant="outlined" onClick={() => callSpecific(item.id)} disabled={loading || !roomId}>
              Chamar
            </Button>
          </Box>
        ))
      )}
    </BaseCard>
  );
}

