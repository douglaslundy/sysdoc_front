import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useContext } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  ListItemText,
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
import { AuthContext } from "../../src/contexts/AuthContext";
import { api } from "../../src/services/api";

const routes = {
  "caixa-entrada": "inbox",
  novo: "novo",
  estrutura: "estrutura",
  alertas: "alertas",
};

const modeLabels = {
  home: "Protocolo",
  inbox: "Caixa de Entrada",
  novo: "Novo Protocolo",
  estrutura: "Estrutura Organizacional",
  alertas: "Alertas",
  detail: "Detalhes do Protocolo",
};

const initialProtocolForm = {
  assunto: "",
  descricao: "",
  tipo: "administrativo",
  prioridade: "normal",
  origem_unit_id: "",
  destino_user_id: "",
  prazo_atendimento: "",
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
  condicoes: [],
  canais: ["whatsapp"],
  destinatarios: [],
  template: "",
  frequencia: "",
  ativo: true,
  prevenir_duplicidade: true,
};

const protocolPriorityOptions = [
  { value: "normal", label: "Normal" },
  { value: "baixa", label: "Baixa" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const protocolUnitTypeOptions = [
  { value: "secretaria", label: "Secretaria" },
  { value: "departamento", label: "Departamento" },
  { value: "subdepartamento", label: "Subdepartamento" },
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

const alertModuleOptions = [
  { value: "protocolo", label: "Protocolo" },
  { value: "queue", label: "Fila" },
  { value: "laboratorio", label: "Laboratório" },
  { value: "cadastros", label: "Cadastros" },
  { value: "sistema", label: "Sistema" },
];

const alertTriggerOptions = {
  protocolo: [
    { value: "protocolo_criado", label: "Protocolo criado" },
    { value: "protocolo_recebido", label: "Protocolo recebido" },
    { value: "protocolo_encaminhado", label: "Protocolo encaminhado" },
    { value: "protocolo_vencendo", label: "Prazo vencendo" },
    { value: "protocolo_vencido", label: "Prazo vencido" },
  ],
  queue: [
    { value: "senha_emitida", label: "Senha emitida" },
    { value: "senha_chamada", label: "Senha chamada" },
    { value: "senha_perdida", label: "Senha perdida" },
  ],
  laboratorio: [
    { value: "pedido_criado", label: "Pedido criado" },
    { value: "pedido_rascunho", label: "Pedido em rascunho" },
    { value: "resultado_liberado", label: "Resultado liberado" },
  ],
  cadastros: [
    { value: "usuario_cadastrado", label: "Usuário cadastrado" },
    { value: "cliente_cadastrado", label: "Cliente cadastrado" },
  ],
  sistema: [
    { value: "config_alterada", label: "Configuração alterada" },
    { value: "alerta_gerado", label: "Alerta gerado" },
  ],
};

const alertChannelOptions = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
];
const alertRecipientOptions = [
  { value: "administrador", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "usuario", label: "Usuário" },
  { value: "tfd", label: "TFD" },
  { value: "motorista", label: "Motorista" },
  { value: "todos", label: "Todos" },
];
const alertConditionOptions = [
  { value: "novo", label: "Novo" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando_resposta", label: "Aguardando resposta" },
  { value: "vencendo", label: "Vencendo" },
  { value: "vencido", label: "Vencido" },
  { value: "concluido", label: "Concluído" },
];

const getAlertTriggerOptions = (module) => alertTriggerOptions[module] || alertTriggerOptions.protocolo;

const normalizeStringList = (values) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

function MultiSelectField({ label, helperText, value, onChange, options, placeholder }) {
  const selected = normalizeStringList(value);
  const labelMap = new Map(options.map((option) => [option.value, option.label]));

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selected}
        label={label}
        onChange={(event) => onChange(normalizeStringList(event.target.value))}
        renderValue={(selectedValues) => {
          if (!selectedValues.length) {
            return <Typography color="text.secondary">{placeholder || "Selecione"}</Typography>;
          }

          return (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {selectedValues.map((entry) => (
                <Chip key={entry} size="small" label={labelMap.get(entry) || entry} />
              ))}
            </Stack>
          );
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox checked={selected.indexOf(option.value) > -1} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
          {helperText}
        </Typography>
      ) : null}
    </FormControl>
  );
}

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

const activeProtocolViewSessions = new Map();

const getProtocolViewSession = (protocolId) => {
  if (typeof window === "undefined" || !protocolId) return "";
  if (activeProtocolViewSessions.has(protocolId)) {
    return activeProtocolViewSessions.get(protocolId);
  }

  const storageKey = `protocol-view-session:${protocolId}`;
  const navigationType = window.performance
    ?.getEntriesByType?.("navigation")?.[0]?.type;
  let sessionKey = navigationType === "reload"
    ? window.sessionStorage.getItem(storageKey)
    : "";

  if (!sessionKey) {
    sessionKey = typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  window.sessionStorage.setItem(storageKey, sessionKey);
  activeProtocolViewSessions.set(protocolId, sessionKey);
  return sessionKey;
};

const flattenUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    acc.push({ ...item, level });
    if (Array.isArray(item?.children) && item.children.length > 0) {
      acc.push(...flattenUnits(item.children, level + 1));
    }
    return acc;
  }, []);

export default function ProtocoloPage({ forcedMode = null } = {}) {
  const { username } = useContext(AuthContext);
  const router = useRouter();
  const slug = useMemo(() => {
    const raw = router.query.slug;
    return Array.isArray(raw) ? raw : [];
  }, [router.query.slug]);

  const mode = useMemo(() => {
    if (forcedMode) return forcedMode;
    const first = slug[0];
    if (!first) return "home";
    if (/^\d+$/.test(first)) return "detail";
    return routes[first] || "home";
  }, [forcedMode, slug]);

  const protocolId = useMemo(() => (mode === "detail" ? Number(slug[0]) : null), [mode, slug]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [countInfo, setCountInfo] = useState({ recentes: [] });
  const [protocols, setProtocols] = useState([]);
  const [protocolDetail, setProtocolDetail] = useState(null);
  const [units, setUnits] = useState([]);
  const [protocolTypes, setProtocolTypes] = useState([]);
  const [creationContext, setCreationContext] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [protocolForm, setProtocolForm] = useState(initialProtocolForm);
  const [unitForm, setUnitForm] = useState(initialUnitForm);
  const [alertForm, setAlertForm] = useState(initialAlertForm);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [detailForwardUnit, setDetailForwardUnit] = useState("");
  const [detailForwardUser, setDetailForwardUser] = useState("");
  const [detailForwardObservation, setDetailForwardObservation] = useState("");
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPrivate, setCommentPrivate] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentDescription, setAttachmentDescription] = useState("");
  const [visualizations, setVisualizations] = useState([]);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [loadingVisualizations, setLoadingVisualizations] = useState(false);
  const [historicoMovements, setHistoricoMovements] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const unitOptions = useMemo(() => flattenUnits(units), [units]);
  const protocolTypeOptions = useMemo(
    () => {
      const activeTypes = protocolTypes.filter((type) => type?.ativo !== false);
      return activeTypes.length > 0 ? activeTypes : protocolTypeFallbackOptions;
    },
    [protocolTypes]
  );
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
    const { data } = await api.get(`/protocolos/${id}`, {
      params: { view_session: getProtocolViewSession(id) },
    });
    setProtocolDetail(data || null);
    setDetailForwardUnit(String(data?.destino_unit_id || ""));
    setDetailForwardUser(String(data?.responsavel_atual_id || ""));
    setDetailForwardObservation("");
    setForwardDialogOpen(false);
    setCommentText("");
    setAttachmentFile(null);
    setAttachmentDescription("");
  };

  const loadVisualizations = async () => {
    if (!protocolId) return;
    setLoadingVisualizations(true);
    try {
      const { data } = await api.get(`/protocolos/${protocolId}/visualizacoes`);
      setVisualizations(Array.isArray(data) ? data : []);
      setProtocolDetail((prev) => (prev ? { ...prev, visualizations: Array.isArray(data) ? data : [] } : prev));
    } catch (error) {
      setMessage("Não foi possível carregar as visualizações do protocolo.");
    } finally {
      setLoadingVisualizations(false);
    }
  };

  const loadHistorico = async () => {
    if (!protocolId) return;
    setLoadingHistorico(true);
    try {
      const { data } = await api.get(`/protocolos/${protocolId}/historico`);
      setHistoricoMovements(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage("Não foi possível carregar o histórico do protocolo.");
    } finally {
      setLoadingHistorico(false);
    }
  };

  const filteredRecentProtocols = useMemo(() => {
    const items = Array.isArray(countInfo?.recentes) ? countInfo.recentes : [];
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((protocol) => {
      const haystack = [
        protocol?.numero,
        protocol?.assunto,
        protocol?.solicitante_nome,
        protocol?.solicitante_documento,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [countInfo?.recentes, search]);

  const loadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "home") {
        await router.replace("/protocolo/caixa-entrada");
        return;
      }

      if (mode === "estrutura" || mode === "novo" || mode === "detail") {
        const requests = [
          api.get("/protocolos/unidades-organizacionais"),
          api.get("/users"),
        ];
        if (mode === "novo") {
          requests.push(api.get("/protocolos/tipos"));
          requests.push(api.get("/protocolos/contexto-novo"));
        }
        const responses = await Promise.all(requests);
        const [unitsRes, usersRes, typesRes, contextRes] = responses;
        setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        if (mode === "novo") {
          setProtocolTypes(Array.isArray(typesRes?.data) ? typesRes.data : []);
          setCreationContext(contextRes?.data || null);
          setProtocolForm((current) => ({
            ...current,
            origem_unit_id: contextRes?.data?.origin?.id ? String(contextRes.data.origin.id) : "",
          }));
        }
        if (mode === "detail" && protocolId) {
          await loadDetail(protocolId);
        }
      } else if (mode === "alertas") {
        if (!forcedMode) {
          await router.replace("/sistema/alertas");
          return;
        }
        const { data } = await api.get("/protocolos/alertas");
        setAlerts(Array.isArray(data) ? data : []);
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
    setLogDrawerOpen(false);
    setVisualizations([]);
    setHistoricoMovements([]);

    return () => {
      if (protocolId) {
        activeProtocolViewSessions.delete(protocolId);
      }
    };
  }, [protocolId]);

  useEffect(() => {
    if (!router.isReady) return;
    if (mode === "inbox") {
      loadList().catch(() => setMessage("Não foi possível carregar a caixa de entrada."));
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

  const handleSubmitForward = async () => {
    await handleDetailAction("encaminhar", {
      destino_unit_id: detailForwardUnit || null,
      destino_user_id: detailForwardUser || null,
      observacao: detailForwardObservation || null,
    });
    setForwardDialogOpen(false);
  };

  const handleSubmitProtocol = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/protocolos", {
        ...protocolForm,
        origem_unit_id: protocolForm.origem_unit_id || null,
        destino_user_id: protocolForm.destino_user_id || null,
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
        condicoes: normalizeStringList(alertForm.condicoes),
        canais: normalizeStringList(alertForm.canais),
        destinatarios: normalizeStringList(alertForm.destinatarios),
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

  const handleOpenLogs = async () => {
    setLogDrawerOpen(true);
    await Promise.all([loadVisualizations(), loadHistorico()]);
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await api.get(`/protocolos/anexos/${attachment.id}/download`, {
        responseType: "blob",
      });
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
      if (!blob.size) {
        throw new Error("Arquivo vazio");
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.nome_original || "anexo";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
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
              setSearch(e.target.value);
            }}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Button variant="outlined" onClick={() => router.push("/protocolo/caixa-entrada")}>
            Ver caixa de entrada
          </Button>
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
            {filteredRecentProtocols.length > 0 ? filteredRecentProtocols.map((protocol) => (
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

      </BaseCard>
    </Box>
  );
  const renderDetail = () => {
    const p = protocolDetail || {};
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
              <Button variant="outlined" size="small" onClick={handleOpenLogs}>
                Logs do protocolo
              </Button>
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
            <Button variant="outlined" onClick={() => setForwardDialogOpen(true)}>
              Encaminhar
            </Button>
            <Button variant="contained" color="error" onClick={() => handleDetailAction("encerrar", { justificativa_encerramento: "Encerrado pelo usuário" })}>
              Encerrar
            </Button>
            <Button variant="outlined" onClick={() => handleDetailAction("reabrir")} disabled={p.status !== "encerrado"}>
              Reabrir
            </Button>
          </Stack>

        </BaseCard>

        <Dialog
          open={forwardDialogOpen}
          onClose={() => setForwardDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              border: "1px solid var(--lg-border)",
              background: "var(--lg-glass-panel)",
              backdropFilter: "var(--lg-blur-panel)",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Encaminhar protocolo</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, bgcolor: "transparent" }}>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Destino para encaminhamento</InputLabel>
              <Select
                value={detailForwardUnit}
                label="Destino para encaminhamento"
                onChange={(e) => setDetailForwardUnit(e.target.value)}
              >
                <MenuItem value="">Selecione</MenuItem>
                {unitOptions.map((unit) => (
                  <MenuItem key={unit.id} value={String(unit.id)}>
                    {`${"  ".repeat(unit.level)}${unit.nome}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Responsável opcional</InputLabel>
              <Select
                value={detailForwardUser}
                label="Responsável opcional"
                onChange={(e) => setDetailForwardUser(e.target.value)}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Observação"
              placeholder="Opcional: informe uma justificativa ou orientação para quem receber o protocolo."
              value={detailForwardObservation}
              onChange={(e) => setDetailForwardObservation(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForwardDialogOpen(false)} variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitForward}
              variant="contained"
              disabled={saving || !detailForwardUnit}
            >
              {saving ? "Encaminhando..." : "Encaminhar"}
            </Button>
          </DialogActions>
        </Dialog>

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

        <BaseCard title="Anexos do protocolo">
          <Stack spacing={0} divider={<Divider flexItem />}>
            {attachments.length > 0 ? attachments.map((attachment) => (
              <Stack
                key={attachment.id}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                gap={1.5}
                sx={{ py: 1.5 }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {attachment.nome_original}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {attachment.descricao || "Sem descrição"} • {attachment.user?.name || "—"} • {formatDateTime(attachment.created_at)}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={() => handleDownloadAttachment(attachment)}>
                  Baixar
                </Button>
              </Stack>
            )) : <Typography color="text.secondary" sx={{ py: 1 }}>Nenhum anexo enviado.</Typography>}
          </Stack>
        </BaseCard>

        {renderProtocolLogsDrawer()}
      </Box>
    );
  };

  const renderProtocolLogsDrawer = () => {
    const p = protocolDetail || {};
    const comments = Array.isArray(p.comments) ? p.comments : [];
    const movements = Array.isArray(historicoMovements) ? historicoMovements : [];
    const accessLogs = visualizations.map((view) => ({
      key: `view-${view.id}`,
      type: "Acesso",
      title: view.user?.name || "Usuário não identificado",
      detail: view.departamento || view.equipe || "Setor não informado",
      timestamp: view.visualized_at || view.created_at,
    }));
    const movementLogs = movements
      .filter((item) => item.acao !== "comentario")
      .map((item) => ({
        key: `movement-${item.id}`,
        type: "Movimentação",
        title: String(item.acao || "Ação").replace(/_/g, " "),
        detail: [
          item.user?.name || "Usuário não identificado",
          item.status_anterior && item.status_novo
            ? `${String(item.status_anterior).replace(/_/g, " ")} → ${String(item.status_novo).replace(/_/g, " ")}`
            : null,
          item.observacao,
        ].filter(Boolean).join(" • "),
        timestamp: item.created_at,
      }));
    const commentLogs = comments.map((comment) => ({
      key: `comment-${comment.id}`,
      type: comment.privado ? "Comentário privado" : "Comentário",
      title: comment.user?.name || "Usuário não identificado",
      detail: comment.conteudo,
      timestamp: comment.created_at,
    }));
    const logs = [...accessLogs, ...movementLogs, ...commentLogs].sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
    const loadingLogs = loadingVisualizations || loadingHistorico;

    return (
      <Drawer
        anchor="right"
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 480 },
            maxWidth: "100vw",
            bgcolor: "var(--lg-glass-panel)",
            color: "var(--lg-text-primary)",
            borderLeft: "1px solid var(--lg-border)",
            backdropFilter: "var(--lg-blur-panel)",
          },
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", minHeight: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Logs do protocolo</Typography>
              <Typography variant="caption" color="text.secondary">
                {p.numero || "Protocolo"} • {accessLogs.length} acessos • {movementLogs.length} movimentações • {commentLogs.length} comentários
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => setLogDrawerOpen(false)}>
              Fechar
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {loadingLogs ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
              <CircularProgress size={22} />
              <Typography variant="body2">Carregando logs...</Typography>
            </Box>
          ) : (
            <Stack spacing={0} divider={<Divider flexItem />}>
              {logs.length > 0 ? logs.map((log) => (
                <Box key={log.key} sx={{ py: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Chip size="small" variant="outlined" label={log.type} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(log.timestamp)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.75 }}>
                    {log.title}
                  </Typography>
                  {log.detail ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, whiteSpace: "pre-wrap" }}>
                      {log.detail}
                    </Typography>
                  ) : null}
                </Box>
              )) : (
                <Typography color="text.secondary" sx={{ py: 2 }}>Nenhum log registrado.</Typography>
              )}
            </Stack>
          )}

          <Box sx={{ flex: 1 }} />
        </Box>
      </Drawer>
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
                  {unitOptions.filter((unit) => unit.ativo !== false).map((unit) => (
                    <MenuItem key={unit.id} value={String(unit.id)}>
                      {`${"— ".repeat(unit.level || 0)}${unit.nome}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Destino</InputLabel>
              <Select
                value={protocolForm.destino_user_id}
                label="Destino"
                onChange={(e) => setProtocolForm((prev) => ({ ...prev, destino_user_id: e.target.value }))}
                required
              >
                <MenuItem value="">Selecione um usuário</MenuItem>
                {users.map((user) => (
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
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="outlined" onClick={() => router.push("/protocolo/caixa-entrada")}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? "Salvando..." : "Gravar"}</Button>
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
                  {unitOptions.map((unit) => <MenuItem key={unit.id} value={String(unit.id)}>{`${"  ".repeat(unit.level)}${unit.nome}`}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={unitForm.tipo}
                onChange={(e) => setUnitForm((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                {protocolUnitTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                value={alertForm.nome}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Módulo"
                value={alertForm.modulo}
                onChange={(e) =>
                  setAlertForm((prev) => ({
                    ...prev,
                    modulo: e.target.value,
                    gatilho: getAlertTriggerOptions(e.target.value)[0]?.value || "",
                  }))
                }
              >
                {alertModuleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Gatilho"
                value={alertForm.gatilho}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, gatilho: e.target.value }))}
              >
                {getAlertTriggerOptions(alertForm.modulo).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Frequência"
                value={alertForm.frequencia}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, frequencia: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MultiSelectField
                label="Motores de envio"
                helperText="WhatsApp e e-mail são configurados em suas páginas próprias."
                value={alertForm.canais}
                onChange={(value) => setAlertForm((prev) => ({ ...prev, canais: value }))}
                options={alertChannelOptions}
                placeholder="Ex.: whatsapp"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MultiSelectField
                label="Destinatários"
                helperText="Selecione destinatários predefinidos."
                value={alertForm.destinatarios}
                onChange={(value) => setAlertForm((prev) => ({ ...prev, destinatarios: value }))}
                options={alertRecipientOptions}
                placeholder="Ex.: administrador"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MultiSelectField
                label="Condições"
                helperText="Selecione condições predefinidas."
                value={alertForm.condicoes}
                onChange={(value) => setAlertForm((prev) => ({ ...prev, condicoes: value }))}
                options={alertConditionOptions}
                placeholder="Ex.: vencido"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Template"
                placeholder="Ex.: Olá {{nome}}, o alerta {{gatilho}} foi disparado para {{modulo}}."
                value={alertForm.template}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, template: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Descrição"
                placeholder="Explique quando o alerta deve ser usado e o que o usuário verá quando ele disparar."
                value={alertForm.descricao}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, descricao: e.target.value }))}
              />
            </Grid>
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
    if (mode === "detail") return renderDetail();
    return renderHome();
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page protocolo-page">
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





