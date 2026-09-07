import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { AuthContext } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const initialProtocolForm = {
  assunto: "",
  descricao: "",
  tipo: "administrativo",
  prioridade: "normal",
  origem_unit_id: "",
  destino_unit_id: "",
  destino_user_id: "",
  prazo_atendimento: "",
};

const protocolPriorityOptions = [
  { value: "normal", label: "Normal" },
  { value: "baixa", label: "Baixa" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const protocolTypeFallbackOptions = [
  { codigo: "administrativo", nome: "Administrativo" },
  { codigo: "interno", nome: "Interno" },
  { codigo: "externo", nome: "Externo" },
  { codigo: "oficio", nome: "Oficio" },
  { codigo: "memorando", nome: "Memorando" },
  { codigo: "requerimento", nome: "Requerimento" },
  { codigo: "solicitacao", nome: "Solicitacao" },
  { codigo: "encaminhamento", nome: "Encaminhamento" },
];

const flattenUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    acc.push({ ...item, level });
    if (Array.isArray(item?.children) && item.children.length > 0) {
      acc.push(...flattenUnits(item.children, level + 1));
    }
    return acc;
  }, []);

export default function NewProtocolModal({ open, onClose, onCreated }) {
  const { username } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [protocolTypes, setProtocolTypes] = useState([]);
  const [creationContext, setCreationContext] = useState(null);
  const [protocolForm, setProtocolForm] = useState(initialProtocolForm);
  const [attachmentFile, setAttachmentFile] = useState(null);

  const unitOptions = useMemo(() => flattenUnits(units), [units]);
  const unitById = useMemo(() => {
    const map = new Map();
    unitOptions.forEach((unit) => {
      map.set(String(unit.id), unit);
    });
    return map;
  }, [unitOptions]);
  const secretariatOptions = useMemo(
    () => unitOptions.filter((unit) => unit.ativo !== false && unit.tipo === "secretaria"),
    [unitOptions]
  );
  const resolveSecretariatId = (unitId) => {
    let current = unitById.get(String(unitId || ""));
    while (current) {
      if (current.tipo === "secretaria") {
        return String(current.id);
      }
      current = current.parent_id ? unitById.get(String(current.parent_id)) : null;
    }
    return "";
  };
  const destinationUsers = useMemo(() => {
    const selectedSecretariatId = String(protocolForm.destino_unit_id || "");
    if (!selectedSecretariatId) return [];

    return users.filter((user) => {
      const links = Array.isArray(user?.protocol_units)
        ? user.protocol_units
        : Array.isArray(user?.protocolUnits)
          ? user.protocolUnits
          : [];

      return links.some((link) => {
        if (link?.ativo === false) return false;
        const linkedUnitId = link?.protocol_organizational_unit_id ?? link?.unit?.id;
        return resolveSecretariatId(linkedUnitId) === selectedSecretariatId;
      });
    });
  }, [protocolForm.destino_unit_id, resolveSecretariatId, users]);
  const protocolTypeOptions = useMemo(() => {
    const activeTypes = protocolTypes.filter((type) => type?.ativo !== false);
    return activeTypes.length > 0 ? activeTypes : protocolTypeFallbackOptions;
  }, [protocolTypes]);

  useEffect(() => {
    if (!open) return;

    setError("");
    Promise.all([
      api.get("/protocolos/unidades-organizacionais"),
      api.get("/users"),
      api.get("/protocolos/tipos"),
      api.get("/protocolos/contexto-novo"),
    ])
      .then(([unitsRes, usersRes, typesRes, contextRes]) => {
        setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setProtocolTypes(Array.isArray(typesRes?.data) ? typesRes.data : []);
        setCreationContext(contextRes?.data || null);
        setProtocolForm((current) => ({
          ...current,
          origem_unit_id: contextRes?.data?.origin?.id ? String(contextRes.data.origin.id) : "",
        }));
      })
      .catch(() => setError("Não foi possível carregar os dados do formulário."));
  }, [open]);

  useEffect(() => {
    if (!protocolForm.destino_user_id) return;

    const exists = destinationUsers.some((user) => String(user.id) === String(protocolForm.destino_user_id));
    if (!exists) {
      setProtocolForm((current) => ({ ...current, destino_user_id: "" }));
    }
  }, [destinationUsers, protocolForm.destino_user_id]);

  const resetAndClose = () => {
    setProtocolForm(initialProtocolForm);
    setAttachmentFile(null);
    setError("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data: created } = await api.post("/protocolos", {
        ...protocolForm,
        origem_unit_id: protocolForm.origem_unit_id || null,
        destino_unit_id: protocolForm.destino_unit_id || null,
        destino_user_id: protocolForm.destino_user_id || null,
        prazo_atendimento: protocolForm.prazo_atendimento || null,
      });

      let successMessage = "Protocolo criado com sucesso.";
      if (attachmentFile) {
        try {
          const formData = new FormData();
          formData.append("arquivo", attachmentFile);
          await api.post(`/protocolos/${created.id}/anexos`, formData);
        } catch (attachError) {
          successMessage = "Protocolo criado com sucesso, mas não foi possível enviar o anexo. Anexe pela tela de detalhe do protocolo.";
        }
      }

      setSaving(false);
      setProtocolForm(initialProtocolForm);
      setAttachmentFile(null);
      onCreated(successMessage);
      onClose();
    } catch (submitError) {
      setSaving(false);
      setError(submitError?.response?.data?.message || "Não foi possível criar o protocolo.");
    }
  };

  return (
    <Dialog open={open} onClose={resetAndClose} maxWidth="md" fullWidth>
      <DialogTitle>Novo protocolo</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Assunto" value={protocolForm.assunto} onChange={(e) => setProtocolForm((prev) => ({ ...prev, assunto: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={protocolForm.tipo}
                onChange={(e) => setProtocolForm((prev) => ({ ...prev, tipo: e.target.value }))}
                required
              >
                {protocolTypeOptions.map((option) => (
                  <MenuItem key={option.codigo} value={option.codigo}>
                    {option.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Prioridade"
                value={protocolForm.prioridade}
                onChange={(e) => setProtocolForm((prev) => ({ ...prev, prioridade: e.target.value }))}
              >
                {protocolPriorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Solicitante"
                value={creationContext?.requester?.name || username || "Usuário logado"}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="date" label="Prazo de atendimento" InputLabelProps={{ shrink: true }} value={protocolForm.prazo_atendimento} onChange={(e) => setProtocolForm((prev) => ({ ...prev, prazo_atendimento: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              {creationContext?.origin_locked ? (
                <TextField
                  fullWidth
                  label="Origem"
                  value={creationContext?.origin?.nome || "Unidade vinculada"}
                  InputProps={{ readOnly: true }}
                />
              ) : (
                <FormControl fullWidth required>
                  <InputLabel>Origem</InputLabel>
                  <Select
                    value={protocolForm.origem_unit_id}
                    label="Origem"
                    onChange={(e) => setProtocolForm((prev) => ({ ...prev, origem_unit_id: e.target.value }))}
                  >
                    <MenuItem value="">Selecione a origem</MenuItem>
                    {secretariatOptions.map((unit) => (
                      <MenuItem key={unit.id} value={String(unit.id)}>
                        {unit.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Secretaria de destino</InputLabel>
                <Select
                  value={protocolForm.destino_unit_id}
                  label="Secretaria de destino"
                  onChange={(e) => setProtocolForm((prev) => ({ ...prev, destino_unit_id: e.target.value }))}
                  required
                >
                  <MenuItem value="">Selecione a secretaria</MenuItem>
                  {secretariatOptions.map((unit) => (
                    <MenuItem key={unit.id} value={String(unit.id)}>
                      {unit.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!protocolForm.destino_unit_id}>
                <InputLabel>Usuário de destino</InputLabel>
                <Select
                  value={protocolForm.destino_user_id}
                  label="Usuário de destino"
                  onChange={(e) => setProtocolForm((prev) => ({ ...prev, destino_user_id: e.target.value }))}
                >
                  <MenuItem value="">Todos da secretaria</MenuItem>
                  {destinationUsers.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={4} label="Descrição" value={protocolForm.descricao} onChange={(e) => setProtocolForm((prev) => ({ ...prev, descricao: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                {attachmentFile ? attachmentFile.name : "Anexar arquivo (opcional)"}
                <input
                  hidden
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetAndClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? "Salvando..." : "Gravar"}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
