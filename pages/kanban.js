import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BaseCard from "../src/components/baseCard/BaseCard";
import { api } from "../src/services/api";

const BOARD_COLUMNS = [
  { value: "novo", label: "Novo", color: "info" },
  { value: "recebido", label: "Recebido", color: "primary" },
  { value: "encaminhado", label: "Encaminhado", color: "secondary" },
  { value: "em_andamento", label: "Em andamento", color: "warning" },
  { value: "aguardando_resposta", label: "Aguardando resposta", color: "warning" },
  { value: "reaberto", label: "Reaberto", color: "info" },
  { value: "concluido", label: "Concluído", color: "success" },
  { value: "encerrado", label: "Encerrado", color: "default" },
  { value: "cancelado", label: "Cancelado", color: "error" },
  { value: "vencido", label: "Vencido", color: "error" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Todas as prioridades" },
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const normalizeStatus = (status) => {
  const value = String(status || "").trim().toLowerCase();
  if (value === "analise") return "em_andamento";
  return value;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (_) {
    return value;
  }
};

const fieldStyle = {
  width: "100%",
  background: "var(--lg-glass-input)",
  borderRadius: 12,
};

function KanbanCard({ protocol, onOpen }) {
  const status = BOARD_COLUMNS.find((item) => item.value === normalizeStatus(protocol.status)) || BOARD_COLUMNS[0];

  return (
    <Box
      onClick={() => onOpen(protocol.id)}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid var(--lg-border)",
        bgcolor: "var(--lg-glass-panel)",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(var(--lg-accent-rgb),0.42)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
            {protocol.numero}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, lineHeight: 1.3 }}>
            {protocol.assunto}
          </Typography>
        </Box>
        <Chip size="small" color={status.color} label={status.label} />
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {protocol.solicitante_nome || "Sem solicitante"}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {protocol.origem_unit?.nome || "Origem não informada"} → {protocol.destino_unit?.nome || "Destino não informado"}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        Atualizado em {formatDateTime(protocol.updated_at)}
      </Typography>
    </Box>
  );
}

export default function KanbanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [protocols, setProtocols] = useState([]);

  const loadProtocols = useCallback(async () => {
    setRefreshing(true);
    setMessage("");

    try {
      const all = [];
      let page = 1;
      let lastPage = 1;

      do {
        const { data } = await api.get("/protocolos", {
          params: {
            per_page: 100,
            page,
          },
        });

        all.push(...(Array.isArray(data?.data) ? data.data : []));
        lastPage = Number(data?.last_page || 1);
        page += 1;
      } while (page <= lastPage);

      setProtocols(all);
    } catch (error) {
      setProtocols([]);
      setMessage(error?.response?.data?.message || "Não foi possível carregar o kanban.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProtocols();
  }, [loadProtocols]);

  const filteredProtocols = useMemo(() => {
    const term = search.trim().toLowerCase();

    return protocols.filter((protocol) => {
      const matchesSearch =
        !term ||
        [protocol.numero, protocol.assunto, protocol.solicitante_nome, protocol.solicitante_documento]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      const matchesPriority = !priorityFilter || String(protocol.prioridade || "").toLowerCase() === priorityFilter;
      const matchesStatus = !statusFilter || normalizeStatus(protocol.status) === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [protocols, search, priorityFilter, statusFilter]);

  const columns = useMemo(() => {
    return BOARD_COLUMNS.map((column) => ({
      ...column,
      items: filteredProtocols
        .filter((protocol) => normalizeStatus(protocol.status) === column.value)
        .sort((a, b) => {
          const left = new Date(b.updated_at || b.created_at || 0).getTime();
          const right = new Date(a.updated_at || a.created_at || 0).getTime();
          return left - right;
        }),
    }));
  }, [filteredProtocols]);

  const totals = useMemo(() => {
    return BOARD_COLUMNS.reduce(
      (acc, column) => {
        acc.total += columns.find((item) => item.value === column.value)?.items.length || 0;
        return acc;
      },
      { total: 0 }
    );
  }, [columns]);

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto", p: { xs: 2, md: 3 }, color: "var(--lg-text-primary)" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Kanban Geral
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Acompanhe os protocolos em fluxo visual. Eles também podem ser abertos a partir daqui.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
          <Button variant="outlined" onClick={() => router.push("/protocolo/caixa-entrada")}>
            Caixa de Entrada
          </Button>
          <Button variant="contained" onClick={() => router.push("/protocolo/novo")}>
            Novo Protocolo
          </Button>
          <Button variant="text" onClick={loadProtocols} disabled={refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </Stack>
      </Stack>

      {message ? (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid rgba(220,38,38,.25)",
            bgcolor: "rgba(220,38,38,.08)",
            color: "var(--danger)",
          }}
        >
          {message}
        </Box>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <BaseCard title="Total de protocolos">
            <Typography variant="h3" sx={{ fontWeight: 900 }}>
              {totals.total}
            </Typography>
          </BaseCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <BaseCard title="Com visualização">
            <Typography variant="h3" sx={{ fontWeight: 900 }}>
              {protocols.filter((item) => Array.isArray(item.visualizations) && item.visualizations.length > 0).length}
            </Typography>
          </BaseCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <BaseCard title="Pendentes">
            <Typography variant="h3" sx={{ fontWeight: 900 }}>
              {protocols.filter((item) => !["concluido", "encerrado", "cancelado"].includes(normalizeStatus(item.status))).length}
            </Typography>
          </BaseCard>
        </Grid>
      </Grid>

      <BaseCard title="Filtros">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Pesquisar protocolo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={fieldStyle}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <MenuItem value="">Todos os status</MenuItem>
              {BOARD_COLUMNS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Prioridade</InputLabel>
            <Select
              label="Prioridade"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <MenuItem key={priority.value || "all"} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </BaseCard>

      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Carregando kanban...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 3, overflowX: "auto", pb: 1 }}>
          <Stack direction="row" spacing={2} sx={{ minWidth: 1400, alignItems: "flex-start" }}>
            {columns.map((column) => (
              <Box
                key={column.value}
                sx={{
                  flex: "0 0 280px",
                  borderRadius: 3,
                  border: "1px solid var(--lg-border)",
                  bgcolor: "var(--lg-glass-panel)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid var(--lg-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {column.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {column.items.length} protocolos
                    </Typography>
                  </Box>
                  <Chip size="small" color={column.color} label={column.label} />
                </Box>

                <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.25, minHeight: 240 }}>
                  {column.items.length > 0 ? (
                    column.items.map((protocol) => (
                      <KanbanCard
                        key={protocol.id}
                        protocol={protocol}
                        onOpen={(id) => router.push(`/protocolo/${id}`)}
                      />
                    ))
                  ) : (
                    <Box
                      sx={{
                        p: 2,
                        border: "1px dashed var(--lg-border)",
                        borderRadius: 2,
                        color: "text.secondary",
                        textAlign: "center",
                      }}
                    >
                      Nenhum protocolo nesta etapa.
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
