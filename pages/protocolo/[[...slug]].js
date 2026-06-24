import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BaseCard from "../../src/components/baseCard/BaseCard";
import AlertModal from "../../src/components/messagesModal";
import { modalFormRootSx } from "../../src/components/modal/_shared/modalFormStyles";
import { api } from "../../src/services/api";

const routes = {
  "caixa-entrada": "inbox",
  novo: "novo",
  estrutura: "estrutura",
  alertas: "alertas",
  configuracoes: "configuracoes",
};

const modeLabels = {
  home: "Protocolo",
  inbox: "Caixa de Entrada",
  novo: "Novo Protocolo",
  estrutura: "Estrutura Organizacional",
  alertas: "Alertas",
  configuracoes: "Configurações",
  detail: "Detalhes do Protocolo",
};

const initialProtocolForm = {
  assunto: "",
  descricao: "",
  tipo: "administrativo",
  prioridade: "normal",
  solicitante_tipo: "interno",
  solicitante_nome: "",
  solicitante_documento: "",
  origem_unit_id: "",
  destino_unit_id: "",
  prazo_atendimento: "",
};

const initialConfigForm = {
  allow_external_protocols: true,
  allow_reopen: true,
  notify_internal: true,
  notify_email: false,
  notify_whatsapp: false,
  default_priority: "normal",
  default_due_days: 5,
  evolution_base_url: "",
  evolution_api_key: "",
  evolution_default_session: "",
  evolution_enabled: false,
  observacoes: "",
};

const initialUnitForm = {
  parent_id: "",
  tipo: "secretaria",
  codigo: "",
  nome: "",
  descricao: "",
  ativo: true,
};

const initialAlertForm = {
  nome: "",
  descricao: "",
  modulo: "protocolo",
  gatilho: "protocolo_criado",
  condicoes: "",
  canais: "interna",
  destinatarios: "",
  template: "",
  frequencia: "",
  ativo: true,
  prevenir_duplicidade: true,
};

const statusColor = (status) => {
  const map = {
    novo: "info",
    recebido: "primary",
    analise: "warning",
    em_andamento: "warning",
    encaminhado: "secondary",
    aguardando_resposta: "warning",
    pendente_documentacao: "warning",
    concluido: "success",
    encerrado: "default",
    cancelado: "error",
    reaberto: "info",
    vencido: "error",
  };
  return map[String(status || "").toLowerCase()] || "default";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
};

const flattenUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    acc.push({ ...item, level });
    if (Array.isArray(item?.children) && item.children.length > 0) {
      acc.push(...flattenUnits(item.children, level + 1));
    }
    return acc;
  }, []);

export default function ProtocoloPage() {
  const router = useRouter();
  const slug = useMemo(() => {
    const raw = router.query.slug;
    return Array.isArray(raw) ? raw : [];
  }, [router.query.slug]);

  const mode = useMemo(() => {
    const first = slug[0];
    if (!first) return "home";
    if (/^\d+$/.test(first)) return "detail";
    return routes[first] || "home";
  }, [slug]);

  const protocolId = useMemo(() => (mode === "detail" ? Number(slug[0]) : null), [mode, slug]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [countInfo, setCountInfo] = useState({ recentes: [] });
  const [protocols, setProtocols] = useState([]);
  const [protocolDetail, setProtocolDetail] = useState(null);
  const [units, setUnits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [configForm, setConfigForm] = useState(initialConfigForm);
  const [protocolForm, setProtocolForm] = useState(initialProtocolForm);
  const [unitForm, setUnitForm] = useState(initialUnitForm);
  const [alertForm, setAlertForm] = useState(initialAlertForm);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [detailForwardUnit, setDetailForwardUnit] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentPrivate, setCommentPrivate] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentDescription, setAttachmentDescription] = useState("");

  const unitOptions = useMemo(() => flattenUnits(units), [units]);

  const loadList = async () => {
    const [countsRes, inboxRes] = await Promise.all([
      api.get("/protocolos/contadores"),
      api.get("/protocolos/caixa-entrada", {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
          search: search || undefined,
        },
      }),
    ]);

    setCountInfo({
      novos: Number(countsRes.data?.novos ?? 0),
      vence_em_breve: Number(countsRes.data?.vence_em_breve ?? 0),
      vencidos: Number(countsRes.data?.vencidos ?? 0),
      recentes: Array.isArray(countsRes.data?.recentes) ? countsRes.data.recentes : [],
    });
    setProtocols(Array.isArray(inboxRes.data?.data) ? inboxRes.data.data : []);
    setTotal(Number(inboxRes.data?.total ?? inboxRes.data?.meta?.total ?? 0));
  };

  const loadOverview = async () => {
    const { data } = await api.get("/protocolos/contadores");
    setCountInfo({
      novos: Number(data?.novos ?? 0),
      vence_em_breve: Number(data?.vence_em_breve ?? 0),
      vencidos: Number(data?.vencidos ?? 0),
      recentes: Array.isArray(data?.recentes) ? data.recentes : [],
    });
    setProtocols([]);
    setTotal(0);
  };

  const loadDetail = async (id) => {
    const { data } = await api.get(`/protocolos/${id}`);
    setProtocolDetail(data || null);
    setDetailForwardUnit(String(data?.destino_unit_id || ""));
    setCommentText("");
    setAttachmentFile(null);
    setAttachmentDescription("");
  };

  const loadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "configuracoes") {
        const { data } = await api.get("/protocolos/configuracoes");
        setConfigForm((prev) => ({ ...prev, ...(data || {}) }));
      } else if (mode === "estrutura" || mode === "novo" || mode === "detail") {
        const { data } = await api.get("/protocolos/unidades-organizacionais");
        setUnits(Array.isArray(data) ? data : []);
        if (mode === "detail" && protocolId) {
          await loadDetail(protocolId);
        }
      } else if (mode === "alertas") {
        const { data } = await api.get("/protocolos/alertas");
        setAlerts(Array.isArray(data) ? data : []);
      } else if (mode === "home") {
        await loadOverview();
      } else {
        await loadList();
      }
    } catch (error) {
      setMessage("Não foi possível carregar os dados do protocolo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, mode]);

  useEffect(() => {
    if (!router.isReady) return;
    if (mode === "inbox") {
      loadList().catch(() => setMessage("Não foi possível carregar a caixa de entrada."));
    }
    if (mode === "home") {
      loadOverview().catch(() => setMessage("Não foi possível carregar o painel do protocolo."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search, router.isReady, mode]);

  const currentTitle = modeLabels[mode] || "Protocolo";

  const refreshDetail = async () => {
    if (!protocolId) return;
    setLoading(true);
    try {
      await loadDetail(protocolId);
    } catch (error) {
      setMessage("Não foi possível recarregar o protocolo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailAction = async (action, payload = {}) => {
    if (!protocolId) return;
    setSaving(true);
    setMessage("");
    try {
      await api.post(`/protocolos/${protocolId}/${action}`, payload);
      await refreshDetail();
      setMessage("Ação executada com sucesso.");
    } catch (error) {
      setMessage("Não foi possível executar a ação.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitProtocol = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/protocolos", {
        ...protocolForm,
        origem_unit_id: protocolForm.origem_unit_id || null,
        destino_unit_id: protocolForm.destino_unit_id || null,
        prazo_atendimento: protocolForm.prazo_atendimento || null,
      });
      setMessage("Protocolo criado com sucesso.");
      setProtocolForm(initialProtocolForm);
      await router.push("/protocolo/caixa-entrada");
    } catch (error) {
      setMessage("Não foi possível criar o protocolo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitConfig = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.put("/protocolos/configuracoes", configForm);
      setMessage("Configurações salvas com sucesso.");
    } catch (error) {
      setMessage("Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitUnit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/protocolos/unidades-organizacionais", {
        ...unitForm,
        parent_id: unitForm.parent_id || null,
      });
      setMessage("Unidade cadastrada com sucesso.");
      setUnitForm(initialUnitForm);
      await loadData();
    } catch (error) {
      setMessage("Não foi possível cadastrar a unidade.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAlert = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/protocolos/alertas", {
        ...alertForm,
        condicoes: alertForm.condicoes
          ? alertForm.condicoes.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        canais: alertForm.canais
          ? alertForm.canais.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        destinatarios: alertForm.destinatarios
          ? alertForm.destinatarios.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
      });
      setMessage("Alerta cadastrado com sucesso.");
      setAlertForm(initialAlertForm);
      await loadData();
    } catch (error) {
      setMessage("Não foi possível cadastrar o alerta.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    if (!protocolId || !commentText.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      await api.post(`/protocolos/${protocolId}/comentarios`, {
        conteudo: commentText.trim(),
        privado: commentPrivate,
        tipo: "comentario",
      });
      setMessage("Comentário adicionado com sucesso.");
      await refreshDetail();
    } catch (error) {
      setMessage("Não foi possível salvar o comentário.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAttachment = async (event) => {
    event.preventDefault();
    if (!protocolId || !attachmentFile) return;
    setSaving(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("arquivo", attachmentFile);
      formData.append("descricao", attachmentDescription || "");

      await api.post(`/protocolos/${protocolId}/anexos`, formData);
      setMessage("Anexo enviado com sucesso.");
      await refreshDetail();
    } catch (error) {
      setMessage("Não foi possível enviar o anexo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await api.get(`/protocolos/anexos/${attachment.id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.nome_original || "anexo";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage("Não foi possível baixar o anexo.");
    }
  };

  const renderHome = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, border: "1px solid var(--lg-border)", borderRadius: 2, bgcolor: "var(--lg-glass-panel)" }}>
            <Typography variant="overline">Novos</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{countInfo?.novos ?? 0}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, border: "1px solid var(--lg-border)", borderRadius: 2, bgcolor: "var(--lg-glass-panel)" }}>
            <Typography variant="overline">Vencem em breve</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{countInfo?.vence_em_breve ?? 0}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, border: "1px solid var(--lg-border)", borderRadius: 2, bgcolor: "var(--lg-glass-panel)" }}>
            <Typography variant="overline">Vencidos</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{countInfo?.vencidos ?? 0}</Typography>
          </Box>
        </Grid>
      </Grid>

      <BaseCard title="Protocolos recentes">
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <TextField
            className="lg-search-field"
            placeholder="Pesquisar protocolo"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            sx={{ minWidth: 280, flex: 1 }}
          />
        </Box>

        <Table sx={{ whiteSpace: "nowrap" }}>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Assunto</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Prazo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {protocols.length > 0 ? protocols.map((protocol) => (
              <TableRow
                key={protocol.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => router.push(`/protocolo/${protocol.id}`)}
              >
                <TableCell>{protocol.numero}</TableCell>
                <TableCell>{protocol.assunto}</TableCell>
                <TableCell>
                  <Chip size="small" label={protocol.prioridade || "normal"} />
                </TableCell>
                <TableCell>
                  <Chip size="small" color={statusColor(protocol.status)} label={String(protocol.status || "").replace(/_/g, " ") || "—"} />
                </TableCell>
                <TableCell>{formatDate(protocol.prazo_atendimento)}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); router.push(`/protocolo/${protocol.id}`); }}>
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} align="center">Nenhum protocolo encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </BaseCard>
    </Box>
  );

  const renderDetail = () => {
    const p = protocolDetail || {};
    const movements = Array.isArray(p.movements) ? p.movements : [];
    const comments = Array.isArray(p.comments) ? p.comments : [];
    const attachments = Array.isArray(p.attachments) ? p.attachments : [];

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BaseCard title={`Protocolo ${p.numero || ""}`}>
          <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{p.assunto || "Sem assunto"}</Typography>
              <Typography variant="body2" color="text.secondary">{p.descricao || "Sem descrição"}</Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={String(p.status || "—").replace(/_/g, " ")} color={statusColor(p.status)} />
              <Chip label={p.prioridade || "normal"} />
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><Typography variant="caption">Solicitante</Typography><Typography variant="body1">{p.solicitante_nome || "—"}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption">Documento</Typography><Typography variant="body1">{p.solicitante_documento || "—"}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption">Prazo</Typography><Typography variant="body1">{formatDate(p.prazo_atendimento)}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption">Origem</Typography><Typography variant="body1">{p.origem_unit?.nome || "—"}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption">Destino</Typography><Typography variant="body1">{p.destino_unit?.nome || "—"}</Typography></Grid>
            <Grid item xs={12} md={4}><Typography variant="caption">Responsável</Typography><Typography variant="body1">{p.responsavel_atual?.name || "—"}</Typography></Grid>
          </Grid>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 3, mb: 1 }}>
            <Button variant="outlined" onClick={() => router.push("/protocolo/caixa-entrada")}>Voltar</Button>
            {!p.recebido_em && <Button variant="contained" onClick={() => handleDetailAction("receber")}>Receber</Button>}
            <Button
              variant="outlined"
              onClick={() => handleDetailAction("encaminhar", {
                destino_unit_id: detailForwardUnit || null,
              })}
              disabled={!detailForwardUnit}
            >
              Encaminhar
            </Button>
            <Button variant="contained" color="error" onClick={() => handleDetailAction("encerrar", { justificativa_encerramento: "Encerrado pelo usuário" })}>
              Encerrar
            </Button>
            <Button variant="outlined" onClick={() => handleDetailAction("reabrir")} disabled={p.status !== "encerrado"}>
              Reabrir
            </Button>
          </Stack>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Destino para encaminhamento</InputLabel>
            <Select
              value={detailForwardUnit}
              label="Destino para encaminhamento"
              onChange={(e) => setDetailForwardUnit(e.target.value)}
            >
              <MenuItem value="">Selecione</MenuItem>
              {unitOptions.map((unit) => (
                <MenuItem key={unit.id} value={String(unit.id)}>
                  {`${"—".repeat(unit.level)} ${unit.nome}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </BaseCard>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <BaseCard title="Comentário">
              <Box component="form" onSubmit={handleSubmitComment} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Escreva um comentário"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <FormControlLabel
                  control={<Switch checked={commentPrivate} onChange={(e) => setCommentPrivate(e.target.checked)} />}
                  label="Comentário privado"
                />
                <Stack direction="row" justifyContent="flex-end">
                  <Button type="submit" variant="contained" disabled={saving || !commentText.trim()}>
                    {saving ? "Salvando..." : "Comentar"}
                  </Button>
                </Stack>
              </Box>
            </BaseCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <BaseCard title="Anexar documento">
              <Box component="form" onSubmit={handleSubmitAttachment} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Descrição do anexo"
                  value={attachmentDescription}
                  onChange={(e) => setAttachmentDescription(e.target.value)}
                />
                <Button variant="outlined" component="label">
                  {attachmentFile ? attachmentFile.name : "Selecionar arquivo"}
                  <input
                    hidden
                    type="file"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  />
                </Button>
                <Stack direction="row" justifyContent="flex-end">
                  <Button type="submit" variant="contained" disabled={saving || !attachmentFile}>
                    {saving ? "Enviando..." : "Enviar anexo"}
                  </Button>
                </Stack>
              </Box>
            </BaseCard>
          </Grid>
        </Grid>

        <BaseCard title="Histórico e observações">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 1 }}>Movimentações</Typography>
              <Stack spacing={1}>
                {movements.length > 0 ? movements.map((movement) => (
                  <Box key={movement.id} sx={{ p: 1.5, border: "1px solid var(--lg-border)", borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{movement.acao}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {movement.user?.name || "—"} • {formatDateTime(movement.created_at)}
                    </Typography>
                  </Box>
                )) : <Typography color="text.secondary">Nenhuma movimentação registrada.</Typography>}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 1 }}>Comentários</Typography>
              <Stack spacing={1}>
                {comments.length > 0 ? comments.map((comment) => (
                  <Box key={comment.id} sx={{ p: 1.5, border: "1px solid var(--lg-border)", borderRadius: 2 }}>
                    <Typography variant="body2">{comment.conteudo}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comment.user?.name || "—"} • {formatDateTime(comment.created_at)}
                    </Typography>
                  </Box>
                )) : <Typography color="text.secondary">Nenhum comentário registrado.</Typography>}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 1 }}>Anexos</Typography>
              <Stack spacing={1}>
                {attachments.length > 0 ? attachments.map((attachment) => (
                  <Box key={attachment.id} sx={{ p: 1.5, border: "1px solid var(--lg-border)", borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {attachment.nome_original}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attachment.user?.name || "—"} • {formatDateTime(attachment.created_at)}
                    </Typography>
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => handleDownloadAttachment(attachment)}>
                        Baixar
                      </Button>
                    </Stack>
                  </Box>
                )) : <Typography color="text.secondary">Nenhum anexo enviado.</Typography>}
              </Stack>
            </Grid>
          </Grid>
        </BaseCard>
      </Box>
    );
  };

  const renderNovo = () => (
    <BaseCard title="Novo protocolo">
      <Box component="form" onSubmit={handleSubmitProtocol} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField fullWidth label="Assunto" value={protocolForm.assunto} onChange={(e) => setProtocolForm((prev) => ({ ...prev, assunto: e.target.value }))} required />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Tipo" value={protocolForm.tipo} onChange={(e) => setProtocolForm((prev) => ({ ...prev, tipo: e.target.value }))} required />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Prioridade" value={protocolForm.prioridade} onChange={(e) => setProtocolForm((prev) => ({ ...prev, prioridade: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Solicitante" value={protocolForm.solicitante_nome} onChange={(e) => setProtocolForm((prev) => ({ ...prev, solicitante_nome: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Documento do solicitante" value={protocolForm.solicitante_documento} onChange={(e) => setProtocolForm((prev) => ({ ...prev, solicitante_documento: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth type="date" label="Prazo de atendimento" InputLabelProps={{ shrink: true }} value={protocolForm.prazo_atendimento} onChange={(e) => setProtocolForm((prev) => ({ ...prev, prazo_atendimento: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Origem</InputLabel>
              <Select value={protocolForm.origem_unit_id} label="Origem" onChange={(e) => setProtocolForm((prev) => ({ ...prev, origem_unit_id: e.target.value }))}>
                <MenuItem value="">Nenhuma</MenuItem>
                {unitOptions.map((unit) => <MenuItem key={unit.id} value={String(unit.id)}>{`${"—".repeat(unit.level)} ${unit.nome}`}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Destino</InputLabel>
              <Select value={protocolForm.destino_unit_id} label="Destino" onChange={(e) => setProtocolForm((prev) => ({ ...prev, destino_unit_id: e.target.value }))}>
                <MenuItem value="">Nenhuma</MenuItem>
                {unitOptions.map((unit) => <MenuItem key={unit.id} value={String(unit.id)}>{`${"—".repeat(unit.level)} ${unit.nome}`}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline minRows={4} label="Descrição" value={protocolForm.descricao} onChange={(e) => setProtocolForm((prev) => ({ ...prev, descricao: e.target.value }))} />
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="outlined" onClick={() => router.push("/protocolo/caixa-entrada")}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? "Salvando..." : "Gravar"}</Button>
        </Stack>
      </Box>
    </BaseCard>
  );

  const renderConfig = () => (
    <BaseCard title="Configurações do protocolo">
      <Box component="form" onSubmit={handleSubmitConfig} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Alert severity="info">A integração com Evolution API e os canais do protocolo são controlados por esta tela.</Alert>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Prioridade padrão" value={configForm.default_priority} onChange={(e) => setConfigForm((prev) => ({ ...prev, default_priority: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth type="number" label="Prazo padrão em dias" value={configForm.default_due_days} onChange={(e) => setConfigForm((prev) => ({ ...prev, default_due_days: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Sessão padrão" value={configForm.evolution_default_session} onChange={(e) => setConfigForm((prev) => ({ ...prev, evolution_default_session: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="URL base Evolution" value={configForm.evolution_base_url} onChange={(e) => setConfigForm((prev) => ({ ...prev, evolution_base_url: e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Chave Evolution" value={configForm.evolution_api_key} onChange={(e) => setConfigForm((prev) => ({ ...prev, evolution_api_key: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline minRows={4} label="Observações" value={configForm.observacoes} onChange={(e) => setConfigForm((prev) => ({ ...prev, observacoes: e.target.value }))} />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <FormControlLabel control={<Switch checked={Boolean(configForm.allow_external_protocols)} onChange={(e) => setConfigForm((prev) => ({ ...prev, allow_external_protocols: e.target.checked }))} />} label="Permitir protocolos externos" />
              <FormControlLabel control={<Switch checked={Boolean(configForm.allow_reopen)} onChange={(e) => setConfigForm((prev) => ({ ...prev, allow_reopen: e.target.checked }))} />} label="Permitir reabertura" />
              <FormControlLabel control={<Switch checked={Boolean(configForm.notify_internal)} onChange={(e) => setConfigForm((prev) => ({ ...prev, notify_internal: e.target.checked }))} />} label="Notificação interna" />
              <FormControlLabel control={<Switch checked={Boolean(configForm.notify_email)} onChange={(e) => setConfigForm((prev) => ({ ...prev, notify_email: e.target.checked }))} />} label="E-mail" />
              <FormControlLabel control={<Switch checked={Boolean(configForm.notify_whatsapp)} onChange={(e) => setConfigForm((prev) => ({ ...prev, notify_whatsapp: e.target.checked }))} />} label="WhatsApp" />
              <FormControlLabel control={<Switch checked={Boolean(configForm.evolution_enabled)} onChange={(e) => setConfigForm((prev) => ({ ...prev, evolution_enabled: e.target.checked }))} />} label="Evolution habilitada" />
            </Stack>
          </Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </Stack>
      </Box>
    </BaseCard>
  );

  const renderStructure = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <BaseCard title="Nova unidade organizacional">
        <Box component="form" onSubmit={handleSubmitUnit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Unidade pai</InputLabel>
                <Select value={unitForm.parent_id} label="Unidade pai" onChange={(e) => setUnitForm((prev) => ({ ...prev, parent_id: e.target.value }))}>
                  <MenuItem value="">Nenhuma</MenuItem>
                  {unitOptions.map((unit) => <MenuItem key={unit.id} value={String(unit.id)}>{`${"—".repeat(unit.level)} ${unit.nome}`}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Tipo" value={unitForm.tipo} onChange={(e) => setUnitForm((prev) => ({ ...prev, tipo: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Código" value={unitForm.codigo} onChange={(e) => setUnitForm((prev) => ({ ...prev, codigo: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nome" value={unitForm.nome} onChange={(e) => setUnitForm((prev) => ({ ...prev, nome: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Descrição" value={unitForm.descricao} onChange={(e) => setUnitForm((prev) => ({ ...prev, descricao: e.target.value }))} />
            </Grid>
          </Grid>
          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button>
          </Stack>
        </Box>
      </BaseCard>

      <BaseCard title="Estrutura cadastrada">
        <Table sx={{ whiteSpace: "nowrap" }}>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {unitOptions.length > 0 ? unitOptions.map((unit) => (
              <TableRow key={unit.id} hover>
                <TableCell><Box sx={{ pl: `${unit.level * 16}px` }}>{unit.nome}</Box></TableCell>
                <TableCell>{unit.tipo}</TableCell>
                <TableCell>{unit.codigo || "—"}</TableCell>
                <TableCell><Chip size="small" color={unit.ativo ? "success" : "default"} label={unit.ativo ? "Ativo" : "Inativo"} /></TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} align="center">Nenhuma unidade cadastrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </BaseCard>
    </Box>
  );

  const renderAlerts = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <BaseCard title="Novo alerta">
        <Box component="form" onSubmit={handleSubmitAlert} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Nome" value={alertForm.nome} onChange={(e) => setAlertForm((prev) => ({ ...prev, nome: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Módulo" value={alertForm.modulo} onChange={(e) => setAlertForm((prev) => ({ ...prev, modulo: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Gatilho" value={alertForm.gatilho} onChange={(e) => setAlertForm((prev) => ({ ...prev, gatilho: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Frequência" value={alertForm.frequencia} onChange={(e) => setAlertForm((prev) => ({ ...prev, frequencia: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Canais" helperText="Separar por vírgula" value={alertForm.canais} onChange={(e) => setAlertForm((prev) => ({ ...prev, canais: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Destinatários" helperText="Separar por vírgula" value={alertForm.destinatarios} onChange={(e) => setAlertForm((prev) => ({ ...prev, destinatarios: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Condições" helperText="Separar por vírgula" value={alertForm.condicoes} onChange={(e) => setAlertForm((prev) => ({ ...prev, condicoes: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Template" value={alertForm.template} onChange={(e) => setAlertForm((prev) => ({ ...prev, template: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Descrição" value={alertForm.descricao} onChange={(e) => setAlertForm((prev) => ({ ...prev, descricao: e.target.value }))} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <FormControlLabel control={<Switch checked={Boolean(alertForm.ativo)} onChange={(e) => setAlertForm((prev) => ({ ...prev, ativo: e.target.checked }))} />} label="Ativo" />
                <FormControlLabel control={<Switch checked={Boolean(alertForm.prevenir_duplicidade)} onChange={(e) => setAlertForm((prev) => ({ ...prev, prevenir_duplicidade: e.target.checked }))} />} label="Prevenir duplicidade" />
              </Stack>
            </Grid>
          </Grid>
          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </Stack>
        </Box>
      </BaseCard>

      <BaseCard title="Alertas cadastrados">
        <Table sx={{ whiteSpace: "nowrap" }}>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Módulo</TableCell>
              <TableCell>Gatilho</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length > 0 ? alerts.map((alert) => (
              <TableRow key={alert.id} hover>
                <TableCell>{alert.nome}</TableCell>
                <TableCell>{alert.modulo}</TableCell>
                <TableCell>{alert.gatilho}</TableCell>
                <TableCell><Chip size="small" color={alert.ativo ? "success" : "default"} label={alert.ativo ? "Ativo" : "Inativo"} /></TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} align="center">Nenhum alerta cadastrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </BaseCard>
    </Box>
  );

  const renderContent = () => {
    if (mode === "novo") return renderNovo();
    if (mode === "estrutura") return renderStructure();
    if (mode === "alertas") return renderAlerts();
    if (mode === "configuracoes") return renderConfig();
    if (mode === "detail") return renderDetail();
    return renderHome();
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page">
      <BaseCard title={currentTitle}>
        <AlertModal />
        {message ? (
          <Alert severity={message.toLowerCase().includes("não foi possível") ? "error" : "success"} sx={{ mb: 2 }}>
            {message}
          </Alert>
        ) : null}
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
            <CircularProgress size={22} />
            <Typography variant="h6">Carregando protocolo...</Typography>
          </Box>
        ) : renderContent()}
      </BaseCard>
    </Box>
  );
}
