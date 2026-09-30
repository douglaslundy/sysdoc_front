import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { registrarDenuncia } from "../src/services/denunciaPublica";

const MAX_FILES = 5;
const MAX_FILE_MB = 10;

const EMPTY = {
  assunto: "",
  descricao_denuncia: "",
  local_endereco: "",
  estabelecimento_nome_informado: "",
  denunciante_nome: "",
  denunciante_contato: "",
  website: "",
};

const collectErrors = (error) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat();
  return [data?.message || "Não foi possível enviar a denúncia. Tente novamente."];
};

export default function Denuncia() {
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [sending, setSending] = useState(false);
  const [recibo, setRecibo] = useState(null);
  const [copiado, setCopiado] = useState("");

  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));

  const handleFiles = ({ target }) => {
    const selected = Array.from(target.files || []);
    if (selected.length > MAX_FILES) {
      setErrors([`Envie no máximo ${MAX_FILES} arquivos.`]);
      return;
    }
    if (selected.some((file) => file.size > MAX_FILE_MB * 1024 * 1024)) {
      setErrors([`Cada arquivo pode ter no máximo ${MAX_FILE_MB} MB.`]);
      return;
    }
    setErrors([]);
    setFiles(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.assunto.trim() || !form.descricao_denuncia.trim() || !form.local_endereco.trim()) {
      setErrors(["Preencha o assunto, a descrição e o local da denúncia."]);
      return;
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    files.forEach((file) => body.append("files[]", file));

    setSending(true);
    setErrors([]);
    try {
      setRecibo(await registrarDenuncia(body));
    } catch (error) {
      setErrors(collectErrors(error));
    } finally {
      setSending(false);
    }
  };

  const copiar = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(label);
    } catch {
      setCopiado("");
    }
  };

  const shell = (children) => (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4, px: 2, display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 720 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Denúncia de Vigilância Sanitária</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Registre uma situação que possa oferecer risco à saúde. Você não precisa se identificar.
        </Typography>
        {children}
      </Box>
    </Box>
  );

  if (recibo) {
    return shell(
      <Card>
        <CardContent>
          <Alert severity="success" sx={{ mb: 2 }}>Denúncia registrada com sucesso.</Alert>
          <Typography variant="overline">Protocolo</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{recibo.protocolo}</Typography>
          <Typography variant="overline" sx={{ mt: 2, display: "block" }}>Senha de consulta</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 3 }}>{recibo.senha}</Typography>
          <Alert severity="warning" sx={{ my: 2 }}>
            Guarde a senha agora: ela é mostrada só uma vez e não pode ser recuperada. Sem ela você não consegue acompanhar a denúncia.
          </Alert>
          <Typography variant="overline">Acompanhe em</Typography>
          <Typography sx={{ wordBreak: "break-all" }}>{recibo.url_consulta}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" onClick={() => copiar("protocolo", recibo.protocolo)}>Copiar protocolo</Button>
            <Button variant="outlined" onClick={() => copiar("senha", recibo.senha)}>Copiar senha</Button>
            <Button variant="outlined" onClick={() => copiar("link", recibo.url_consulta)}>Copiar endereço</Button>
            <Button variant="contained" onClick={() => window.print()}>Imprimir</Button>
          </Stack>
          {copiado ? <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Copiado: {copiado}.</Typography> : null}
        </CardContent>
      </Card>
    );
  }

  return shell(
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {errors.length > 0 && (
              <Alert severity="error">
                {errors.map((message) => (
                  <div key={message}>{message}</div>
                ))}
              </Alert>
            )}

            <TextField label="Assunto *" name="assunto" value={form.assunto} onChange={change} inputProps={{ maxLength: 200 }} fullWidth />
            <TextField
              label="Descreva a denúncia *"
              name="descricao_denuncia"
              value={form.descricao_denuncia}
              onChange={change}
              multiline
              minRows={4}
              inputProps={{ maxLength: 4000 }}
              fullWidth
            />
            <TextField label="Local/endereço *" name="local_endereco" value={form.local_endereco} onChange={change} inputProps={{ maxLength: 255 }} fullWidth />
            <TextField
              label="Nome do estabelecimento (se souber)"
              name="estabelecimento_nome_informado"
              value={form.estabelecimento_nome_informado}
              onChange={change}
              inputProps={{ maxLength: 200 }}
              fullWidth
            />

            <Divider />
            <Typography variant="subtitle2">Identificação (opcional)</Typography>
            <TextField label="Seu nome (opcional)" name="denunciante_nome" value={form.denunciante_nome} onChange={change} inputProps={{ maxLength: 150 }} fullWidth />
            <TextField label="Contato (opcional)" name="denunciante_contato" value={form.denunciante_contato} onChange={change} inputProps={{ maxLength: 150 }} fullWidth />

            <Divider />
            <Box>
              <Typography variant="subtitle2">Fotos e arquivos (opcional)</Typography>
              <Typography variant="caption" color="text.secondary">
                Até {MAX_FILES} arquivos de {MAX_FILE_MB} MB (JPG, PNG, WEBP ou PDF).
              </Typography>
              <input
                aria-label="Fotos e arquivos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFiles}
                style={{ display: "block", marginTop: 8 }}
              />
              {files.length > 0 && <Typography variant="caption">{files.length} arquivo(s) selecionado(s).</Typography>}
            </Box>

            {/* Campo isca: invisível para pessoas; robôs costumam preencher. */}
            <Box aria-hidden="true" sx={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} />
            </Box>

            <Button type="submit" variant="contained" size="large" disabled={sending} startIcon={sending ? <CircularProgress size={18} /> : null}>
              Enviar denúncia
            </Button>
            <Typography variant="caption" color="text.secondary">
              Ao enviar, você receberá um protocolo e uma senha para acompanhar o andamento.
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
