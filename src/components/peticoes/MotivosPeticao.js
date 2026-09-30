import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../../services/api";

const EMPTY = { nome: "", descricao: "", unit_id: "", ativo: true, ordem: 0 };

const flattenUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    acc.push({ ...item, level });
    if (Array.isArray(item?.children)) acc.push(...flattenUnits(item.children, level + 1));
    return acc;
  }, []);

const errorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0];
  return data?.message || fallback;
};

/**
 * Motivos das petições públicas (denúncia, solicitar vistoria...). Cada motivo aponta a unidade
 * responsável, que recebe o card no kanban.
 */
export default function MotivosPeticao() {
  const [motivos, setMotivos] = useState([]);
  const [units, setUnits] = useState([]);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState(null); // null = fechado; objeto = aberto (com id => edição)
  const [excluir, setExcluir] = useState(null);
  const [saving, setSaving] = useState(false);

  const unitOptions = useMemo(() => flattenUnits(units).filter((unit) => unit.ativo !== false), [units]);

  const load = useCallback(async () => {
    try {
      const [motivosRes, unitsRes] = await Promise.all([
        api.get("/peticao-motivos"),
        api.get("/protocolos/unidades-organizacionais"),
      ]);
      setMotivos(Array.isArray(motivosRes.data) ? motivosRes.data : []);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível carregar os motivos."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => setForm({ ...EMPTY });
  const openEdit = (motivo) =>
    setForm({
      id: motivo.id,
      nome: motivo.nome,
      descricao: motivo.descricao || "",
      unit_id: motivo.unit_id ? String(motivo.unit_id) : "",
      ativo: Boolean(motivo.ativo),
      ordem: motivo.ordem ?? 0,
    });

  const handleSave = async () => {
    setErro("");
    if (!form.nome.trim()) {
      setErro("Informe o nome do motivo.");
      return;
    }
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      unit_id: form.unit_id ? Number(form.unit_id) : null,
      ativo: form.ativo,
      ordem: Number(form.ordem) || 0,
    };

    setSaving(true);
    try {
      if (form.id) await api.put(`/peticao-motivos/${form.id}`, payload);
      else await api.post("/peticao-motivos", payload);
      setForm(null);
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível salvar o motivo."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const motivo = excluir;
    setExcluir(null);
    setErro("");
    try {
      await api.delete(`/peticao-motivos/${motivo.id}`);
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível excluir o motivo."));
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Motivos de petição</Typography>
        <Button variant="contained" onClick={openNew}>Novo motivo</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aparecem no formulário público (/petition). A unidade responsável recebe cada petição como um card no kanban.
      </Typography>

      {erro ? <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert> : null}

      {motivos.length === 0 ? (
        <Typography color="text.secondary">Nenhum motivo cadastrado.</Typography>
      ) : (
        <Stack divider={<Divider flexItem />}>
          {motivos.map((motivo) => (
            <Stack key={motivo.id} direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ py: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{motivo.nome}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {motivo.unit?.nome || "Sem unidade responsável"}
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                {!motivo.ativo ? <Chip size="small" label="Inativo" /> : null}
                <Button size="small" variant="outlined" onClick={() => openEdit(motivo)}>Editar</Button>
                <Button size="small" color="error" variant="outlined" onClick={() => setExcluir(motivo)}>Excluir</Button>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(form)} onClose={() => setForm(null)} fullWidth maxWidth="sm">
        <DialogTitle>{form?.id ? "Editar motivo" : "Novo motivo"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome"
              value={form?.nome || ""}
              onChange={(event) => setForm((f) => ({ ...f, nome: event.target.value }))}
              inputProps={{ maxLength: 120 }}
              required
              fullWidth
            />
            <TextField
              label="Descrição (opcional)"
              value={form?.descricao || ""}
              onChange={(event) => setForm((f) => ({ ...f, descricao: event.target.value }))}
              inputProps={{ maxLength: 255 }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Unidade responsável</InputLabel>
              <Select
                value={form?.unit_id || ""}
                label="Unidade responsável"
                onChange={(event) => setForm((f) => ({ ...f, unit_id: event.target.value }))}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {unitOptions.map((unit) => (
                  <MenuItem key={unit.id} value={String(unit.id)} sx={{ pl: 2 + unit.level * 2 }}>
                    {unit.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ordem"
              type="number"
              value={form?.ordem ?? 0}
              onChange={(event) => setForm((f) => ({ ...f, ordem: event.target.value }))}
              inputProps={{ min: 0 }}
              fullWidth
            />
            <FormControlLabel
              control={<Checkbox checked={Boolean(form?.ativo)} onChange={(event) => setForm((f) => ({ ...f, ativo: event.target.checked }))} />}
              label="Ativo (aparece no formulário público)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(excluir)} onClose={() => setExcluir(null)}>
        <DialogTitle>Excluir motivo</DialogTitle>
        <DialogContent>
          <Typography>Excluir o motivo {excluir?.nome}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcluir(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
