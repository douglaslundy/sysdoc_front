import React, { useEffect, useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";
import InputSelectClient from "../../inputs/inputSelectClient";

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
    <BaseCard title="Emissão de Senha">
      <Box className="attendance-tickets__toolbar" sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Box
          className="attendance-tickets__client-field"
          sx={{
            width: { xs: "100%", md: "50%" },
            minWidth: 260,
            "& .MuiAutocomplete-root": { width: "100%" },
          }}
        >
          <InputSelectClient
            label="Cliente"
            name="client"
            setClient={setSelectedClient}
            clients={clients}
            value={selectedClient?.id || ""}
            wd={"100%"}
          />
        </Box>
        <TextField className="attendance-tickets__room-select" select label="Sala" value={roomId} onChange={(e) => setRoomId(e.target.value)} sx={{ width: 260 }}>
          {rooms.map((room) => (
            <MenuItem key={room.id} value={room.id}>
              {room.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField className="attendance-tickets__prefix-select" select label="Prefixo" value={prefix} onChange={(e) => setPrefix(e.target.value)} sx={{ width: 120 }}>
          <MenuItem value="A">A</MenuItem>
          <MenuItem value="G">G</MenuItem>
          <MenuItem value="P">P</MenuItem>
        </TextField>
        <Button className="attendance-tickets__generate" variant="contained" onClick={handleCreate} disabled={loading || !selectedClient?.id || !roomId}>
          {loading ? "Gerando..." : "Gerar senha"}
        </Button>
      </Box>

      {error ? <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> : null}
      {created ? (
        <Typography sx={{ mb: 2 }}>
          Senha gerada: <strong>{created.display_code}</strong> para {created.client?.name || `cliente #${created.client_id}`}
        </Typography>
      ) : null}

      <Typography variant="h6" sx={{ mb: 1 }}>Fila atual da sala</Typography>
      {!roomId ? (
        <Typography>Selecione uma sala para visualizar a fila.</Typography>
      ) : tickets.length === 0 ? (
        <Typography>Nenhum cliente aguardando atendimento.</Typography>
      ) : (
        tickets.map((t) => (
          <Typography key={t.id}>
            {t.display_code} - {t.client?.name || `Cliente #${t.client_id}`} ({t.room?.name || "Sem sala"})
          </Typography>
        ))
      )}
    </BaseCard>
  );
}
