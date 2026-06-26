import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BaseCard from "../../src/components/baseCard/BaseCard";
import { modalFormRootSx } from "../../src/components/modal/_shared/modalFormStyles";
import { api } from "../../src/services/api";

const emptyForm = {
  codigo: "",
  nome: "",
  descricao: "",
  ordem: 0,
  ativo: true,
};

export default function ProtocolTypesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/protocolos/tipos");
      setTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage("Não foi possível carregar os tipos de protocolo.");
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      codigo: item.codigo || "",
      nome: item.nome || "",
      descricao: item.descricao || "",
      ordem: Number(item.ordem ?? 0),
      ativo: Boolean(item.ativo),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.put(`/protocolos/tipos/${editingId}`, form);
        setMessage("Tipo atualizado com sucesso.");
      } else {
        await api.post("/protocolos/tipos", form);
        setMessage("Tipo cadastrado com sucesso.");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadTypes();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível salvar o tipo de protocolo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Inativar o tipo "${item.nome}"?`)) return;
    setSaving(true);
    setMessage("");
    try {
      await api.delete(`/protocolos/tipos/${item.id}`);
      setMessage("Tipo inativado com sucesso.");
      await loadTypes();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível inativar o tipo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ ...modalFormRootSx, display: "flex", flexDirection: "column", gap: 3 }} className="queue-page protocolo-page">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Tipos de Protocolo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cadastre os tipos usados no campo tipo do novo protocolo.
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate}>
          Novo tipo
        </Button>
      </Stack>

      {message ? (
        <Alert severity={message.toLowerCase().includes("não foi") ? "error" : "success"} onClose={() => setMessage("")}>
          {message}
        </Alert>
      ) : null}

      <BaseCard title="Tipos cadastrados">
        {loading ? (
          <Typography color="text.secondary">Carregando...</Typography>
        ) : (
          <Table sx={{ whiteSpace: "nowrap" }}>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Ordem</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {types.length > 0 ? types.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.codigo}</TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.descricao || "—"}</TableCell>
                  <TableCell>{item.ordem ?? 0}</TableCell>
                  <TableCell>
                    <Chip size="small" color={item.ativo ? "success" : "default"} label={item.ativo ? "Ativo" : "Inativo"} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="outlined" onClick={() => openEdit(item)}>
                        Editar
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(item)} disabled={saving || !item.ativo}>
                        Inativar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">Nenhum tipo cadastrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </BaseCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Editar tipo" : "Novo tipo"}</DialogTitle>
        <DialogContent sx={{ ...modalFormRootSx, pt: 1 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código"
                  value={form.codigo}
                  onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ordem"
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm((prev) => ({ ...prev, ordem: Number(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={form.nome}
                  onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Descrição"
                  value={form.descricao}
                  onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch
                    checked={Boolean(form.ativo)}
                    onChange={(e) => setForm((prev) => ({ ...prev, ativo: e.target.checked }))}
                  />
                  <Typography variant="body2">Ativo</Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
