import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  { value: "em_andamento", label: "Em andamento", color: "warning" },
  { value: "aguardando_resposta", label: "Aguardando resposta", color: "warning" },
  { value: "bloqueado", label: "Bloqueado", color: "error" },
  { value: "concluido", label: "Concluido", color: "success" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Todas as prioridades" },
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando_resposta", label: "Aguardando resposta" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "concluido", label: "Concluido" },
];

const INITIAL_FORM = {
  titulo: "",
  descricao: "",
  status: "novo",
  prioridade: "normal",
  vencimento: "",
  ordem: 0,
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

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const fieldStyle = {
  width: "100%",
  background: "var(--lg-glass-input)",
  borderRadius: 12,
};

function KanbanCard({ item, onOpen }) {
  const column = BOARD_COLUMNS.find((entry) => entry.value === String(item.status || "").toLowerCase()) || BOARD_COLUMNS[0];

  return (
    <Box
      onClick={() => onOpen(item)}
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
            {item.titulo}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.35, color: "text.secondary" }}>
            {item.descricao || "Sem descricao"}
          </Typography>
        </Box>
        <Chip size="small" color={column.color} label={column.label} />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
        <Chip size="small" variant="outlined" label={`Prioridade: ${item.prioridade || "normal"}`} />
        {item.protocol ? <Chip size="small" color="success" label={item.protocol.numero} /> : null}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Atualizado em {formatDateTime(item.updated_at)}
      </Typography>
    </Box>
  );
}

function TaskDialog({ open, onClose, onSave, onDelete, item, saving }) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!open) return;
    setForm({
      titulo: item?.titulo || "",
      descricao: item?.descricao || "",
      status: item?.status || "novo",
      prioridade: item?.prioridade || "normal",
      vencimento: formatDate(item?.vencimento),
      ordem: Number(item?.ordem || 0),
    });
  }, [open, item]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      ordem: Number(form.ordem || 0),
      vencimento: form.vencimento || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{item ? "Editar item do kanban" : "Novo item do kanban"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Titulo"
            value={form.titulo}
            onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
            required
            fullWidth
            sx={fieldStyle}
          />
          <TextField
            label="Descricao"
            value={form.descricao}
            onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
            fullWidth
            multiline
            minRows={3}
            sx={fieldStyle}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                label="Prioridade"
                value={form.prioridade}
                onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value }))}
              >
                {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              type="date"
              label="Vencimento"
              value={form.vencimento}
              onChange={(event) => setForm((current) => ({ ...current, vencimento: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={fieldStyle}
            />
            <TextField
              type="number"
              label="Ordem"
              value={form.ordem}
              onChange={(event) => setForm((current) => ({ ...current, ordem: event.target.value }))}
              fullWidth
              sx={fieldStyle}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {item ? (
            <Button color="error" onClick={() => onDelete(item)} disabled={saving}>
              Excluir
            </Button>
          ) : null}
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function KanbanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadItems = useCallback(async () => {
    setRefreshing(true);
    setMessage("");

    try {
      const { data } = await api.get("/kanban");
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
      setMessage(error?.response?.data?.message || "Nao foi possivel carregar o kanban.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !term ||
        [item.titulo, item.descricao, item.protocol?.numero, item.protocol?.assunto]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      const matchesPriority = !priorityFilter || String(item.prioridade || "").toLowerCase() === priorityFilter;
      const matchesStatus = !statusFilter || String(item.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [items, search, priorityFilter, statusFilter]);

  const columns = useMemo(() => {
    return BOARD_COLUMNS.map((column) => ({
      ...column,
      items: filteredItems
        .filter((item) => String(item.status || "").toLowerCase() === column.value)
        .sort((a, b) => {
          const left = new Date(b.updated_at || b.created_at || 0).getTime();
          const right = new Date(a.updated_at || a.created_at || 0).getTime();
          return left - right;
        }),
    }));
  }, [filteredItems]);

  const totals = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc.total += column.items.length;
        return acc;
      },
      { total: 0 }
    );
  }, [columns]);

  const openCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const saveItem = async (payload) => {
    setSaving(true);
    try {
      if (editingItem?.id) {
        await api.put(`/kanban/${editingItem.id}`, payload);
      } else {
        await api.post("/kanban", payload);
      }
      await loadItems();
      closeDialog();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Nao foi possivel salvar o item.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    if (!item?.id) return;
    if (!window.confirm("Deseja excluir este item do kanban?")) return;

    setSaving(true);
    try {
      await api.delete(`/kanban/${item.id}`);
      await loadItems();
      closeDialog();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Nao foi possivel excluir o item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto", p: { xs: 2, md: 3 }, color: "var(--lg-text-primary)" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Kanban Geral
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Quadro independente para acompanhamento operacional. Vinculos com protocolo sao opcionais e explicitos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
          <Button variant="outlined" onClick={() => router.push("/protocolo/caixa-entrada")}>
            Caixa de Entrada
          </Button>
          <Button variant="contained" onClick={openCreate}>
            Novo Item
          </Button>
          <Button variant="text" onClick={loadItems} disabled={refreshing}>
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
        <Grid item xs={12} md={6}>
          <BaseCard title="Total de itens">
            <Typography variant="h3" sx={{ fontWeight: 900 }}>
              {totals.total}
            </Typography>
          </BaseCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <BaseCard title="Em andamento">
            <Typography variant="h3" sx={{ fontWeight: 900 }}>
              {items.filter((item) => String(item.status || "").toLowerCase() === "em_andamento").length}
            </Typography>
          </BaseCard>
        </Grid>
      </Grid>

      <BaseCard title="Filtros">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Pesquisar item"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={fieldStyle}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
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
                    p: 1.5,
                    borderBottom: "1px solid var(--lg-border)",
                    bgcolor: "rgba(var(--lg-accent-rgb), 0.08)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {column.label}
                    </Typography>
                    <Chip size="small" color={column.color} label={`${column.items.length}`} />
                  </Stack>
                </Box>
                <Box sx={{ p: 1.5, display: "grid", gap: 1.25, minHeight: 320 }}>
                  {column.items.length ? (
                    column.items.map((item) => <KanbanCard key={item.id} item={item} onOpen={openEdit} />)
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Nenhum item nesta etapa.
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      <TaskDialog open={dialogOpen} item={editingItem} onClose={closeDialog} onSave={saveItem} onDelete={deleteItem} saving={saving} />
    </Box>
  );
}
