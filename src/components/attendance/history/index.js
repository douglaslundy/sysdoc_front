import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import BaseCard from "../../baseCard/BaseCard";
import { attendanceApi } from "../../../services/attendanceApi";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "aguardando", label: "Aguardando" },
  { value: "chamada", label: "Chamada" },
  { value: "em_atendimento", label: "Em Atendimento" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "nao_compareceu", label: "Nao Compareceu" },
];

export default function AttendanceHistory() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    serviceFrom: "",
    serviceTo: "",
    roomId: "",
    assignedUserId: "",
    status: "finalizada",
  });

  const loadBaseData = async () => {
    const roomsRes = await attendanceApi.listRoomsAdmin();
    setRooms(roomsRes.data || []);
  };

  const loadTickets = async (currentFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (currentFilters.serviceFrom) params.serviceFrom = currentFilters.serviceFrom;
      if (currentFilters.serviceTo) params.serviceTo = currentFilters.serviceTo;
      if (currentFilters.roomId) params.roomId = Number(currentFilters.roomId);
      if (currentFilters.assignedUserId) params.assignedUserId = Number(currentFilters.assignedUserId);
      if (currentFilters.status) params.status = currentFilters.status;

      const { data } = await attendanceApi.listTickets(params);
      setTickets(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Nao foi possivel carregar atendimentos.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([loadBaseData(), loadTickets()]).catch(() => {
      setError("Nao foi possivel carregar os filtros iniciais.");
    });
  }, []);

  const onChangeFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const onSearch = async () => {
    await loadTickets(filters);
  };

  const attendantOptions = useMemo(() => {
    const map = new Map();
    tickets.forEach((ticket) => {
      const user = ticket.assigned_user;
      if (user?.id) {
        map.set(String(user.id), { id: user.id, name: user.name || `Usuario #${user.id}` });
      }
    });

    const options = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (filters.assignedUserId && !map.has(String(filters.assignedUserId))) {
      options.unshift({ id: filters.assignedUserId, name: `Usuario #${filters.assignedUserId}` });
    }
    return options;
  }, [tickets, filters.assignedUserId]);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <BaseCard title="Atendimentos Realizados">
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <TextField
          label="Data Inicial"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.serviceFrom}
          onChange={(e) => onChangeFilter("serviceFrom", e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Data Final"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.serviceTo}
          onChange={(e) => onChangeFilter("serviceTo", e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <TextField
          select
          label="Sala"
          value={filters.roomId}
          onChange={(e) => onChangeFilter("roomId", e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {rooms.map((room) => (
            <MenuItem key={room.id} value={room.id}>
              {room.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Usuario"
          value={filters.assignedUserId}
          onChange={(e) => onChangeFilter("assignedUserId", e.target.value)}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {attendantOptions.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(e) => onChangeFilter("status", e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {STATUS_OPTIONS.map((status) => (
            <MenuItem key={status.value || "all"} value={status.value}>
              {status.label}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={onSearch} disabled={loading}>
          {loading ? "Buscando..." : "Filtrar"}
        </Button>
      </Box>

      {error ? <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> : null}

      {tickets.length === 0 ? (
        <Typography>Nenhum atendimento encontrado para os filtros informados.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Senha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Sala</TableCell>
              <TableCell>Atendente</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data/Hora</TableCell>
              <TableCell align="right">Acao</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.display_code}</TableCell>
                <TableCell>{item.client?.name || `Cliente #${item.client_id}`}</TableCell>
                <TableCell>{item.room?.name || "-"}</TableCell>
                <TableCell>{item.assigned_user?.name || "-"}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{formatDateTime(item.finished_at || item.started_at || item.called_at || item.issued_at)}</TableCell>
                <TableCell align="right">
                  <Button variant="outlined" onClick={() => router.push(`/attendance/service/${item.id}`)}>
                    Visualizar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </BaseCard>
  );
}
