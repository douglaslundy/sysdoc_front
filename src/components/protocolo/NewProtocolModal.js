import React, { useEffect, useMemo, useState, useContext } from "react";
import { Banner } from "../ui/banner";
import { Button, buttonVariants } from "../ui/button";
import { CampoSelecao, CampoTexto } from "../ui/campos";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";
import { AuthContext } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from "../secretaria/CampoSecretariaObrigatorio";

const initialProtocolForm = {
  assunto: "",
  descricao: "",
  tipo: "administrativo",
  prioridade: "normal",
  status: "novo",
  origem_unit_id: "",
  destino_unit_id: "",
  destino_user_id: "",
  prazo_dias: 10,
};

const PROTOCOL_STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "recebido", label: "Recebido" },
  { value: "encaminhado", label: "Encaminhado" },
  { value: "encerrado", label: "Encerrado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const MAX_ATTACHMENTS = 10;

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

const compareByName = (a, b) =>
  String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { sensitivity: "base" });

// Ordem alfabética entre irmãos, preservando a hierarquia (recuo por nível).
const flattenUnits = (items, level = 0) =>
  [...(Array.isArray(items) ? items : [])].sort((a, b) => compareByName(a?.nome, b?.nome)).reduce((acc, item) => {
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
  const [destinationUsers, setDestinationUsers] = useState([]);
  const [protocolTypes, setProtocolTypes] = useState([]);
  const [creationContext, setCreationContext] = useState(null);
  const [protocolForm, setProtocolForm] = useState(initialProtocolForm);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const secretaria = useSecretariaObrigatoria();

  const unitOptions = useMemo(() => flattenUnits(units), [units]);
  // Toda a árvore ativa (secretaria › departamento › subdepartamento), com recuo por nível.
  const secretariatOptions = useMemo(
    () => unitOptions.filter((unit) => unit.ativo !== false),
    [unitOptions]
  );
  const protocolTypeOptions = useMemo(() => {
    const activeTypes = protocolTypes.filter((type) => type?.ativo !== false);
    const base = activeTypes.length > 0 ? activeTypes : protocolTypeFallbackOptions;
    // Regra por usuário (cadastro do usuário): null = sem restrição.
    const permitidos = creationContext?.allowed_types;
    return Array.isArray(permitidos) ? base.filter((t) => permitidos.includes(t.codigo)) : base;
  }, [protocolTypes, creationContext]);
  const statusOptions = useMemo(() => {
    const permitidos = creationContext?.allowed_statuses;
    return PROTOCOL_STATUS_OPTIONS.filter((o) => !Array.isArray(permitidos) || permitidos.includes(o.value));
  }, [creationContext]);

  useEffect(() => {
    if (!open) return;

    setError("");
    Promise.all([
      api.get("/protocolos/unidades-organizacionais"),
      api.get("/protocolos/tipos"),
      api.get("/protocolos/contexto-novo"),
    ])
      .then(([unitsRes, typesRes, contextRes]) => {
        setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
        setProtocolTypes(Array.isArray(typesRes?.data) ? typesRes.data : []);
        setCreationContext(contextRes?.data || null);
        const ctx = contextRes?.data || {};
        const tiposOk = Array.isArray(typesRes?.data) ? typesRes.data.filter((t) => t?.ativo !== false && (!Array.isArray(ctx.allowed_types) || ctx.allowed_types.includes(t.codigo))) : [];
        setProtocolForm((current) => ({
          ...current,
          origem_unit_id: ctx.origin?.id ? String(ctx.origin.id) : "",
          // O padrão precisa respeitar o que o usuário pode cadastrar.
          tipo: Array.isArray(ctx.allowed_types) && tiposOk.length > 0 && !ctx.allowed_types.includes(current.tipo) ? tiposOk[0].codigo : current.tipo,
          status: Array.isArray(ctx.allowed_statuses) && ctx.allowed_statuses.length > 0 && !ctx.allowed_statuses.includes(current.status) ? ctx.allowed_statuses[0] : current.status,
        }));
      })
      .catch(() => setError("Não foi possível carregar os dados do formulário."));
  }, [open]);

  // Só usuários que pertencem à secretaria (ou unidade filha) escolhida E cujo
  // perfil tem acesso à página /protocolo podem ser destinatário específico —
  // do contrário o protocolo fica endereçado a alguém que nunca vai conseguir
  // abrir a tela para vê-lo/recebê-lo.
  useEffect(() => {
    let cancelled = false;

    setProtocolForm((current) => (current.destino_user_id ? { ...current, destino_user_id: "" } : current));

    if (!protocolForm.destino_unit_id) {
      setDestinationUsers([]);
      return undefined;
    }

    api
      .get("/protocolos/usuarios-elegiveis", { params: { unit_id: protocolForm.destino_unit_id } })
      .then(({ data }) => {
        if (!cancelled) {
          setDestinationUsers(Array.isArray(data) ? [...data].sort((a, b) => compareByName(a?.name, b?.name)) : []);
        }
      })
      .catch(() => {
        if (!cancelled) setDestinationUsers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [protocolForm.destino_unit_id]);

  useEffect(() => {
    if (!protocolForm.destino_user_id) return;

    const exists = destinationUsers.some((user) => String(user.id) === String(protocolForm.destino_user_id));
    if (!exists) {
      setProtocolForm((current) => ({ ...current, destino_user_id: "" }));
    }
  }, [destinationUsers, protocolForm.destino_user_id]);

  const resetAndClose = () => {
    setProtocolForm(initialProtocolForm);
    setAttachmentFiles([]);
    setError("");
    secretaria.limpar();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!secretaria.validar()) return;
    setSaving(true);
    setError("");
    try {
      const { data: created } = await api.post("/protocolos", {
        ...protocolForm,
        ...secretaria.payload(),
        origem_unit_id: protocolForm.origem_unit_id || null,
        destino_unit_id: protocolForm.destino_unit_id || null,
        destino_user_id: protocolForm.destino_user_id || null,
        prazo_dias: Math.max(1, parseInt(protocolForm.prazo_dias, 10) || 10),
      });

      let successMessage = "Protocolo criado com sucesso.";
      if (attachmentFiles.length > 0) {
        let falhas = 0;
        for (const file of attachmentFiles) {
          try {
            const formData = new FormData();
            formData.append("arquivo", file);
            await api.post(`/protocolos/${created.id}/anexos`, formData);
          } catch (attachError) {
            falhas += 1;
          }
        }
        if (falhas > 0) {
          successMessage = falhas === attachmentFiles.length
            ? "Protocolo criado com sucesso, mas não foi possível enviar os anexos. Anexe pela tela de detalhe do protocolo."
            : `Protocolo criado com sucesso, mas ${falhas} anexo(s) não puderam ser enviados. Anexe-os pela tela de detalhe do protocolo.`;
        }
      }

      setSaving(false);
      setProtocolForm(initialProtocolForm);
      setAttachmentFiles([]);
      onCreated(successMessage);
      onClose();
    } catch (submitError) {
      setSaving(false);
      if (secretaria.tratarErro(submitError)) return;
      setError(submitError?.response?.data?.message || "Não foi possível criar o protocolo.");
    }
  };

  const mudar = ({ target: { name, value } }) => setProtocolForm((prev) => ({ ...prev, [name]: value }));
  const opcaoDeUnidade = (unit) => (
    <option key={unit.id} value={String(unit.id)}>{`${"— ".repeat(unit.level)}${unit.nome}`}</option>
  );

  return (
    <Dialogo aberto={Boolean(open)} aoFechar={resetAndClose} tamanho="lg">
      <DialogoCabecalho>Novo protocolo</DialogoCabecalho>
      <form onSubmit={handleSubmit}>
        {error ? <div className="mb-4"><Banner tom="perigo">{error}</Banner></div> : null}
        <div className="grid gap-4 md:grid-cols-12">
          {secretaria.exigir ? <div className="md:col-span-12"><CampoSecretariaObrigatorio controle={secretaria} id="protocolo-secretaria" /></div> : null}
          <div className="md:col-span-8">
            <CampoTexto id="protocolo-assunto" label="Assunto" name="assunto" value={protocolForm.assunto} onChange={mudar} required obrigatorio />
          </div>
          <div className="md:col-span-4">
            <CampoSelecao id="protocolo-tipo" label="Tipo" name="tipo" value={protocolForm.tipo} onChange={mudar} required obrigatorio>
              {protocolTypeOptions.map((option) => (
                <option key={option.codigo} value={option.codigo}>{option.nome}</option>
              ))}
            </CampoSelecao>
          </div>
          {Array.isArray(creationContext?.allowed_statuses) && statusOptions.length > 1 && (
            <div className="md:col-span-4">
              <CampoSelecao id="protocolo-status" label="Status" name="status" value={protocolForm.status} onChange={mudar}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </CampoSelecao>
            </div>
          )}
          <div className="md:col-span-4">
            <CampoSelecao id="protocolo-prioridade" label="Prioridade" name="prioridade" value={protocolForm.prioridade} onChange={mudar}>
              {protocolPriorityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </CampoSelecao>
          </div>
          <div className="md:col-span-4">
            <CampoTexto id="protocolo-solicitante" label="Solicitante" value={creationContext?.requester?.name || username || "Usuário logado"} readOnly />
          </div>
          <div className="md:col-span-4">
            <CampoTexto
              id="protocolo-prazo"
              label="Prazo de atendimento (dias)"
              type="number"
              min={1}
              step={1}
              value={protocolForm.prazo_dias}
              onChange={(e) => {
                const prazo = e.target.value.replace(/[^0-9]/g, "");
                setProtocolForm((prev) => ({ ...prev, prazo_dias: prazo }));
              }}
              onBlur={() => setProtocolForm((prev) => ({ ...prev, prazo_dias: Math.max(1, parseInt(prev.prazo_dias, 10) || 10) }))}
            />
          </div>
          <div className="md:col-span-4">
            {creationContext?.origin_locked ? (
              <CampoTexto id="protocolo-origem-fixa" label="Origem" value={creationContext?.origin?.nome || "Unidade vinculada"} readOnly />
            ) : (
              <CampoSelecao id="protocolo-origem" label="Origem" name="origem_unit_id" value={protocolForm.origem_unit_id} onChange={mudar} required obrigatorio>
                <option value="">Selecione a origem</option>
                {secretariatOptions.map(opcaoDeUnidade)}
              </CampoSelecao>
            )}
          </div>
          <div className="md:col-span-4">
            <CampoSelecao id="protocolo-destino" label="Destino" name="destino_unit_id" value={protocolForm.destino_unit_id} onChange={mudar} required obrigatorio>
              <option value="">Selecione o destino</option>
              {secretariatOptions.map(opcaoDeUnidade)}
            </CampoSelecao>
          </div>
          <div className="md:col-span-4">
            <CampoSelecao
              id="protocolo-usuario-destino"
              label="Usuário de destino"
              name="destino_user_id"
              value={protocolForm.destino_user_id}
              onChange={mudar}
              disabled={!protocolForm.destino_unit_id}
              dica={protocolForm.destino_unit_id && destinationUsers.length === 0
                ? "Nenhum usuário lotado nesta unidade (ou nas subunidades) com acesso ao Protocolo. Cadastre a lotação em /protocolo/estrutura. Sem usuário, o protocolo fica endereçado à unidade inteira."
                : undefined}
            >
              <option value="">Todos da unidade</option>
              {destinationUsers.map((user) => (
                <option key={user.id} value={String(user.id)}>{user.name}</option>
              ))}
            </CampoSelecao>
          </div>
          <div className="md:col-span-12">
            <CampoTexto id="protocolo-descricao" label="Descrição" name="descricao" multiline rows={4} value={protocolForm.descricao} onChange={mudar} />
          </div>
          <div className="md:col-span-12">
            <label className={`${buttonVariants({ variant: "outline" })} cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25`}>
              {attachmentFiles.length > 0
                ? `${attachmentFiles.length} arquivo(s) selecionado(s)`
                : `Anexar arquivos (opcional, até ${MAX_ATTACHMENTS})`}
              <input
                className="sr-only"
                type="file"
                multiple
                onChange={(e) => {
                  // Acumula na lista (permite anexar de um em um); ignora duplicados.
                  const selected = Array.from(e.target.files || []);
                  const sameFile = (x, y) =>
                    x.name === y.name && x.size === y.size && x.lastModified === y.lastModified;
                  const merged = [...attachmentFiles];
                  selected.forEach((file) => {
                    if (!merged.some((item) => sameFile(item, file))) merged.push(file);
                  });
                  if (merged.length > MAX_ATTACHMENTS) {
                    setError(`Selecione no máximo ${MAX_ATTACHMENTS} arquivos.`);
                  } else {
                    setError("");
                  }
                  setAttachmentFiles(merged.slice(0, MAX_ATTACHMENTS));
                  // Permite escolher o mesmo arquivo de novo após removê-lo.
                  e.target.value = "";
                }}
              />
            </label>
            {attachmentFiles.length > 0 && (
              <ul className="mt-2 grid gap-1 text-sm">
                {attachmentFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{file.name}</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => setAttachmentFiles((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogoRodape>
          <Button type="button" variant="outline" onClick={resetAndClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Gravar"}</Button>
        </DialogoRodape>
      </form>
    </Dialogo>
  );
}