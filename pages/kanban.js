import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Banner } from "../src/components/ui/banner";
import { Button } from "../src/components/ui/button";
import { CampoDeBusca } from "../src/components/ui/campo-de-busca";
import { CampoSelecao, CampoTexto } from "../src/components/ui/campos";
import { Carregando } from "../src/components/ui/carregando";
import { Dialogo, DialogoCabecalho, DialogoRodape, DialogoTitulo } from "../src/components/ui/dialogo";
import { Pilula, tomDaCor } from "../src/components/ui/pilula";
import { api } from "../src/services/api";
import PeticaoChips from "../src/components/kanban/PeticaoChips";

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

const formatDateBR = (value) => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
  } catch (_) {
    return null;
  }
};

const vencimentoLabel = (value) => {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;
  const diffDays = Math.ceil((due - today) / 86400000);
  if (diffDays < 0) return { text: `Vencida há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? "s" : ""}`, classe: "text-danger-text", bold: true };
  if (diffDays === 0) return { text: "Vence hoje", classe: "text-warning", bold: true };
  if (diffDays <= 3) return { text: `Vence em ${diffDays} dia${diffDays !== 1 ? "s" : ""}`, classe: "text-warning", bold: false };
  return { text: `Vence ${formatDateBR(value)}`, classe: "text-muted-foreground", bold: false };
};

const CONCLUIDO_VISIVEL_DIAS = 7;
const CONCLUIDO_MAX_VISIVEIS = 5;

const formatHistoryText = (value) => {
  const readable = String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : "Ação";
};


const flattenUnits = (items, level = 0) =>
  (Array.isArray(items) ? items : []).flatMap((item) => [
    { ...item, level },
    ...flattenUnits(item.children, level + 1),
  ]);

function KanbanCard({ item, onOpen, onDragStart, dragging, onOpenFiscalizacao }) {
  const column = BOARD_COLUMNS.find((entry) => entry.value === String(item.status || "").toLowerCase()) || BOARD_COLUMNS[0];
  const vc = vencimentoLabel(item.vencimento);

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, item)}
      onClick={() => onOpen(item)}
      className={`min-w-0 rounded-xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${dragging ? "cursor-grabbing opacity-55" : "cursor-grab"}`}
    >
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-2">
          <Pilula tom={tomDaCor(column.color)}>{column.label}</Pilula>
          <Pilula tom="neutro" contorno>{item.visibility === "private" ? "Privado" : "Público"}</Pilula>
        </div>
        <p className="text-sm leading-tight font-extrabold [overflow-wrap:anywhere]">{item.titulo}</p>
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground [overflow-wrap:anywhere]">
          {item.descricao || "Sem descrição"}
        </p>
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        <Pilula tom="neutro" contorno>{`Prioridade: ${item.prioridade || "normal"}`}</Pilula>
        {item.protocol ? <Pilula tom="sucesso">{item.protocol.numero}</Pilula> : null}
      </div>

      {vc ? <span className={`mt-1.5 block text-xs ${vc.classe} ${vc.bold ? "font-bold" : ""}`}>{vc.text}</span> : null}
      <PeticaoChips item={item} onOpen={onOpenFiscalizacao} />
      <span className="mt-1 block text-xs text-muted-foreground">
        Atualizado em {formatDateTime(item.updated_at)}
      </span>
    </div>
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

  const campo = (nome) => ({ target: { value } }) => setForm((current) => ({ ...current, [nome]: value }));

  return (
    <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="md" className="max-h-[92vh] overflow-y-auto">
      <DialogoCabecalho>
        <DialogoTitulo>{item ? "Editar item do kanban" : "Novo item do kanban"}</DialogoTitulo>
      </DialogoCabecalho>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <CampoTexto id="kb-titulo" label="Título" obrigatorio required value={form.titulo} onChange={campo("titulo")} />
        <CampoTexto id="kb-descricao" label="Descrição" multiline rows={3} value={form.descricao} onChange={campo("descricao")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelecao id="kb-status" label="Status" value={form.status} onChange={campo("status")}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </CampoSelecao>
          <CampoSelecao id="kb-prioridade" label="Prioridade" value={form.prioridade} onChange={campo("prioridade")}>
            {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </CampoSelecao>
        </div>
        <CampoSelecao id="kb-visibilidade" label="Visibilidade" value={form.visibility} onChange={campo("visibility")}>
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </CampoSelecao>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto id="kb-vencimento" type="date" label="Vencimento" value={form.vencimento} onChange={campo("vencimento")} />
          <CampoTexto id="kb-ordem" type="number" label="Ordem" value={form.ordem} onChange={campo("ordem")} />
        </div>
        <DialogoRodape className="mt-1">
          {item ? (
            <Button type="button" variant="destructive" onClick={() => onDelete(item)} disabled={saving} className="sm:mr-auto">
              Excluir
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogoRodape>
      </form>
    </Dialogo>
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

  const campo = (nome) => ({ target: { value } }) => setForm((current) => ({ ...current, [nome]: value }));

  return (
    <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="lg" className="max-h-[92vh] overflow-y-auto">
      <DialogoCabecalho>
        <DialogoTitulo>{protocol ? `${protocol.numero} - ${protocol.assunto}` : "Protocolo"}</DialogoTitulo>
      </DialogoCabecalho>
      {loading ? (
        <Carregando className="justify-center py-12" />
      ) : (
        <div className="flex flex-col gap-4">
          {message && <Banner tom="perigo">{message}</Banner>}
          <CampoTexto id="kbp-assunto" label="Assunto" value={form.assunto || ""} onChange={campo("assunto")} />
          <CampoTexto id="kbp-descricao" label="Descrição" multiline rows={3} value={form.descricao || ""} onChange={campo("descricao")} />
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <CampoSelecao id="kbp-tipo" label="Tipo" value={form.tipo || ""} onChange={campo("tipo")}>
                {types.filter((type) => type.ativo !== false).map((type) => <option key={type.id} value={type.codigo}>{type.nome}</option>)}
              </CampoSelecao>
            </div>
            <div className="md:col-span-2">
              <CampoSelecao id="kbp-prioridade" label="Prioridade" value={form.prioridade || "normal"} onChange={campo("prioridade")}>
                {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </CampoSelecao>
            </div>
            <div className="md:col-span-2">
              <CampoTexto id="kbp-prazo" type="date" label="Prazo" value={form.prazo_atendimento || ""} onChange={campo("prazo_atendimento")} />
            </div>
            <div className="md:col-span-3">
              <CampoSelecao id="kbp-unidade" label="Unidade de destino" value={form.destino_unit_id || ""} onChange={campo("destino_unit_id")}>
                <option value="">Sem unidade</option>
                {units.filter((unit) => unit.ativo !== false).map((unit) => <option key={unit.id} value={unit.id}>{`${"— ".repeat(unit.level || 0)}${unit.nome}`}</option>)}
              </CampoSelecao>
            </div>
            <div className="md:col-span-3">
              <CampoSelecao id="kbp-responsavel" label="Responsável" value={form.destino_user_id || ""} onChange={campo("destino_user_id")}>
                <option value="">Sem responsável</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </CampoSelecao>
            </div>
            <div className="md:col-span-6">
              <CampoSelecao id="kbp-etapa" label="Etapa no Kanban" value={form.kanban_status || "novo"} onChange={campo("kanban_status")}>
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </CampoSelecao>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-3">
            <div><span className="block text-xs text-muted-foreground">Solicitante</span><p>{protocol?.solicitante_nome || "—"}</p></div>
            <div><span className="block text-xs text-muted-foreground">Origem</span><p>{protocol?.origem_unit?.nome || "—"}</p></div>
            <div><span className="block text-xs text-muted-foreground">Status do protocolo</span><p>{protocol?.status || "—"}</p></div>
          </div>

          <h3 className="text-lg font-bold">Histórico</h3>
          <div className="divide-y divide-border">
            {(protocol?.movements || []).slice().reverse().map((movement) => (
              <div key={movement.id} className="py-2">
                <p className="text-xs font-bold">{formatHistoryText(movement.acao)}</p>
                <p className="text-[11px]">{movement.user?.name || "Sistema"} · {formatDateTime(movement.created_at)}</p>
                {movement.observacao && <p className="text-[11px] text-muted-foreground">{movement.observacao}</p>}
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold">Comentários</h3>
          {(protocol?.comments || []).length ? (
            <div className="divide-y divide-border">
              {protocol.comments.map((comment) => (
                <div key={comment.id} className="py-2">
                  <p>{comment.conteudo}</p>
                  <p className="text-sm text-muted-foreground">{comment.user?.name || "Sistema"} · {formatDateTime(comment.created_at)}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Sem comentários.</p>}

          <h3 className="text-lg font-bold">Anexos</h3>
          {(protocol?.attachments || []).length ? (
            <div className="flex flex-col gap-2">
              {protocol.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{attachment.nome_original}</span>
                  <Button size="sm" variant="outline" onClick={() => downloadAttachment(attachment)}>Baixar</Button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Sem anexos.</p>}
        </div>
      )}
      <DialogoRodape>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={loading || saving}>{saving ? "Salvando..." : "Salvar e movimentar"}</Button>
      </DialogoRodape>
    </Dialogo>
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
    const limiteDate = new Date();
    limiteDate.setDate(limiteDate.getDate() - CONCLUIDO_VISIVEL_DIAS);

    return BOARD_COLUMNS.map((column) => {
      const allForColumn = filteredItems
        .filter((item) => String(item.status || "").toLowerCase() === column.value)
        .sort((a, b) => {
          const left = new Date(b.updated_at || b.created_at || 0).getTime();
          const right = new Date(a.updated_at || a.created_at || 0).getTime();
          return left - right;
        });

      if (column.value !== "concluido") {
        return { ...column, items: allForColumn };
      }

      // Regra 1: tarefas concluídas somem da coluna 7 dias após concluido_at.
      // Regra 2: mesmo dentro da janela de 7 dias, no máximo as 5 mais
      // recentes ficam visíveis (a mais restritiva das duas vale por tarefa).
      // Itens sem concluido_at (dados legados) não são filtrados pela regra
      // de dias, mas ainda entram na disputa pelo limite de 5 mais recentes.
      const withinWindow = allForColumn.filter((item) => {
        if (!item.concluido_at) return true;
        return new Date(item.concluido_at) >= limiteDate;
      });

      const maisRecentesPrimeiro = [...withinWindow].sort((a, b) => {
        const left = new Date(b.concluido_at || b.updated_at || b.created_at || 0).getTime();
        const right = new Date(a.concluido_at || a.updated_at || a.created_at || 0).getTime();
        return left - right;
      });

      return { ...column, items: maisRecentesPrimeiro.slice(0, CONCLUIDO_MAX_VISIVEIS) };
    });
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
    <div className="kanban-page mx-auto max-w-[1600px]">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <Pilula tom="neutro">{`Você possui ${totals.total} itens`}</Pilula>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <CampoDeBusca
              rotulo="Pesquisar item"
              placeholder="Pesquisar item"
              className="kanban-page__search w-full flex-none sm:w-56"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="w-full sm:w-40">
              <CampoSelecao id="kb-filtro-status" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos os status</option>
                {BOARD_COLUMNS.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </CampoSelecao>
            </div>
            <div className="w-full sm:w-40">
              <CampoSelecao id="kb-filtro-prioridade" label="Prioridade" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value || "all"} value={priority.value}>{priority.label}</option>
                ))}
              </CampoSelecao>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/protocolo/caixa-entrada")}>
            Caixa de Entrada
          </Button>
          <Button onClick={() => openCreate("novo")}>
            Novo Item
          </Button>
          <Button variant="ghost" onClick={loadItems} disabled={refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {message ? <div className="mb-4"><Banner tom="perigo">{message}</Banner></div> : null}

      {loading ? (
        <Carregando>Carregando kanban...</Carregando>
      ) : (
        <div className="mt-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {columns.map((column) => (
            <div
              key={column.value}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverColumn(column.value);
              }}
              onDragLeave={() => setDragOverColumn("")}
              onDrop={(event) => handleDrop(event, column.value)}
              className={`min-w-0 overflow-hidden rounded-xl border bg-muted ${dragOverColumn === column.value ? "border-primary ring-[3px] ring-primary/25" : "border-border"}`}
            >
              <div className="border-b border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold">{column.label}</h2>
                  <Pilula tom={tomDaCor(column.color)}>{`${column.items.length}`}</Pilula>
                </div>
                <Button
                  className="kanban-page__column-add-button mt-2 w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => openCreate(column.value)}
                >
                  Adicionar tarefa
                </Button>
              </div>
              <div className="grid min-h-80 gap-3 p-3">
                {column.items.length ? (
                  column.items.map((item) => (
                    <KanbanCard
                      key={item.id}
                      item={item}
                      onOpen={openEdit}
                      onOpenFiscalizacao={(protocolo) => router.push(`/fiscalizacoes?busca=${encodeURIComponent(protocolo)}`)}
                      onDragStart={handleDragStart}
                      dragging={draggedItemId === item.id}
                    />
                  ))
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">Nenhum item nesta etapa.</p>
                )}
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
}
