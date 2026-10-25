import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { attendanceApi } from "../../../services/attendanceApi";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CampoSelecao, CampoTexto } from "../../ui/campos";
import { DataTable } from "../../ui/data-table";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "aguardando", label: "Aguardando" },
  { value: "chamada", label: "Chamada" },
  { value: "em_atendimento", label: "Em Atendimento" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "nao_compareceu", label: "Nao Compareceu" },
];

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
      setError(e?.response?.data?.message || "Não foi possível carregar atendimentos.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([loadBaseData(), loadTickets()]).catch(() => {
      setError("Não foi possível carregar os filtros iniciais.");
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
        map.set(String(user.id), { id: user.id, name: user.name || `Usuário #${user.id}` });
      }
    });

    const options = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (filters.assignedUserId && !map.has(String(filters.assignedUserId))) {
      options.unshift({ id: filters.assignedUserId, name: `Usuário #${filters.assignedUserId}` });
    }
    return options;
  }, [tickets, filters.assignedUserId]);

  const colunas = [
    { chave: "senha", titulo: "Senha", render: (item) => item.display_code },
    { chave: "cliente", titulo: "Cliente", render: (item) => item.client?.name || `Cliente #${item.client_id}` },
    { chave: "sala", titulo: "Sala", render: (item) => item.room?.name || "-" },
    { chave: "atendente", titulo: "Atendente", render: (item) => item.assigned_user?.name || "-" },
    { chave: "status", titulo: "Status", render: (item) => item.status },
    { chave: "data", titulo: "Data/Hora", render: (item) => formatDateTime(item.finished_at || item.started_at || item.called_at || item.issued_at) },
    {
      chave: "acao",
      titulo: "Ação",
      render: (item) => (
        <Button variant="outline" size="sm" onClick={() => router.push(`/attendance/service/${item.id}`)}>
          Visualizar
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atendimentos Realizados</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <CampoTexto id="hist-inicio" label="Data Inicial" type="date" value={filters.serviceFrom} onChange={(e) => onChangeFilter("serviceFrom", e.target.value)} />
          <CampoTexto id="hist-fim" label="Data Final" type="date" value={filters.serviceTo} onChange={(e) => onChangeFilter("serviceTo", e.target.value)} />
          <CampoSelecao id="hist-sala" label="Sala" value={filters.roomId} onChange={(e) => onChangeFilter("roomId", e.target.value)} className="min-w-[200px]">
            <option value="">Todas</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </CampoSelecao>
          <CampoSelecao id="hist-usuario" label="Usuário" value={filters.assignedUserId} onChange={(e) => onChangeFilter("assignedUserId", e.target.value)} className="min-w-[220px]">
            <option value="">Todos</option>
            {attendantOptions.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </CampoSelecao>
          <CampoSelecao id="hist-status" label="Status" value={filters.status} onChange={(e) => onChangeFilter("status", e.target.value)} className="min-w-[180px]">
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value || "all"} value={status.value}>{status.label}</option>
            ))}
          </CampoSelecao>
          <Button onClick={onSearch} disabled={loading}>
            {loading ? "Buscando..." : "Filtrar"}
          </Button>
        </div>

        {error ? <Banner tom="perigo">{error}</Banner> : null}

        <DataTable
          rotulo="atendimentos realizados"
          colunas={colunas}
          linhas={tickets}
          chaveDaLinha={(item) => item.id}
          vazio="Nenhum atendimento encontrado para os filtros informados."
        />
      </CardContent>
    </Card>
  );
}
