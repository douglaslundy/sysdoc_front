import React, { useCallback, useEffect, useState } from "react";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../../services/api";

const digits = (value) => String(value || "").replace(/\D+/g, "");

export const formatPhone = (value) => {
  const d = digits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value || "";
};

const errorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0];
  return data?.message || fallback;
};

/**
 * Profissionais da Vigilância que recebem avisos por WhatsApp (nova denúncia / nova fiscalização).
 * Cadastro simples: nome + telefone com DDD.
 */
export default function ContatosWhatsapp() {
  const [contatos, setContatos] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [remover, setRemover] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/vigilancia/contatos-whatsapp");
      setContatos(Array.isArray(data) ? data : []);
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível carregar os profissionais."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    setErro("");
    if (!nome.trim()) {
      setErro("Informe o nome do profissional.");
      return;
    }
    const numero = digits(telefone);
    if (numero.length < 10 || numero.length > 13) {
      setErro("Telefone inválido: informe DDD + número (10 a 13 dígitos).");
      return;
    }

    setSaving(true);
    try {
      await api.post("/vigilancia/contatos-whatsapp", { nome: nome.trim(), telefone: numero });
      setNome("");
      setTelefone("");
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível cadastrar o profissional."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (contato) => {
    setErro("");
    try {
      await api.put(`/vigilancia/contatos-whatsapp/${contato.id}`, {
        nome: contato.nome,
        telefone: contato.telefone,
        ativo: !contato.ativo,
      });
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível atualizar o profissional."));
    }
  };

  const handleRemove = async () => {
    const contato = remover;
    setRemover(null);
    setErro("");
    try {
      await api.delete(`/vigilancia/contatos-whatsapp/${contato.id}`);
      await load();
    } catch (error) {
      setErro(errorMessage(error, "Não foi possível remover o profissional."));
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Avisos por WhatsApp</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Os profissionais ativos abaixo recebem uma mensagem quando chega uma denúncia nova ou é registrada uma fiscalização.
        A mensagem traz só protocolo, assunto e local — nunca a identificação do denunciante.
      </Typography>

      {erro ? <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert> : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField label="Nome" value={nome} onChange={(event) => setNome(event.target.value)} inputProps={{ maxLength: 150 }} fullWidth />
        <TextField
          label="WhatsApp (com DDD)"
          value={telefone}
          onChange={(event) => setTelefone(event.target.value)}
          inputProps={{ maxLength: 20 }}
          fullWidth
        />
        <Button variant="contained" onClick={handleAdd} disabled={saving} sx={{ minWidth: 140 }}>
          Adicionar
        </Button>
      </Stack>

      {contatos.length === 0 ? (
        <Typography color="text.secondary">
          Nenhum profissional cadastrado. Cadastre para receber avisos de novas denúncias e fiscalizações por WhatsApp.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />}>
          {contatos.map((contato) => (
            <Stack key={contato.id} direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ py: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{contato.nome}</Typography>
                <Typography variant="body2" color="text.secondary">{formatPhone(contato.telefone)}</Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                {!contato.ativo ? <Chip size="small" label="Inativo" /> : null}
                <Checkbox
                  checked={Boolean(contato.ativo)}
                  onChange={() => handleToggle(contato)}
                  inputProps={{ "aria-label": `Receber avisos: ${contato.nome}` }}
                />
                <Button size="small" color="error" variant="outlined" onClick={() => setRemover(contato)}>
                  Remover
                </Button>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(remover)} onClose={() => setRemover(null)}>
        <DialogTitle>Remover profissional</DialogTitle>
        <DialogContent>
          <Typography>Remover {remover?.nome} da lista de avisos por WhatsApp?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemover(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleRemove}>Remover</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
