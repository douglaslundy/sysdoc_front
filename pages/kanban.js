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
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  modalFormRootSx,
  modalShellSx,
} from "../src/components/modal/_shared/modalFormStyles";
import { api } from "../src/services/api";

const BOARD_COLUMNS = [
  { value: "novo", label: "Novo", color: "info" },
  { value: "em_andamento", label: "Em andamento", color: "warning" },
  { value: "aguardando_resposta", label: "Aguardando resposta", color: "warning" },
  { value: "bloqueado", label: "Bloqueado", color: "error" },
  { value: "concluido", label: "Concluído", color: "success" },
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
  { value: "concluido", label: "Concluído" },
];

const INITIAL_FORM = {
  titulo: "",
  descricao: "",
  status: "novo",
  prioridade: "normal",
  visibility: "public",
  vencimento: "",
  ordem: 0,
};

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Público" },
  { value: "private", label: "Privado" },
];

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

const formatHistoryText = (value) => {
  const readable = String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : "Ação";
};

const fieldStyle = {
  width: "100%",
  background: "var(--lg-glass-input)",
  borderRadius: 12,
};

const selectStyle = {
  minWidth: 130,
  "& .MuiOutlinedInput-root": {
    color: "var(--lg-text-primary)",
    background: "var(--lg-glass-input)",
    borderRadius: 1.5,
    "& fieldset": { borderColor: "var(--lg-border-input)" },
    "&:hover fieldset": { borderColor: "var(--lg-border-input-focus)" },
    "&.Mui-focused fieldset": {
      borderColor: "var(--lg-border-input-focus)",
      boxShadow: "var(--lg-focus-ring)",
    },
  },
  "& .MuiInputLabel-root": { color: "var(--lg-text-secondary)" },
  "& .MuiSvgIcon-root": { color: "var(--lg-text-secondary)" },
  "& .MuiSelect-select": {
    color: "var(--lg-text-primary)",
    WebkitTextFillColor: "var(--lg-text-primary)",
  },
};

const toolbarButtonSx = {
  minHeight: 40,
  height: 40,
  px: 2,
  borderRadius: 1.5,
  whiteSpace: "nowrap",
};

const boardColumnSx = {
  minWidth: 0,
  borderRadius: 3,
  border: "1px solid rgba(var(--lg-accent-rgb), 0.28)",
  background: (theme) =>
    theme.palette.mode === "light"
      ? "radial-gradient(860px 340px at 16% 0%, rgba(var(--lg-accent-rgb), 0.12), transparent 70%), linear-gradient(140deg, rgba(255, 255, 255, 0.90), rgba(242, 247, 255, 0.86))"
      : "radial-gradient(860px 340px at 16% 0%, rgba(var(--lg-accent-rgb), 0.12), transparent 70%), linear-gradient(140deg, rgba(4, 16, 50, 0.97), rgba(3, 11, 36, 0.96))",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 0 0 1px rgba(var(--lg-accent-rgb), 0.08) inset, 0 0 16px rgba(var(--lg-accent-rgb), 0.12), 0 14px 30px rgba(37, 99, 235, 0.14)"
      : "0 0 0 1px rgba(var(--lg-accent-rgb), 0.09) inset, 0 0 22px rgba(var(--lg-accent-rgb), 0.14), 0 20px 46px rgba(2, 8, 27, 0.60)",
  overflow: "hidden",
};

const boardCardSx = {
  borderRadius: 2,
  border: "1px solid var(--lg-border)",
  background: (theme) =>
    theme.palette.mode === "light"
      ? "radial-gradient(520px 220px at 16% 0%, rgba(var(--lg-accent-rgb), 0.12), transparent 70%), linear-gradient(140deg, rgba(255, 255, 255, 0.90), rgba(242, 247, 255, 0.86))"
      : "radial-gradient(520px 220px at 16% 0%, rgba(var(--lg-accent-rgb), 0.10), transparent 70%), linear-gradient(140deg, rgba(4, 16, 50, 0.88), rgba(3, 11, 36, 0.84))",
  boxShadow: (theme) =>
    theme.palette.mode === "light"
      ? "0 0 0 1px rgba(var(--lg-accent-rgb), 0.08) inset, 0 0 16px rgba(var(--lg-accent-rgb), 0.10), 0 14px 30px rgba(37, 99, 235, 0.12)"
      : "0 0 0 1px rgba(var(--lg-accent-rgb), 0.09) inset, 0 0 18px rgba(var(--lg-accent-rgb), 0.12), 0 18px 36px rgba(2, 8, 27, 0.36)",
};

const flattenUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).flatMap((item) => [
    { ...item, level },
    ...flattenUnits(item.children, level + 1),
  ]);

function KanbanCard({ item, onOpen, onDragStart, dragging }) {
  const column = BOARD_COLUMNS.find((entry) => entry.value === String(item.status || "").toLowerCase()) || BOARD_COLUMNS[0];

  return (
    <Box
      draggable
      onDragStart={(event) => onDragStart(event, item)}
      onClick={() => onOpen(item)}
      sx={{
        p: 1.5,
        ...boardCardSx,
        cursor: dragging ? "grabbing" : "grab",
        opacity: dragging ? 0.55 : 1,
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          background: (theme) =>
            theme.palette.mode === "light"
              ? "radial-gradient(520px 220px at 16% 0%, rgba(var(--lg-accent-rgb), 0.16), transparent 70%), linear-gradient(140deg, rgba(255, 255, 255, 0.94), rgba(236, 245, 255, 0.92))"
              : "radial-gradient(520px 220px at 16% 0%, rgba(var(--lg-accent-rgb), 0.14), transparent 70%), linear-gradient(140deg, rgba(6, 19, 58, 0.92), rgba(4, 14, 42, 0.90))",
          borderColor: "rgba(var(--lg-accent-rgb),0.32)",
          boxShadow: (theme) =>
            theme.palette.mode === "light"
              ? "0 0 0 1px rgba(var(--lg-accent-rgb), 0.10) inset, 0 0 18px rgba(var(--lg-accent-rgb), 0.12), 0 16px 32px rgba(37, 99, 235, 0.14)"
              : "0 0 0 1px rgba(var(--lg-accent-rgb), 0.12) inset, 0 0 22px rgba(var(--lg-accent-rgb), 0.16), 0 20px 40px rgba(2, 8, 27, 0.40)",
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Chip
          size="small"
          color={column.color}
          label={column.label}
          sx={{
            mb: 1,
            maxWidth: "100%",
            "& .MuiChip-label": {
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
        <Chip
          size="small"
          variant="outlined"
          label={item.visibility === "private" ? "Privado" : "Público"}
          sx={{ mb: 1, ml: 1 }}
        />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.25, overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {item.titulo}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.35, color: "text.secondary", overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {item.descricao || "Sem descrição"}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 1, minWidth: 0 }} flexWrap="wrap" useFlexGap>
        <Chip
          size="small"
          variant="outlined"
          label={`Prioridade: ${item.prioridade || "normal"}`}
          sx={{
            maxWidth: "100%",
            "& .MuiChip-label": {
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
        {item.protocol ? (
          <Chip
            size="small"
            color="success"
            label={item.protocol.numero}
            sx={{
              maxWidth: "100%",
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        ) : null}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Atualizado em {formatDateTime(item.updated_at)}
      </Typography>
    </Box>
  );
}

function TaskDialog({ open, onClose, onSave, onDelete, item, saving, initialStatus }) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!open) return;
    setForm({
      titulo: item?.titulo || "",
      descricao: item?.descricao || "",
      status: item?.status || initialStatus || "novo",
      prioridade: item?.prioridade || "normal",
      visibility: item?.visibility || "public",
      vencimento: formatDate(item?.vencimento),
      ordem: Number(item?.ordem || 0),
    });
  }, [open, item, initialStatus]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      ordem: Number(form.ordem || 0),
      vencimento: form.vencimento || null,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className: "kanban-modal-shell",
        sx: {
          ...modalShellSx,
          ...modalFormRootSx,
          position: "relative",
          transform: "none",
          inset: "auto",
        },
      }}
    >
      <DialogTitle>{item ? "Editar item do kanban" : "Novo item do kanban"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Título"
            value={form.titulo}
            onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
            required
            fullWidth
            sx={fieldStyle}
          />
          <TextField
            label="Descrição"
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
          <FormControl fullWidth>
            <InputLabel>Visibilidade</InputLabel>
            <Select
              label="Visibilidade"
              value={form.visibility}
              onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

function ProtocolDialog({ open, item, onClose, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [protocol, setProtocol] = useState(null);
  const [types, setTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    if (!open || !item?.protocol_id) return;
    setLoading(true);
    setMessage("");
    try {
      const [protocolRes, typesRes, usersRes, unitsRes] = await Promise.all([
        api.get(`/protocolos/${item.protocol_id}`),
        api.get("/protocolos/tipos"),
        api.get("/users"),
        api.get("/protocolos/unidades-organizacionais"),
      ]);
      const data = protocolRes.data;
      setProtocol(data);
      setTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setUnits(flattenUnits(unitsRes.data));
      setForm({
        assunto: data.assunto || "",
        descricao: data.descricao || "",
        tipo: data.tipo || "",
        prioridade: data.prioridade || "normal",
        destino_unit_id: data.destino_unit_id || "",
        destino_user_id: data.responsavel_atual_id || "",
        prazo_atendimento: formatDate(data.prazo_atendimento),
        kanban_status: item.status || "novo",
      });
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível carregar o protocolo.");
    } finally {
      setLoading(false);
    }
  }, [open, item]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/protocolos/${item.protocol_id}`, {
        assunto: form.assunto,
        descricao: form.descricao || null,
        tipo: form.tipo,
        prioridade: form.prioridade,
        destino_unit_id: form.destino_unit_id || null,
        destino_user_id: form.destino_user_id || null,
        prazo_atendimento: form.prazo_atendimento || null,
      });

      if (form.kanban_status !== item.status) {
        await api.post(`/protocolos/${item.protocol_id}/kanban-status`, {
          kanban_status: form.kanban_status,
          observacao: "Movimentação realizada pelo Kanban.",
        });
      }

      await onChanged();
      onClose();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível atualizar o protocolo.");
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = async (attachment) => {
    try {
      const response = await api.get(`/protocolos/anexos/${attachment.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.nome_original || "anexo";
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível baixar o anexo.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { ...modalShellSx, ...modalFormRootSx, position: "relative", transform: "none", inset: "auto" },
      }}
    >
      <DialogTitle>{protocol ? `${protocol.numero} - ${protocol.assunto}` : "Protocolo"}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {message && <Typography color="error">{message}</Typography>}
            <TextField fullWidth label="Assunto" value={form.assunto || ""} onChange={(event) => setForm((current) => ({ ...current, assunto: event.target.value }))} />
            <TextField fullWidth multiline minRows={3} label="Descrição" value={form.descricao || ""} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={form.tipo || ""} label="Tipo" onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))}>
                    {types.filter((type) => type.ativo !== false).map((type) => <MenuItem key={type.id} value={type.codigo}>{type.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Prioridade</InputLabel>
                  <Select value={form.prioridade || "normal"} label="Prioridade" onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value }))}>
                    {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="date" label="Prazo" InputLabelProps={{ shrink: true }} value={form.prazo_atendimento || ""} onChange={(event) => setForm((current) => ({ ...current, prazo_atendimento: event.target.value }))} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Unidade de destino</InputLabel>
                  <Select value={form.destino_unit_id || ""} label="Unidade de destino" onChange={(event) => setForm((current) => ({ ...current, destino_unit_id: event.target.value }))}>
                    <MenuItem value="">Sem unidade</MenuItem>
                    {units.filter((unit) => unit.ativo !== false).map((unit) => <MenuItem key={unit.id} value={unit.id}>{`${"— ".repeat(unit.level || 0)}${unit.nome}`}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Responsável</InputLabel>
                  <Select value={form.destino_user_id || ""} label="Responsável" onChange={(event) => setForm((current) => ({ ...current, destino_user_id: event.target.value }))}>
                    <MenuItem value="">Sem responsável</MenuItem>
                    {users.map((user) => <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Etapa no Kanban</InputLabel>
                  <Select value={form.kanban_status || "novo"} label="Etapa no Kanban" onChange={(event) => setForm((current) => ({ ...current, kanban_status: event.target.value }))}>
                    {STATUS_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><Typography variant="caption">Solicitante</Typography><Typography>{protocol?.solicitante_nome || "—"}</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="caption">Origem</Typography><Typography>{protocol?.origem_unit?.nome || "—"}</Typography></Grid>
              <Grid item xs={12} md={4}><Typography variant="caption">Status do protocolo</Typography><Typography>{protocol?.status || "—"}</Typography></Grid>
            </Grid>

            <Typography variant="h6">Histórico</Typography>
            <Stack divider={<Divider />}>
              {(protocol?.movements || []).slice().reverse().map((movement) => (
                <Box key={movement.id} py={1}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                    {formatHistoryText(movement.acao)}
                  </Typography>
                  <Typography sx={{ fontSize: "0.65rem" }}>{movement.user?.name || "Sistema"} · {formatDateTime(movement.created_at)}</Typography>
                  {movement.observacao && <Typography color="text.secondary" sx={{ fontSize: "0.65rem" }}>{movement.observacao}</Typography>}
                </Box>
              ))}
            </Stack>

            <Typography variant="h6">Comentários</Typography>
            {(protocol?.comments || []).length ? (
              <Stack divider={<Divider />}>
                {protocol.comments.map((comment) => (
                  <Box key={comment.id} py={1}>
                    <Typography>{comment.conteudo}</Typography>
                    <Typography variant="body2" color="text.secondary">{comment.user?.name || "Sistema"} · {formatDateTime(comment.created_at)}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">Sem comentários.</Typography>}

            <Typography variant="h6">Anexos</Typography>
            {(protocol?.attachments || []).length ? (
              <Stack spacing={1}>
                {protocol.attachments.map((attachment) => (
                  <Box key={attachment.id} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <Typography variant="body2">{attachment.nome_original}</Typography>
                    <Button size="small" variant="outlined" onClick={() => downloadAttachment(attachment)}>Baixar</Button>
                  </Box>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">Sem anexos.</Typography>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={loading || saving}>{saving ? "Salvando..." : "Salvar e movimentar"}</Button>
      </DialogActions>
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
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [createStatus, setCreateStatus] = useState("novo");
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState("");

  const loadItems = useCallback(async () => {
    setRefreshing(true);
    setMessage("");

    try {
      const { data } = await api.get("/kanban");
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
      setMessage(error?.response?.data?.message || "Não foi possível carregar o kanban.");
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

  const openCreate = (status = "novo") => {
    setEditingItem(null);
    setCreateStatus(status);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    if (item?.protocol_id) {
      setEditingItem(item);
      setProtocolDialogOpen(true);
      return;
    }
    setEditingItem(item);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const closeProtocolDialog = () => {
    setProtocolDialogOpen(false);
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
      setMessage(error?.response?.data?.message || "Não foi possível salvar o item.");
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
      setMessage(error?.response?.data?.message || "Não foi possível excluir o item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event, item) => {
    setDraggedItemId(item.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(item.id));
  };

  const handleDrop = async (event, status) => {
    event.preventDefault();
    const itemId = Number(event.dataTransfer.getData("text/plain") || draggedItemId);
    const item = items.find((entry) => Number(entry.id) === itemId);
    setDraggedItemId(null);
    setDragOverColumn("");
    if (!item || item.status === status) return;

    const previousStatus = item.status;
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, status, updated_at: new Date().toISOString() } : entry
      )
    );
    try {
      const { data } = item.protocol_id
        ? await api.post(`/protocolos/${item.protocol_id}/kanban-status`, {
            kanban_status: status,
            observacao: "Movimentação realizada por arrastar e soltar no Kanban.",
          }).then((response) => ({ data: response.data?.kanban_task || { ...item, status } }))
        : await api.put(`/kanban/${item.id}`, { status });
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? data : entry))
      );
    } catch (error) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: previousStatus } : entry
        )
      );
      setMessage(error?.response?.data?.message || "Não foi possível mover o item.");
    }
  };

  return (
    <Box
      className="queue-page kanban-page"
      sx={{ ...modalFormRootSx, maxWidth: 1600, mx: "auto", p: { xs: 2, md: 3 }, color: "var(--lg-text-primary)" }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3, alignItems: { xs: "stretch", md: "flex-end" } }}
      >
        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`Você possui ${totals.total} itens`}
              sx={{
                fontWeight: 700,
                color: "var(--lg-text-primary)",
                background: "var(--lg-glass-chip)",
                border: "0.5px solid var(--lg-border)",
              }}
            />
          </Stack>
          <Stack
            className="queue-page__toolbar"
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ alignItems: "center", mt: 1.5 }}
          >
            <TextField
              size="small"
              className="lg-search-field kanban-page__search"
              label="Pesquisar item"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{
                ...fieldStyle,
                width: { xs: "100%", sm: 240, md: 260 },
                "& .MuiOutlinedInput-root": {
                  color: "var(--lg-text-primary)",
                  background: "var(--lg-glass-input)",
                  borderRadius: 1.5,
                  "& fieldset": { borderColor: "var(--lg-border-input)" },
                  "&:hover fieldset": { borderColor: "var(--lg-border-input-focus)" },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--lg-border-input-focus)",
                    boxShadow: "var(--lg-focus-ring)",
                  },
                },
                "& .MuiInputLabel-root": { color: "var(--lg-text-secondary)" },
                "& .MuiInputBase-input": {
                  color: "var(--lg-text-primary)",
                  WebkitTextFillColor: "var(--lg-text-primary)",
                },
              }}
            />
            <FormControl size="small" sx={{ ...selectStyle, width: { xs: "100%", sm: 170, md: 180 } }}>
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
            <FormControl size="small" sx={{ ...selectStyle, width: { xs: "100%", sm: 170, md: 180 } }}>
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
        </Box>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="flex-end"
          useFlexGap
          sx={{ alignItems: "center" }}
        >
          <Button size="small" variant="outlined" sx={toolbarButtonSx} onClick={() => router.push("/protocolo/caixa-entrada")}>
            Caixa de Entrada
          </Button>
          <Button size="small" variant="contained" sx={toolbarButtonSx} onClick={() => openCreate("novo")}>
            Novo Item
          </Button>
          <Button size="small" variant="text" sx={toolbarButtonSx} onClick={loadItems} disabled={refreshing}>
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

      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Carregando kanban...
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
            gap: 2,
            alignItems: "flex-start",
          }}
        >
            {columns.map((column) => (
              <Box
                key={column.value}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverColumn(column.value);
                }}
                onDragLeave={() => setDragOverColumn("")}
                onDrop={(event) => handleDrop(event, column.value)}
                sx={{
                  ...boardColumnSx,
                  bgcolor:
                    dragOverColumn === column.value
                      ? "var(--lg-glass-input-focus)"
                      : boardColumnSx.bgcolor,
                  boxShadow:
                    dragOverColumn === column.value
                      ? "var(--lg-focus-ring)"
                      : boardColumnSx.boxShadow,
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderBottom: "1px solid rgba(var(--lg-accent-rgb), 0.22)",
                    background: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(255, 255, 255, 0.50)"
                        : "rgba(4, 16, 50, 0.46)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {column.label}
                    </Typography>
                    <Chip size="small" color={column.color} label={`${column.items.length}`} />
                  </Stack>
                  <Button
                    className="kanban-page__column-add-button"
                    fullWidth
                    size="small"
                    variant="outlined"
                    onClick={() => openCreate(column.value)}
                    sx={{
                      mt: 1,
                      borderColor: "var(--lg-border)",
                      background: "var(--lg-glass-input)",
                      color: "var(--lg-text-primary)",
                      "&:hover": {
                        borderColor: "rgba(var(--lg-accent-rgb),0.3)",
                        background: "var(--queue-row-hover)",
                      },
                    }}
                  >
                    Adicionar tarefa
                  </Button>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    display: "grid",
                    gap: 1.25,
                    minHeight: 320,
                    background: "transparent",
                  }}
                >
                  {column.items.length ? (
                    column.items.map((item) => (
                      <KanbanCard
                        key={item.id}
                        item={item}
                        onOpen={openEdit}
                        onDragStart={handleDragStart}
                        dragging={draggedItemId === item.id}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Nenhum item nesta etapa.
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
        </Box>
      )}

      <TaskDialog
        open={dialogOpen}
        item={editingItem}
        initialStatus={createStatus}
        onClose={closeDialog}
        onSave={saveItem}
        onDelete={deleteItem}
        saving={saving}
      />
      <ProtocolDialog
        open={protocolDialogOpen}
        item={editingItem}
        onClose={closeProtocolDialog}
        onChanged={loadItems}
      />
    </Box>
  );
}
