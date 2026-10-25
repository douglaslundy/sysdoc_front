import React, { useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, CheckCheck, Download, MessageCircle, Paperclip, RefreshCw, Search, Send, Trash, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { ChatContext } from "../../contexts/ChatContext";
import { AuthContext } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import DestructiveConfirmDialog from "../confirmDialog/DestructiveConfirmDialog";
import { Button, buttonVariants } from "../ui/button";
import { CampoDeBusca } from "../ui/campo-de-busca";
import { CaixaDeMarcacao } from "../ui/caixa-de-marcacao";
import { Input, TextareaNativo } from "../ui/campos";
import { Carregando } from "../ui/carregando";
import { Gaveta } from "../ui/gaveta";

const initials = (name) =>
  String(name || "?")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatTime = (value) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";

// Círculo com as iniciais; `ponto` (classe de cor) mostra o indicador de presença.
function Avatar({ nome, tamanho = 36, ponto = null }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: tamanho, height: tamanho }}>
      <span className="flex size-full items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">{initials(nome)}</span>
      {ponto ? <span className={`absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card ${ponto}`} /> : null}
    </span>
  );
}

function Attachment({ attachment }) {
  const [url, setUrl] = useState("");
  const isImage = attachment.mime_type?.startsWith("image/");

  useEffect(() => {
    let objectUrl;
    api
      .get(attachment.download_url, { responseType: "blob" })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.download_url]);

  if (!url) {
    return <Carregando className="py-2 text-xs">Carregando anexo...</Carregando>;
  }

  if (isImage) {
    return (
      <img
        src={url}
        alt={attachment.original_name}
        className="mt-2 block max-h-[220px] max-w-[260px] cursor-pointer rounded-xl"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      />
    );
  }

  return (
    <a href={url} download={attachment.original_name} className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-2`}>
      <Download /> {attachment.original_name}
    </a>
  );
}

function StatusIcon({ status }) {
  if (status === "failed") {
    return (
      <span title="Falha no envio" className="ml-1 inline-flex text-danger">
        <AlertCircle className="size-3.5" aria-hidden />
      </span>
    );
  }
  const read = status === "read";
  const double = status === "delivered" || read;
  const title = status === "sending" ? "Enviada" : read ? "Lida" : double ? "Entregue" : "Enviada";
  const Icone = double ? CheckCheck : Check;
  return (
    <span title={title} className={`ml-1 inline-flex ${read ? "text-info" : "text-muted-foreground"}`}>
      <Icone className="size-3.5" aria-hidden />
    </span>
  );
}
export default function ChatPanel() {

  const { user: currentUserId } = useContext(AuthContext);
  const {
    isOpen,
    setIsOpen,
    connected,
    users,
    conversations,
    activeConversation,
    messages,
    hasOlderMessages,
    typing,
    loading,
    syncError,
    soundEnabled,
    chatBehavior,
    attachmentRules,
    openConversation,
    loadOlderMessages,
    searchMessages,
    startConversation,
    sendMessage,
    retryMessage,
    deleteMessage,
    deleteMessages,
    deleteConversation,
    closeConversation,
    sendTyping,
    toggleSound,
  } = useContext(ChatContext);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);

  const formatAttachmentLimit = (bytes) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes >= 1024 * 1024) {
      return `${Math.round(bytes / (1024 * 1024))} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const filteredUsers = users.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );
  const onlineUsers = filteredUsers.filter((item) => item.is_online);
  const offlineUsers = filteredUsers.filter((item) => !item.is_online);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeConversation?.id]);

  useEffect(() => {
    setSelectedMessageIds([]);
    setDeleteRequest(null);
  }, [activeConversation?.id]);

  const handleBodyChange = (event) => {
    setBody(event.target.value);
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      sendTyping(true);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      sendTyping(false);
    }, 1800);
  };

  const handleSend = async () => {
    if (!body.trim() && !file) return;
    const messageBody = body.trim();
    const messageFile = file;
    setError("");
    setBody("");
    setFile(null);
    typingActiveRef.current = false;
    clearTimeout(typingTimerRef.current);
    sendTyping(false);
    try {
      await sendMessage({ body: messageBody, file: messageFile });
    } catch (sendError) {
      setError(
        sendError?.response?.data?.message ||
          "Não foi possível enviar a mensagem."
      );
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    const maxBytes = Number(attachmentRules?.maxAttachmentBytes || 0);
    const allowedExtensions = Array.isArray(attachmentRules?.allowedExtensions)
      ? attachmentRules.allowedExtensions.map((item) => String(item).toLowerCase())
      : [];
    const extension = String(selectedFile.name.split(".").pop() || "").toLowerCase();

    if (allowedExtensions.length > 0 && extension && !allowedExtensions.includes(extension)) {
      setError("Envie apenas arquivos JPG, JPEG, PNG, WEBP, TXT ou PDF.");
      setFile(null);
      return;
    }

    if (maxBytes > 0 && selectedFile.size > maxBytes) {
      setError(`O arquivo excede o limite permitido de ${formatAttachmentLimit(maxBytes)}.`);
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const handleRetry = async (message) => {
    setError("");
    try {
      await retryMessage(message);
    } catch (retryError) {
      setError(
        retryError?.response?.data?.message ||
          "Não foi possível reenviar a mensagem."
      );
    }
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId]
    );
  };

  const confirmDelete = async () => {
    if (!deleteRequest || deleting) return;
    setDeleting(true);
    setError("");
    try {
      if (deleteRequest.type === "conversation") {
        await deleteConversation();
      } else if (deleteRequest.type === "multiple") {
        if (selectedMessageIds.length === 0) return;
        await deleteMessages(selectedMessageIds);
        setSelectedMessageIds([]);
      } else {
        await deleteMessage(deleteRequest.messageId);
        setSelectedMessageIds((current) =>
          current.filter((id) => id !== deleteRequest.messageId)
        );
      }
      setDeleteRequest(null);
    } catch (deleteError) {
      setDeleteRequest(null);
      setError(
        deleteError?.response?.data?.message ||
          "Não foi possível concluir a exclusão."
      );
    } finally {
      setDeleting(false);
    }
  };

  const renderUsers = (title, items) => (
    <div>
      <p className="px-3 pt-3 pb-1 text-[10px] font-extrabold tracking-[0.1em] text-muted-foreground uppercase">
        {title} ({items.length})
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => startConversation(item.id)}
              className="mx-1 flex w-[calc(100%-8px)] items-center gap-3 rounded-[10px] px-3 py-2 text-left hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
            >
              <Avatar nome={item.name} tamanho={34} ponto={item.is_online ? (item.presence === "away" ? "bg-primary" : "bg-success") : null} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold">{item.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {item.is_online
                    ? item.presence === "away"
                      ? "Ausente"
                      : "Online"
                    : item.last_seen_at
                    ? `Visto ${formatTime(item.last_seen_at)}`
                    : "Offline"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const somDesativadoPeloAdmin = chatBehavior?.playSoundOnMessage === false;
  const rotuloSom = somDesativadoPeloAdmin
    ? "Som do chat desativado pelo administrador"
    : soundEnabled
    ? "Desativar som do chat"
    : "Ativar som do chat";
  const tituloSom = somDesativadoPeloAdmin ? "Som desativado pelo administrador" : soundEnabled ? "Desativar som" : "Ativar som";

  return (
    <Gaveta aberto={Boolean(isOpen)} aoFechar={() => setIsOpen(false)} titulo="Chat interno" semCabecalho className="p-0 sm:w-[780px]">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MessageCircle className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-extrabold">Chat interno</p>
          <p className={`text-xs ${connected ? "text-success" : "text-muted-foreground"}`}>
            {connected ? "Tempo real conectado" : "Sincronização periódica"}
          </p>
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" aria-label={rotuloSom} title={tituloSom} onClick={toggleSound} disabled={somDesativadoPeloAdmin}>
          {somDesativadoPeloAdmin || !soundEnabled ? <VolumeX /> : <Volume2 />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Fechar chat" onClick={() => setIsOpen(false)}>
          <X />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`${activeConversation ? "hidden md:flex" : "flex"} w-full flex-col overflow-hidden md:w-[285px] md:shrink-0 md:border-r md:border-border`}>
          <div className="p-3">
            <CampoDeBusca rotulo="Pesquisar usuário" placeholder="Pesquisar usuário" value={search} onChange={(event) => setSearch(event.target.value)} />
            {syncError && <p className="mt-2 text-xs text-danger">{syncError}</p>}
          </div>
          <div className="flex-1 overflow-y-auto">
            <p className="px-4 py-2 text-[11px] font-extrabold text-muted-foreground uppercase">Conversas</p>
            <ul>
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => openConversation(conversation)}
                    aria-current={activeConversation?.id === conversation.id ? "true" : undefined}
                    className={`mx-1 flex w-[calc(100%-8px)] items-center gap-3 rounded-[10px] px-3 py-2 text-left hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none ${
                      activeConversation?.id === conversation.id ? "bg-hover" : ""
                    }`}
                  >
                    <Avatar nome={conversation.other_user?.name} tamanho={36} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] ${conversation.unread_count ? "font-extrabold" : "font-semibold"}`}>
                        {conversation.other_user?.name || "Conversa"}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {conversation.last_message?.display_body || "Sem mensagens"}
                      </span>
                    </span>
                    {conversation.unread_count > 0 && (
                      <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                        {conversation.unread_count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <hr className="my-2 border-border" />
            {renderUsers("Online", onlineUsers)}
            {renderUsers("Offline", offlineUsers)}
          </div>
        </div>

        <div className={`${activeConversation ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
          {activeConversation ? (
            <>
              <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-4">
                <Button variant="ghost" size="icon" aria-label="Voltar às conversas" className="md:hidden" onClick={closeConversation}>
                  <ArrowLeft />
                </Button>
                <Avatar nome={activeConversation.other_user?.name} tamanho={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{activeConversation.other_user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {typing[activeConversation.id]
                      ? `${typing[activeConversation.id]} está digitando...`
                      : "Conversa privada"}
                  </p>
                </div>
                <div className="flex-1" />
                <div className="flex w-[130px] items-center gap-1 md:w-[190px]">
                  <Input
                    aria-label="Buscar mensagens"
                    placeholder="Buscar mensagens"
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") searchMessages(historySearch.trim());
                    }}
                  />
                  <Button variant="ghost" size="icon-sm" aria-label="Buscar no histórico" onClick={() => searchMessages(historySearch.trim())}>
                    <Search />
                  </Button>
                </div>
                <Button variant="destructive" size="icon-sm" title="Apagar conversa da minha lista" aria-label="Apagar conversa" onClick={() => setDeleteRequest({ type: "conversation" })}>
                  <Trash2 />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedMessageIds.length > 0 && (
                  <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2">
                    <p className="text-sm font-bold">{selectedMessageIds.length} mensagem(ns) selecionada(s)</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedMessageIds([])}>
                        Limpar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteRequest({ type: "multiple" })}>
                        Excluir selecionadas
                      </Button>
                    </div>
                  </div>
                )}
                {loading ? (
                  <Carregando className="justify-center">Carregando mensagens...</Carregando>
                ) : (
                  <>
                    {hasOlderMessages && (
                      <div className="mb-3 flex justify-center">
                        <Button size="sm" variant="outline" onClick={loadOlderMessages}>
                          Carregar mensagens anteriores
                        </Button>
                      </div>
                    )}
                    {messages.filter((message) => !message.is_deleted).map((message) => {
                      const mine = String(message.sender_id) === String(currentUserId);
                      return (
                        <div key={message.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`relative max-w-[78%] border border-border px-3 py-2 ${
                              mine ? "rounded-[14px_14px_3px_14px] bg-primary/20" : "rounded-[14px_14px_14px_3px] bg-card"
                            }`}
                          >
                            {mine &&
                              !message.is_deleted &&
                              !["sending", "failed"].includes(message.status) && (
                                <span className="absolute top-1 -left-9">
                                  <CaixaDeMarcacao
                                    id={`chat-msg-${message.id}`}
                                    marcado={selectedMessageIds.includes(message.id)}
                                    aoMudar={() => toggleMessageSelection(message.id)}
                                    aria-label="Selecionar mensagem"
                                  />
                                </span>
                              )}
                            <p className="text-[13px] whitespace-pre-wrap">{message.display_body}</p>
                            {(message.attachments || []).map((attachment) => (
                              <Attachment key={attachment.id} attachment={attachment} />
                            ))}
                            {message.pending_attachment_name && (
                              <p className="mt-2 flex items-center gap-1.5 text-xs">
                                <Paperclip className="size-3.5" aria-hidden />
                                {message.pending_attachment_name}
                              </p>
                            )}
                            {mine && message.status === "failed" && (
                              <div className="mt-1.5">
                                <Button size="xs" variant="destructive" onClick={() => handleRetry(message)}>
                                  <RefreshCw /> Tentar novamente
                                </Button>
                              </div>
                            )}
                            <div className="mt-1 flex items-center justify-end">
                              <span className="text-[9px] text-muted-foreground">{formatTime(message.created_at)}</span>
                              {mine && <StatusIcon status={message.status} />}
                              {mine &&
                                !message.is_deleted &&
                                !["sending", "failed"].includes(message.status) && (
                                  <button
                                    type="button"
                                    aria-label="Apagar mensagem"
                                    onClick={() => setDeleteRequest({ type: "single", messageId: message.id })}
                                    className="ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
                                  >
                                    <Trash className="size-3" aria-hidden />
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-border p-3">
                {file && (
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Paperclip className="size-4" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-xs">{file.name}</span>
                    <Button variant="ghost" size="icon-xs" aria-label="Remover anexo" onClick={() => setFile(null)}>
                      <X />
                    </Button>
                  </div>
                )}
                {error && <p className="mb-2 text-xs text-danger">{error}</p>}
                <div className="flex items-end gap-2">
                  <label
                    aria-label="Anexar arquivo"
                    className={`${buttonVariants({ variant: "ghost", size: "icon" })} cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25`}
                  >
                    <Paperclip />
                    <input className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,.txt,.pdf" onChange={handleFileChange} />
                  </label>
                  <TextareaNativo
                    aria-label="Mensagem"
                    rows={1}
                    className="max-h-28 min-h-[37px] flex-1 resize-none"
                    placeholder="Digite uma mensagem"
                    value={body}
                    onChange={handleBodyChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    maxLength={4000}
                  />
                  <Button size="icon" aria-label="Enviar mensagem" disabled={!body.trim() && !file} onClick={handleSend}>
                    <Send />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto size-12" aria-hidden />
                <h2 className="mt-4 font-display text-xl font-extrabold">Selecione uma conversa</h2>
                <p className="mt-2 text-muted-foreground">Escolha um usuário online ou offline para iniciar.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <DestructiveConfirmDialog
        open={Boolean(deleteRequest)}
        title={
          deleteRequest?.type === "conversation"
            ? "Excluir conversa"
            : deleteRequest?.type === "multiple"
            ? "Excluir mensagens selecionadas"
            : "Excluir mensagem"
        }
        message={
          deleteRequest?.type === "conversation"
            ? "Deseja excluir esta conversa?"
            : deleteRequest?.type === "multiple"
            ? `Deseja excluir ${selectedMessageIds.length} mensagens selecionadas?`
            : "Deseja excluir esta mensagem?"
        }
        confirmLabel={
          deleteRequest?.type === "conversation"
            ? "Excluir conversa"
            : "Excluir mensagem"
        }
        loading={deleting}
        onClose={() => setDeleteRequest(null)}
        onConfirm={confirmDelete}
      />
    </Gaveta>
  );
}