import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Paperclip } from "lucide-react";
import AlertModal from "../../src/components/messagesModal";
import NewProtocolModal from "../../src/components/protocolo/NewProtocolModal";
import { AuthContext } from "../../src/contexts/AuthContext";
import { api } from "../../src/services/api";
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from "../../src/components/secretaria/CampoSecretariaObrigatorio";
import { Banner } from "../../src/components/ui/banner";
import { Button, buttonVariants } from "../../src/components/ui/button";
import { CabecalhoDePagina } from "../../src/components/ui/cabecalho-de-pagina";
import { CaixaDeMarcacao } from "../../src/components/ui/caixa-de-marcacao";
import { CampoDeBusca } from "../../src/components/ui/campo-de-busca";
import { CampoSelecao, CampoTexto } from "../../src/components/ui/campos";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Carregando } from "../../src/components/ui/carregando";
import { Dado } from "../../src/components/ui/dado";
import { DataTable } from "../../src/components/ui/data-table";
import { Dialogo, DialogoCabecalho, DialogoRodape, DialogoTitulo } from "../../src/components/ui/dialogo";
import { Gaveta } from "../../src/components/ui/gaveta";
import { Interruptor } from "../../src/components/ui/interruptor";
import { Paginacao } from "../../src/components/ui/paginacao";
import { Pilula, tomDaCor } from "../../src/components/ui/pilula";
import { StatCard } from "../../src/components/ui/stat-card";

const routes = {
  "caixa-entrada": "inbox",
  estrutura: "estrutura",
  alertas: "alertas",
};

const modeLabels = {
  home: "Caixa de Entrada",
  inbox: "Caixa de Entrada",
  estrutura: "Estrutura Organizacional",
  alertas: "Alertas",
  detail: "Detalhes do Protocolo",
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

const protocolUnitTypeOptions = [
  { value: "secretaria", label: "Secretaria" },
  { value: "departamento", label: "Departamento" },
  { value: "subdepartamento", label: "Subdepartamento" },
];

const alertModuleOptions = [
  { value: "protocolo", label: "Protocolo" },
  { value: "documentos", label: "Documentos" },
  { value: "almoxarifado", label: "Almoxarifado" },
  { value: "kanban", label: "Kanban" },
  { value: "oficios", label: "Ofícios" },
  { value: "chat", label: "Chat" },
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
  documentos: [
    { value: "documento_cadastrado", label: "Documento cadastrado" },
    { value: "documento_atualizado", label: "Documento atualizado" },
    { value: "documento_publicado", label: "Documento publicado" },
    { value: "solicitacao_exclusao_pendente", label: "Solicitação de exclusão pendente" },
    { value: "solicitacao_exclusao_aprovada", label: "Solicitação de exclusão aprovada" },
    { value: "solicitacao_exclusao_rejeitada", label: "Solicitação de exclusão rejeitada" },
  ],
  almoxarifado: [
    { value: "requisicao_criada", label: "Requisição criada" },
    { value: "requisicao_em_analise", label: "Requisição em análise" },
    { value: "requisicao_aprovada", label: "Requisição aprovada" },
    { value: "requisicao_recusada", label: "Requisição recusada" },
    { value: "requisicao_em_separacao", label: "Requisição em separação" },
    { value: "requisicao_em_processo_de_entrega", label: "Requisição em processo de entrega" },
    { value: "requisicao_entregue", label: "Requisição entregue" },
    { value: "requisicao_cancelada", label: "Requisição cancelada" },
  ],
  kanban: [
    { value: "kanban_item_criado", label: "Item criado" },
    { value: "kanban_item_atualizado", label: "Item atualizado" },
    { value: "kanban_status_alterado", label: "Status alterado" },
  ],
  oficios: [
    { value: "oficio_cadastrado", label: "Ofício cadastrado" },
    { value: "oficio_atualizado", label: "Ofício atualizado" },
    { value: "oficio_protocolo_criado", label: "Protocolo criado a partir do ofício" },
  ],
  chat: [
    { value: "chat_conversa_iniciada", label: "Conversa iniciada" },
    { value: "chat_mensagem_enviada", label: "Mensagem enviada" },
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
  { value: "assinantes_exclusao_documento", label: "Assinantes da exclusão do documento" },
  { value: "solicitante_documento", label: "Solicitante do documento" },
  { value: "criador_documento", label: "Criador do documento" },
  { value: "solicitante_almoxarifado", label: "Solicitante da requisição" },
  { value: "responsavel_almoxarifado", label: "Responsável da requisição" },
  { value: "aprovadores_almoxarifado", label: "Usuários que podem aprovar" },
  { value: "entregadores_almoxarifado", label: "Usuários que podem entregar" },
  { value: "criador_kanban", label: "Criador do item do kanban" },
  { value: "responsavel_kanban", label: "Responsável do item do kanban" },
  { value: "criador_oficio", label: "Criador do ofício" },
  { value: "destinatario_protocolo_oficio", label: "Destinatário do protocolo do ofício" },
  { value: "remetente_chat", label: "Remetente da mensagem" },
  { value: "destinatario_chat", label: "Destinatário da mensagem" },
  { value: "participantes_chat", label: "Participantes da conversa" },
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
  const alterna = (optionValue, marcado) =>
    onChange(normalizeStringList(marcado ? [...selected, optionValue] : selected.filter((entry) => entry !== optionValue)));

  return (
    <fieldset className="min-w-0 space-y-1">
      <legend className="text-[13px] text-muted-foreground">{label}</legend>
      <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-input bg-background p-3">
        {options.length === 0 ? <span className="text-sm text-muted-foreground">{placeholder || "Selecione"}</span> : null}
        {options.map((option) => (
          <CaixaDeMarcacao
            key={option.value}
            id={`${label}-${option.value}`}
            marcado={selected.indexOf(option.value) > -1}
            aoMudar={(marcado) => alterna(option.value, marcado)}
          >
            {option.label}
          </CaixaDeMarcacao>
        ))}
      </div>
      {helperText ? <p className="text-[11px] text-muted-foreground">{helperText}</p> : null}
    </fieldset>
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
    devolvido: "warning",
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

const MAX_CELL_CHARS = 25;

const truncateText = (value, max = MAX_CELL_CHARS) => {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

// Usuário responsável (quando definido) ou, na falta dele, a unidade de destino.
const destinoLabel = (protocol) =>
  protocol.responsavel_atual?.name || protocol.destino_unit?.nome || "";

// Prazo anterior a hoje e protocolo ainda em aberto (não encerrado/concluído/cancelado).
const isOverdue = (protocol) => {
  if (!protocol.prazo_atendimento || protocol.cancelado_em || protocol.encerrado_em) return false;
  if (["encerrado", "concluido", "cancelado"].includes(String(protocol.status || "").toLowerCase())) return false;
  const due = new Date(protocol.prazo_atendimento);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const isUrgent = (protocol) => String(protocol.prioridade || "").toLowerCase() === "urgente";

const renderConclusaoOuMovimentacao = (protocol) => {
  const finalizadoEm = protocol.cancelado_em || protocol.encerrado_em;
  if (finalizadoEm) {
    const label = protocol.cancelado_em ? "Cancelado em" : "Concluído em";
    return `${label} ${formatDateTime(finalizadoEm)}`;
  }
  const ultima = protocol.ultima_movimentacao_em || protocol.updated_at;
  return ultima ? `Últ. mov. ${formatDateTime(ultima)}` : "—";
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
  const { username, user: loggedUserId, profile: loggedProfile } = useContext(AuthContext);
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
  const [showInactiveUnits, setShowInactiveUnits] = useState(false);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [unitForm, setUnitForm] = useState(initialUnitForm);
  const secretariaUnidade = useSecretariaObrigatoria();
  const [alertForm, setAlertForm] = useState(initialAlertForm);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [situacao, setSituacao] = useState("abertos");
  const [detailForwardUnit, setDetailForwardUnit] = useState("");
  const [detailForwardUser, setDetailForwardUser] = useState("");
  const [forwardEligibleUsers, setForwardEligibleUsers] = useState([]);
  const [detailForwardObservation, setDetailForwardObservation] = useState("");
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnMotivo, setReturnMotivo] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentPrivate, setCommentPrivate] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentDescription, setAttachmentDescription] = useState("");
  const [visualizations, setVisualizations] = useState([]);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [loadingVisualizations, setLoadingVisualizations] = useState(false);
  const [historicoMovements, setHistoricoMovements] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [novoModalOpen, setNovoModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deletingUnit, setDeletingUnit] = useState(null);

  const unitOptions = useMemo(() => flattenUnits(units), [units]);
  // Filtro só visual (sem nova requisição): por padrão a tabela oculta estruturas inativas.
  const visibleUnits = useMemo(
    () => (showInactiveUnits ? unitOptions : unitOptions.filter((unit) => unit.ativo)),
    [unitOptions, showInactiveUnits]
  );
  const unitById = useMemo(() => {
    const map = new Map();
    unitOptions.forEach((unit) => {
      map.set(String(unit.id), unit);
    });
    return map;
  }, [unitOptions]);

  const loadList = async () => {
    const [countsRes, inboxRes] = await Promise.all([
      api.get("/protocolos/contadores"),
      api.get("/protocolos/caixa-entrada", {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
          search: search || undefined,
          situacao,
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

  const loadDetail = async (id, { resetForms = true } = {}) => {
    const { data } = await api.get(`/protocolos/${id}`, {
      params: { view_session: getProtocolViewSession(id) },
    });
    setProtocolDetail(data || null);
    setDetailForwardUnit(String(data?.destino_unit_id || ""));
    setDetailForwardUser(String(data?.responsavel_atual_id || ""));
    if (resetForms) {
      setDetailForwardObservation("");
      setForwardDialogOpen(false);
      setCommentText("");
      setAttachmentFile(null);
      setAttachmentDescription("");
    }
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

  const loadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "estrutura" || mode === "detail") {
        // /users é restrito a administradores (403 para os demais); a lista só
        // serve para rotular nomes no log, então a falha não pode derrubar a tela.
        const [unitsRes, usersRes] = await Promise.all([
          api.get("/protocolos/unidades-organizacionais"),
          api.get("/users").catch(() => ({ data: [] })),
        ]);
        setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
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

  // Só usuários que pertencem à unidade escolhida E cujo perfil tem acesso à
  // página /protocolo podem ser escolhidos como responsável no encaminhamento
  // — do contrário o protocolo fica endereçado a alguém que nunca vai
  // conseguir abrir a tela para vê-lo/recebê-lo.
  useEffect(() => {
    let cancelled = false;

    setDetailForwardUser("");

    if (!detailForwardUnit) {
      setForwardEligibleUsers([]);
      return undefined;
    }

    api
      .get("/protocolos/usuarios-elegiveis", { params: { unit_id: detailForwardUnit } })
      .then(({ data }) => {
        if (!cancelled) setForwardEligibleUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setForwardEligibleUsers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [detailForwardUnit]);

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
  }, [page, rowsPerPage, search, situacao, router.isReady, mode]);

  const currentTitle = modeLabels[mode] || "Protocolo";

  const refreshDetail = async () => {
    if (!protocolId) return;
    try {
      await loadDetail(protocolId, { resetForms: false });
    } catch (error) {
      setMessage("Não foi possível recarregar o protocolo.");
    }
  };

  const handleDetailAction = async (action, payload = {}) => {
    if (!protocolId) return false;
    setSaving(true);
    setMessage("");
    try {
      const { data } = await api.post(`/protocolos/${protocolId}/${action}`, payload);
      setProtocolDetail(data || null);
      setMessage("Ação executada com sucesso.");
      return true;
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível executar a ação.");
      return false;
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

  const handleSubmitReturn = async () => {
    const ok = await handleDetailAction("devolver", { motivo: returnMotivo.trim() });
    if (ok) {
      setReturnDialogOpen(false);
      setReturnMotivo("");
    }
  };

  const handleSubmitUnit = async (event) => {
    event.preventDefault();
    if (!secretariaUnidade.validar()) return;
    setSaving(true);
    setMessage("");
    try {
      await api.post("/protocolos/unidades-organizacionais", {
        ...unitForm,
        ...secretariaUnidade.payload(),
        parent_id: unitForm.parent_id || null,
      });
      setMessage("Unidade cadastrada com sucesso.");
      setUnitForm(initialUnitForm);
      secretariaUnidade.limpar();
      await loadData();
    } catch (error) {
      if (secretariaUnidade.tratarErro(error)) return;
      setMessage("Não foi possível cadastrar a unidade.");
    } finally {
      setSaving(false);
    }
  };

  const openEditUnit = (unit) =>
    setEditingUnit({
      id: unit.id,
      parent_id: unit.parent_id ? String(unit.parent_id) : "",
      tipo: unit.tipo || "secretaria",
      codigo: unit.codigo || "",
      nome: unit.nome || "",
      descricao: unit.descricao || "",
      ativo: Boolean(unit.ativo),
    });

  // Unidade pai não pode ser a própria unidade nem uma de suas subunidades.
  const editParentOptions = useMemo(() => {
    if (!editingUnit) return [];
    const blocked = new Set([String(editingUnit.id)]);
    let changed = true;
    while (changed) {
      changed = false;
      unitOptions.forEach((unit) => {
        if (unit.parent_id && blocked.has(String(unit.parent_id)) && !blocked.has(String(unit.id))) {
          blocked.add(String(unit.id));
          changed = true;
        }
      });
    }
    return unitOptions.filter((unit) => !blocked.has(String(unit.id)));
  }, [editingUnit, unitOptions]);

  const handleSubmitEditUnit = async (event) => {
    event.preventDefault();
    if (!editingUnit) return;
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/protocolos/unidades-organizacionais/${editingUnit.id}`, {
        parent_id: editingUnit.parent_id || null,
        tipo: editingUnit.tipo,
        codigo: editingUnit.codigo || null,
        nome: editingUnit.nome,
        descricao: editingUnit.descricao || null,
        ativo: editingUnit.ativo,
      });
      setEditingUnit(null);
      setMessage("Unidade atualizada com sucesso.");
      await loadData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível atualizar a unidade.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteUnit = async () => {
    if (!deletingUnit) return;
    setSaving(true);
    setMessage("");
    try {
      await api.delete(`/protocolos/unidades-organizacionais/${deletingUnit.id}`);
      setDeletingUnit(null);
      setMessage("Unidade excluída (inativada) com sucesso.");
      await loadData();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Não foi possível excluir a unidade.");
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
      const { data } = await api.post(`/protocolos/${protocolId}/comentarios`, {
        conteudo: commentText.trim(),
        privado: commentPrivate,
        tipo: "comentario",
      });
      setProtocolDetail(data || null);
      setCommentText("");
      setCommentPrivate(false);
      setMessage("Comentário adicionado com sucesso.");
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
      setAttachmentFile(null);
      setAttachmentDescription("");
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

  const colunasProtocolos = [
    {
      chave: "numero",
      titulo: "Número / Remetente",
      render: (protocol) => (
        <>
          <span className="block text-sm">{protocol.numero}</span>
          <span className="block text-xs text-muted-foreground" title={protocol.criado_por?.name || ""} data-testid="protocolo-remetente">
            {protocol.criado_por?.name ? `De: ${truncateText(protocol.criado_por.name)}` : "—"}
          </span>
        </>
      ),
    },
    {
      chave: "assunto",
      titulo: "Assunto / Destino",
      render: (protocol) => (
        <>
          <span title={protocol.assunto || ""}>{truncateText(protocol.assunto)}</span>
          {Number(protocol.attachments_count) > 0 && (
            <span
              title={`${protocol.attachments_count} arquivo(s) anexado(s)`}
              aria-label="Possui anexo"
              data-testid="protocolo-anexo-icon"
              className="ml-2 inline-flex align-middle text-muted-foreground"
            >
              <Paperclip className="size-4" aria-hidden />
            </span>
          )}
          <span className="block text-xs text-muted-foreground" title={destinoLabel(protocol)} data-testid="protocolo-destino">
            {destinoLabel(protocol) ? `Para: ${truncateText(destinoLabel(protocol))}` : "—"}
          </span>
        </>
      ),
    },
    {
      chave: "prioridade",
      titulo: "Prioridade",
      render: (protocol) => <Pilula tom={isUrgent(protocol) ? "perigo" : "neutro"}>{protocol.prioridade || "normal"}</Pilula>,
    },
    {
      chave: "status",
      titulo: "Status",
      render: (protocol) => <Pilula tom={tomDaCor(statusColor(protocol.status))}>{String(protocol.status || "").replace(/_/g, " ") || "—"}</Pilula>,
    },
    { chave: "criado", titulo: "Criado em", render: (protocol) => <span className="whitespace-nowrap">{formatDateTime(protocol.created_at)}</span> },
    {
      chave: "prazo",
      titulo: "Prazo / Conclusão",
      render: (protocol) => (
        <>
          <span className={`block text-sm ${isOverdue(protocol) ? "font-semibold text-danger-text" : ""}`}>
            {formatDate(protocol.prazo_atendimento)}{isOverdue(protocol) ? " (vencido)" : ""}
          </span>
          <span className="block text-xs text-muted-foreground" data-testid="protocolo-conclusao-movimentacao">
            {renderConclusaoOuMovimentacao(protocol)}
          </span>
        </>
      ),
    },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (protocol) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/protocolo/${protocol.id}`); }}>
          Abrir
        </Button>
      ),
    },
  ];

  const renderHome = () => (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard titulo="Novos" valor={countInfo?.novos ?? 0} tom="info" />
        <StatCard titulo="Vencem em breve" valor={countInfo?.vence_em_breve ?? 0} tom="primario" />
        <StatCard titulo="Vencidos" valor={countInfo?.vencidos ?? 0} tom="perigo" />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <CampoDeBusca
          rotulo="Pesquisar protocolo"
          placeholder="Pesquisar protocolo"
          className="min-w-[260px] flex-[1_1_280px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <CampoSelecao
          id="protocolo-situacao"
          label="Situação"
          value={situacao}
          data-testid="protocolo-filtro-situacao"
          className="min-w-[160px]"
          onChange={(e) => {
            setSituacao(e.target.value);
            setPage(0);
          }}
        >
          <option value="abertos">Abertos</option>
          <option value="concluidos">Concluídos</option>
          <option value="todos">Todos</option>
        </CampoSelecao>
        <Button onClick={() => setNovoModalOpen(true)}>
          + Novo Protocolo
        </Button>
      </div>

      <div>
        <DataTable
          rotulo="protocolos"
          colunas={colunasProtocolos}
          linhas={protocols}
          chaveDaLinha={(protocol) => protocol.id}
          vazio="Nenhum protocolo encontrado."
          aoAbrir={(protocol) => router.push(`/protocolo/${protocol.id}`)}
          propsDaLinha={(protocol) => (isOverdue(protocol) ? { "data-overdue": "true", className: "bg-danger/10 hover:bg-danger/20" } : {})}
        />
        <Paginacao
          total={total}
          pagina={page}
          porPagina={rowsPerPage}
          opcoes={[15, 25, 50, 100]}
          aoMudarPagina={setPage}
          aoMudarPorPagina={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </div>

      <NewProtocolModal
        open={novoModalOpen}
        onClose={() => setNovoModalOpen(false)}
        onCreated={(successMessage) => {
          setNovoModalOpen(false);
          setMessage(successMessage);
          loadList();
        }}
      />
    </div>
  );
  // Volta para a página anterior do histórico do navegador; sem histórico (aba aberta
  // direto pelo link), cai na caixa de entrada.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/protocolo/caixa-entrada");
    }
  };

  const renderDetail = () => {
    if (!protocolDetail?.id) {
      return (
        <div><Button variant="outline" onClick={goBack}>Voltar</Button></div>
      );
    }
    const p = protocolDetail;
    const attachments = Array.isArray(p.attachments) ? p.attachments : [];
    const comments = (Array.isArray(p.comments) ? [...p.comments] : [])
      .filter((comment) => comment?.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle>{`Protocolo ${p.numero || ""}`}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Button variant="outline" size="sm" onClick={goBack} aria-label="Voltar à página anterior">
                ← Voltar
              </Button>
            </div>
            <div className="flex flex-wrap justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold">{p.assunto || "Sem assunto"}</h2>
                <p className="text-sm text-muted-foreground">{p.descricao || "Sem descrição"}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Pilula tom={tomDaCor(statusColor(p.status))}>{String(p.status || "—").replace(/_/g, " ")}</Pilula>
                <Pilula tom="neutro">{p.prioridade || "normal"}</Pilula>
                <Button variant="outline" size="sm" onClick={handleOpenLogs}>
                  Movimentação
                </Button>
              </div>
            </div>

            {p.status === "devolvido" && p.justificativa_devolucao && (
              <Banner tom="alerta">
                <strong className="block">
                  Protocolo devolvido{p.devolvido_em ? ` em ${formatDateTime(p.devolvido_em)}` : ""}
                </strong>
                {p.justificativa_devolucao}
              </Banner>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Dado rotulo="Solicitante">{p.solicitante_nome || "—"}</Dado>
              <Dado rotulo="Documento">{p.solicitante_documento || "—"}</Dado>
              <Dado rotulo="Prazo">{formatDate(p.prazo_atendimento)}</Dado>
              <Dado rotulo="Origem">{p.origem_unit?.nome || "—"}</Dado>
              <Dado rotulo="Destino">{p.destino_unit?.nome || "—"}</Dado>
              <Dado rotulo="Responsável">{p.responsavel_atual?.name || "—"}</Dado>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={goBack}>Voltar</Button>
              {!p.recebido_em && (
                loggedProfile === "admin"
                || (p.responsavel_atual_id ? String(p.responsavel_atual_id) === String(loggedUserId) : String(p.criado_por_id) !== String(loggedUserId))
              ) && (
                <Button onClick={() => handleDetailAction("receber")}>Receber</Button>
              )}
              <Button variant="outline" onClick={() => setForwardDialogOpen(true)}>
                Encaminhar
              </Button>
              {p.pode_devolver && (
                <Button variant="outline" onClick={() => setReturnDialogOpen(true)}>
                  Devolver ao remetente
                </Button>
              )}
              <Button variant="destructive" onClick={() => handleDetailAction("encerrar", { justificativa_encerramento: "Encerrado pelo usuário" })}>
                Encerrar
              </Button>
              <Button variant="outline" onClick={() => handleDetailAction("reabrir")} disabled={p.status !== "encerrado"}>
                Reabrir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialogo aberto={forwardDialogOpen} aoFechar={() => setForwardDialogOpen(false)} tamanho="md">
          <DialogoCabecalho>
            <DialogoTitulo>Encaminhar protocolo</DialogoTitulo>
          </DialogoCabecalho>
          <div className="flex flex-col gap-4">
            <CampoSelecao
              id="enc-destino"
              label="Destino para encaminhamento"
              value={detailForwardUnit}
              onChange={(e) => setDetailForwardUnit(e.target.value)}
            >
              <option value="">Selecione</option>
              {unitOptions.map((unit) => (
                <option key={unit.id} value={String(unit.id)}>
                  {`${"  ".repeat(unit.level)}${unit.nome}`}
                </option>
              ))}
            </CampoSelecao>

            <CampoSelecao
              id="enc-responsavel"
              label="Responsável opcional"
              value={detailForwardUser}
              onChange={(e) => setDetailForwardUser(e.target.value)}
              dica={detailForwardUnit && forwardEligibleUsers.length === 0
                ? 'Nenhum usuário com acesso à página "Protocolo" foi encontrado — libere a página em Gestão de Perfis para poder escolher um responsável específico. Sem responsável, o protocolo fica endereçado à unidade inteira.'
                : undefined}
            >
              <option value="">Nenhum (fica endereçado à unidade inteira)</option>
              {forwardEligibleUsers.map((user) => (
                <option key={user.id} value={String(user.id)}>
                  {user.name}
                </option>
              ))}
            </CampoSelecao>

            <CampoTexto
              id="enc-observacao"
              label="Observação"
              multiline
              rows={3}
              placeholder="Opcional: informe uma justificativa ou orientação para quem receber o protocolo."
              value={detailForwardObservation}
              onChange={(e) => setDetailForwardObservation(e.target.value)}
            />
          </div>
          <DialogoRodape>
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitForward} disabled={saving || !detailForwardUnit}>
              {saving ? "Encaminhando..." : "Encaminhar"}
            </Button>
          </DialogoRodape>
        </Dialogo>

        <Dialogo aberto={returnDialogOpen} aoFechar={() => setReturnDialogOpen(false)} tamanho="md">
          <DialogoCabecalho>
            <DialogoTitulo>Devolver protocolo ao remetente</DialogoTitulo>
          </DialogoCabecalho>
          <div className="flex flex-col gap-4">
            {p.devolver_para && (
              <p className="text-sm text-muted-foreground">
                O protocolo voltará para <strong>{p.devolver_para}</strong>, que fez o último encaminhamento.
              </p>
            )}
            <CampoTexto
              id="dev-motivo"
              obrigatorio
              required
              label="Motivo da devolução e adequações necessárias"
              multiline
              rows={3}
              placeholder="Descreva por que o protocolo está sendo devolvido e o que precisa ser ajustado antes de reenviar."
              value={returnMotivo}
              onChange={(e) => setReturnMotivo(e.target.value)}
            />
          </div>
          <DialogoRodape>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitReturn} disabled={saving || returnMotivo.trim().length < 5}>
              {saving ? "Devolvendo..." : "Devolver"}
            </Button>
          </DialogoRodape>
        </Dialogo>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Comentário</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitComment} className="flex flex-col gap-4">
                <CampoTexto
                  id="com-texto"
                  label="Escreva um comentário"
                  multiline
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Interruptor id="com-privado" marcado={commentPrivate} aoMudar={setCommentPrivate}>
                  Comentário privado
                </Interruptor>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || !commentText.trim()}>
                    {saving ? "Salvando..." : "Comentar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Anexar documento</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAttachment} className="flex flex-col gap-4">
                <CampoTexto
                  id="anx-descricao"
                  label="Descrição do anexo"
                  value={attachmentDescription}
                  onChange={(e) => setAttachmentDescription(e.target.value)}
                />
                <label className={`${buttonVariants({ variant: "outline" })} cursor-pointer`}>
                  {attachmentFile ? attachmentFile.name : "Selecionar arquivo"}
                  <input
                    hidden
                    type="file"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  />
                </label>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || !attachmentFile}>
                    {saving ? "Enviando..." : "Enviar anexo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Anexos do protocolo</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {attachments.length > 0 ? attachments.map((attachment) => (
                <div key={attachment.id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{attachment.nome_original}</p>
                    <span className="text-xs text-muted-foreground">
                      {attachment.descricao || "Sem descrição"} • {attachment.user?.name || "—"} • {formatDateTime(attachment.created_at)}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadAttachment(attachment)}>
                    Baixar
                  </Button>
                </div>
              )) : <p className="py-2 text-muted-foreground">Nenhum anexo enviado.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Comentários</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {comments.length > 0 ? comments.map((comment) => (
                <div key={comment.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{comment.user?.name || "Usuário não identificado"}</p>
                    <div className="flex items-center gap-2">
                      {comment.privado ? <Pilula tom="neutro" contorno>Privado</Pilula> : null}
                      <span className="text-xs text-muted-foreground">{formatDateTime(comment.created_at)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{comment.conteudo}</p>
                </div>
              )) : <p className="py-2 text-muted-foreground">Nenhum comentário registrado.</p>}
            </div>
          </CardContent>
        </Card>

        {renderProtocolLogsDrawer()}
      </div>
    );
  };

  const renderProtocolLogsDrawer = () => {
    const p = protocolDetail || {};
    const movements = Array.isArray(historicoMovements) ? historicoMovements : [];
    const findUnitName = (id) => unitOptions.find((unit) => Number(unit.id) === Number(id))?.nome;
    const findUserName = (id) => users.find((user) => Number(user.id) === Number(id))?.name;
    const accessLogs = visualizations.map((view) => ({
      key: `view-${view.id}`,
      type: "Acesso",
      title: view.user?.name || "Usuário não identificado",
      detail: view.departamento || view.equipe || "Setor não informado",
      timestamp: view.visualized_at || view.created_at,
    }));
    const movementLogs = movements
      .filter((item) => item.acao !== "comentario")
      .map((item) => {
        const destinationUnit = findUnitName(item.dados?.destino_unit_id);
        const destinationUser = findUserName(item.dados?.destino_user_id);

        return {
          key: `movement-${item.id}`,
          type: "Movimentação",
          title: String(item.acao || "Ação").replace(/_/g, " "),
          detail: [
            `Usuário: ${item.user?.name || "Não identificado"}`,
            item.status_anterior && item.status_novo
              ? `Status: ${String(item.status_anterior).replace(/_/g, " ")} → ${String(item.status_novo).replace(/_/g, " ")}`
              : null,
            destinationUnit ? `Destino: ${destinationUnit}` : null,
            destinationUser ? `Responsável: ${destinationUser}` : null,
            item.observacao ? `Descrição: ${item.observacao}` : null,
          ].filter(Boolean).join("\n"),
          timestamp: item.created_at,
        };
      });
    const logs = [...accessLogs, ...movementLogs]
      .filter((log) => log.timestamp)
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    const loadingLogs = loadingVisualizations || loadingHistorico;

    return (
      <Gaveta
        aberto={logDrawerOpen}
        aoFechar={() => setLogDrawerOpen(false)}
        titulo="Movimentação"
        subtitulo={`${p.numero || "Protocolo"} • ${accessLogs.length} acessos • ${movementLogs.length} movimentações`}
      >
        {loadingLogs ? (
          <Carregando>Carregando movimentações...</Carregando>
        ) : (
          <div className="divide-y divide-border">
            {logs.length > 0 ? logs.map((log) => (
              <div key={log.key} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <Pilula tom="neutro" contorno>{log.type}</Pilula>
                  <span className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                </div>
                <p className="mt-1.5 text-sm font-bold">{log.title}</p>
                {log.detail ? (
                  <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{log.detail}</p>
                ) : null}
              </div>
            )) : (
              <p className="py-4 text-muted-foreground">Nenhuma movimentação ou acesso registrado.</p>
            )}
          </div>
        )}
      </Gaveta>
    );
  };

  const colunasUnidades = [
    { chave: "nome", titulo: "Nome", render: (unit) => <span style={{ paddingLeft: `${unit.level * 16}px` }} className="block">{unit.nome}</span> },
    { chave: "tipo", titulo: "Tipo", render: (unit) => unit.tipo },
    { chave: "codigo", titulo: "Código", render: (unit) => unit.codigo || "—" },
    { chave: "status", titulo: "Status", render: (unit) => <Pilula tom={unit.ativo ? "sucesso" : "neutro"}>{unit.ativo ? "Ativo" : "Inativo"}</Pilula> },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (unit) => (
        <span className="inline-flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditUnit(unit)}>Editar</Button>
          <Button size="sm" variant="outline" className="text-danger-text" disabled={!unit.ativo} onClick={() => setDeletingUnit(unit)}>Excluir</Button>
        </span>
      ),
    },
  ];

  const renderStructure = () => (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="outline" size="sm" onClick={goBack} aria-label="Voltar à página anterior">
          ← Voltar
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Nova unidade organizacional</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitUnit} className="flex flex-col gap-4">
            <CampoSecretariaObrigatorio controle={secretariaUnidade} id="un-secretaria" />
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <CampoSelecao id="un-pai" label="Unidade pai" value={unitForm.parent_id} onChange={(e) => setUnitForm((prev) => ({ ...prev, parent_id: e.target.value }))}>
                  <option value="">Nenhuma</option>
                  {unitOptions.map((unit) => <option key={unit.id} value={String(unit.id)}>{`${"  ".repeat(unit.level)}${unit.nome}`}</option>)}
                </CampoSelecao>
              </div>
              <div className="md:col-span-4">
                <CampoSelecao id="un-tipo" label="Tipo" value={unitForm.tipo} onChange={(e) => setUnitForm((prev) => ({ ...prev, tipo: e.target.value }))}>
                  {protocolUnitTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </CampoSelecao>
              </div>
              <div className="md:col-span-4">
                <CampoTexto id="un-codigo" label="Código" value={unitForm.codigo} onChange={(e) => setUnitForm((prev) => ({ ...prev, codigo: e.target.value }))} />
              </div>
              <div className="md:col-span-6">
                <CampoTexto id="un-nome" label="Nome" value={unitForm.nome} onChange={(e) => setUnitForm((prev) => ({ ...prev, nome: e.target.value }))} />
              </div>
              <div className="md:col-span-6">
                <CampoTexto id="un-descricao" label="Descrição" value={unitForm.descricao} onChange={(e) => setUnitForm((prev) => ({ ...prev, descricao: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Estrutura cadastrada</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CaixaDeMarcacao
            id="estrutura-inativas"
            marcado={showInactiveUnits}
            aoMudar={setShowInactiveUnits}
            data-testid="estrutura-mostrar-inativas"
          >
            Exibir todos, inclusive inativos
          </CaixaDeMarcacao>
          <DataTable
            rotulo="estrutura cadastrada"
            colunas={colunasUnidades}
            linhas={visibleUnits}
            chaveDaLinha={(unit) => unit.id}
            vazio="Nenhuma unidade cadastrada."
          />
        </CardContent>
      </Card>

      <Dialogo aberto={Boolean(editingUnit)} aoFechar={() => setEditingUnit(null)} tamanho="md">
        <DialogoCabecalho>
          <DialogoTitulo>Editar unidade organizacional</DialogoTitulo>
        </DialogoCabecalho>
        {editingUnit ? (
          <form onSubmit={handleSubmitEditUnit} className="flex flex-col gap-4">
            <CampoSelecao
              id="ed-pai"
              label="Unidade pai"
              value={editingUnit.parent_id}
              onChange={(e) => setEditingUnit((prev) => ({ ...prev, parent_id: e.target.value }))}
            >
              <option value="">Nenhuma</option>
              {editParentOptions.map((unit) => (
                <option key={unit.id} value={String(unit.id)}>{`${"  ".repeat(unit.level)}${unit.nome}`}</option>
              ))}
            </CampoSelecao>
            <CampoSelecao id="ed-tipo" label="Tipo" value={editingUnit.tipo} onChange={(e) => setEditingUnit((prev) => ({ ...prev, tipo: e.target.value }))}>
              {protocolUnitTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </CampoSelecao>
            <CampoTexto id="ed-codigo" label="Código" value={editingUnit.codigo} onChange={(e) => setEditingUnit((prev) => ({ ...prev, codigo: e.target.value }))} />
            <CampoTexto id="ed-nome" label="Nome" obrigatorio required value={editingUnit.nome} onChange={(e) => setEditingUnit((prev) => ({ ...prev, nome: e.target.value }))} />
            <CampoTexto id="ed-descricao" label="Descrição" value={editingUnit.descricao} onChange={(e) => setEditingUnit((prev) => ({ ...prev, descricao: e.target.value }))} />
            <Interruptor id="ed-ativo" marcado={editingUnit.ativo} aoMudar={(marcado) => setEditingUnit((prev) => ({ ...prev, ativo: marcado }))}>
              Ativo
            </Interruptor>
            <DialogoRodape className="mt-1">
              <Button type="button" variant="outline" onClick={() => setEditingUnit(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving || !editingUnit.nome.trim()}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogoRodape>
          </form>
        ) : null}
      </Dialogo>

      <Dialogo aberto={Boolean(deletingUnit)} aoFechar={() => setDeletingUnit(null)} tamanho="sm">
        <DialogoCabecalho>
          <DialogoTitulo>Excluir unidade</DialogoTitulo>
        </DialogoCabecalho>
        <p>
          Excluir a unidade "{deletingUnit?.nome}"? Ela será inativada e deixará de aparecer para novos protocolos; os protocolos já existentes são preservados.
        </p>
        <DialogoRodape>
          <Button variant="outline" onClick={() => setDeletingUnit(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirmDeleteUnit} disabled={saving}>
            {saving ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogoRodape>
      </Dialogo>
    </div>
  );

  const colunasAlertas = [
    { chave: "nome", titulo: "Nome", render: (alert) => alert.nome },
    { chave: "modulo", titulo: "Módulo", render: (alert) => alert.modulo },
    { chave: "gatilho", titulo: "Gatilho", render: (alert) => alert.gatilho },
    { chave: "status", titulo: "Status", render: (alert) => <Pilula tom={alert.ativo ? "sucesso" : "neutro"}>{alert.ativo ? "Ativo" : "Inativo"}</Pilula> },
  ];

  const renderAlerts = () => (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Novo alerta</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitAlert} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <CampoTexto
                  id="al-nome"
                  label="Nome"
                  value={alertForm.nome}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="md:col-span-6">
                <CampoSelecao
                  id="al-modulo"
                  label="Módulo"
                  value={alertForm.modulo}
                  onChange={({ target: { value } }) =>
                    setAlertForm((prev) => ({
                      ...prev,
                      modulo: value,
                      gatilho: getAlertTriggerOptions(value)[0]?.value || "",
                    }))
                  }
                >
                  {alertModuleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </CampoSelecao>
              </div>
              <div className="md:col-span-6">
                <CampoSelecao
                  id="al-gatilho"
                  label="Gatilho"
                  value={alertForm.gatilho}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, gatilho: e.target.value }))}
                >
                  {getAlertTriggerOptions(alertForm.modulo).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </CampoSelecao>
              </div>
              <div className="md:col-span-6">
                <CampoTexto
                  id="al-frequencia"
                  label="Frequência"
                  value={alertForm.frequencia}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, frequencia: e.target.value }))}
                />
              </div>
              <div className="md:col-span-4">
                <MultiSelectField
                  label="Motores de envio"
                  helperText="WhatsApp e e-mail são configurados em suas páginas próprias."
                  value={alertForm.canais}
                  onChange={(value) => setAlertForm((prev) => ({ ...prev, canais: value }))}
                  options={alertChannelOptions}
                  placeholder="Ex.: whatsapp"
                />
              </div>
              <div className="md:col-span-4">
                <MultiSelectField
                  label="Destinatários"
                  helperText="Selecione destinatários predefinidos."
                  value={alertForm.destinatarios}
                  onChange={(value) => setAlertForm((prev) => ({ ...prev, destinatarios: value }))}
                  options={alertRecipientOptions}
                  placeholder="Ex.: administrador"
                />
              </div>
              <div className="md:col-span-4">
                <MultiSelectField
                  label="Condições"
                  helperText="Selecione condições predefinidas."
                  value={alertForm.condicoes}
                  onChange={(value) => setAlertForm((prev) => ({ ...prev, condicoes: value }))}
                  options={alertConditionOptions}
                  placeholder="Ex.: vencido"
                />
              </div>
              <div className="md:col-span-12">
                <CampoTexto
                  id="al-template"
                  label="Template"
                  multiline
                  rows={4}
                  placeholder="Ex.: Olá {{nome}}, o alerta {{gatilho}} foi disparado para {{modulo}}."
                  value={alertForm.template}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, template: e.target.value }))}
                />
              </div>
              <div className="md:col-span-12">
                <CampoTexto
                  id="al-descricao"
                  label="Descrição"
                  multiline
                  rows={3}
                  placeholder="Explique quando o alerta deve ser usado e o que o usuário verá quando ele disparar."
                  value={alertForm.descricao}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-6 md:col-span-12">
                <Interruptor id="al-ativo" marcado={Boolean(alertForm.ativo)} aoMudar={(marcado) => setAlertForm((prev) => ({ ...prev, ativo: marcado }))}>
                  Ativo
                </Interruptor>
                <Interruptor id="al-duplicidade" marcado={Boolean(alertForm.prevenir_duplicidade)} aoMudar={(marcado) => setAlertForm((prev) => ({ ...prev, prevenir_duplicidade: marcado }))}>
                  Prevenir duplicidade
                </Interruptor>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alertas cadastrados</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            rotulo="alertas cadastrados"
            colunas={colunasAlertas}
            linhas={alerts}
            chaveDaLinha={(alert) => alert.id}
            vazio="Nenhum alerta cadastrado."
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (mode === "estrutura") return renderStructure();
    if (mode === "alertas") return renderAlerts();
    if (mode === "detail") return renderDetail();
    return renderHome();
  };

  return (
    <div className="protocolo-page">
      <AlertModal />
      <CabecalhoDePagina titulo={currentTitle} />
      {message ? (
        <div className="mb-4">
          <Banner tom={message.toLowerCase().includes("não foi possível") ? "perigo" : "sucesso"}>{message}</Banner>
        </div>
      ) : null}
      {loading ? (
        <Carregando>Carregando protocolo...</Carregando>
      ) : renderContent()}
    </div>
  );
}
