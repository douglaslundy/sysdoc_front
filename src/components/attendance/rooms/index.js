import React, { useEffect, useState } from "react";
import { Box, Button, Chip, TextField, Typography } from "@mui/material";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";

const initialForm = { id: null, name: "", description: "", active: true };

export default function AttendanceRooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRooms = async () => {
    const { data } = await attendanceApi.listRoomsAdmin();
    setRooms(data || []);
  };

  useEffect(() => {
    loadRooms().catch(() => setError("Não foi possível carregar as salas."));
  }, []);

  const onSubmit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (form.id) {
        await attendanceApi.updateRoom(form.id, {
          name: form.name,
          description: form.description,
          active: form.active,
        });
      } else {
        await attendanceApi.createRoom({
          name: form.name,
          description: form.description,
          active: true,
        });
      }
      setForm(initialForm);
      await loadRooms();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao salvar sala.");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (room) => setForm({
    id: room.id,
    name: room.name || "",
    description: room.description || "",
    active: !!room.active,
  });

  const onInactivate = async (roomId) => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.inactivateRoom(roomId);
      await loadRooms();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao inativar sala.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (roomId) => {
    setLoading(true);
    setError("");
    try {
      await attendanceApi.deleteRoom(roomId);
      await loadRooms();
    } catch (e) {
      setError(e?.response?.data?.message || "Erro ao remover sala.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseCard title="Salas de Atendimento">
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          label="Nome da sala"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          sx={{ minWidth: 260 }}
        />
        <TextField
          label="Descrição"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          sx={{ minWidth: 320 }}
        />
        <Button variant="contained" onClick={onSubmit} disabled={loading || !form.name.trim()}>
          {form.id ? "Atualizar" : "Criar sala"}
        </Button>
        {form.id ? (
          <Button variant="outlined" onClick={() => setForm(initialForm)} disabled={loading}>
            Cancelar edição
          </Button>
        ) : null}
      </Box>

      {error ? <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> : null}

      {rooms.length === 0 ? (
        <Typography>Nenhuma sala cadastrada.</Typography>
      ) : (
        rooms.map((room) => (
          <Box
            key={room.id}
            sx={{
              py: 1.5,
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6">{room.name}</Typography>
              <Typography color="text.secondary">{room.description || "-"}</Typography>
              <Chip
                size="small"
                label={room.active ? "Ativa" : "Inativa"}
                color={room.active ? "success" : "default"}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={() => onEdit(room)} disabled={loading}>
                Editar
              </Button>
              {room.active ? (
                <Button variant="outlined" color="warning" onClick={() => onInactivate(room.id)} disabled={loading}>
                  Inativar
                </Button>
              ) : null}
              <Button variant="outlined" color="error" onClick={() => onDelete(room.id)} disabled={loading}>
                Excluir
              </Button>
            </Box>
          </Box>
        ))
      )}
    </BaseCard>
  );
}

