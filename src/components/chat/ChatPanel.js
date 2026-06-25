import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { ChatContext } from "../../contexts/ChatContext";
import { AuthContext } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import DestructiveConfirmDialog from "../confirmDialog/DestructiveConfirmDialog";

const PANEL_WIDTH = 780;

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
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption">Carregando anexo...</Typography>
      </Box>
    );
  }

  if (isImage) {
    return (
      <Box
        component="img"
        src={url}
        alt={attachment.original_name}
        sx={{
          display: "block",
          maxWidth: 260,
          maxHeight: 220,
          borderRadius: "12px",
          mt: 1,
          cursor: "pointer",
        }}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      />
    );
  }

  return (
    <Button
      href={url}
      download={attachment.original_name}
      size="small"
      variant="outlined"
      startIcon={<FeatherIcon icon="download" width="15" />}
      sx={{ mt: 1, color: "inherit", borderColor: "currentColor" }}
    >
      {attachment.original_name}
    </Button>
  );
}

function StatusIcon({ status }) {
  if (status === "sending") {
    return (
      <Tooltip title="Enviando">
        <Box component="span" sx={{ display: "inline-flex", ml: 0.5 }}>
          <CircularProgress size={11} />
        </Box>
      </Tooltip>
    );
  }
  if (status === "failed") {
    return (
      <Tooltip title="Falha no envio">
        <Box component="span" sx={{ display: "inline-flex", color: "error.main", ml: 0.5 }}>
          <FeatherIcon icon="alert-circle" width="13" />
        </Box>
      </Tooltip>
    );
  }
  const read = status === "read";
  const double = status === "delivered" || read;
  return (
    <Tooltip title={read ? "Lida" : double ? "Entregue" : "Enviada"}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          color: read ? "#38a8ff" : "var(--lg-text-muted)",
          ml: 0.5,
        }}
      >
        <FeatherIcon icon={double ? "check-circle" : "check"} width="13" />
      </Box>
    </Tooltip>
  );
}

export default function ChatPanel() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
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
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);

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
    if ((!body.trim() && !file) || sending) return;
    const messageBody = body.trim();
    const messageFile = file;
    setSending(true);
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
    } finally {
      setSending(false);
    }
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
    <Box>
      <Typography
        sx={{
          px: 1.5,
          pt: 1.5,
          pb: 0.5,
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: "var(--lg-text-muted)",
          textTransform: "uppercase",
        }}
      >
        {title} ({items.length})
      </Typography>
      <List dense disablePadding>
        {items.map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => startConversation(item.id)}
            sx={{ borderRadius: "10px", mx: 0.5 }}
          >
            <Badge
              overlap="circular"
              variant="dot"
              color={item.presence === "away" ? "warning" : "success"}
              invisible={!item.is_online}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              <Avatar sx={{ width: 34, height: 34, fontSize: "12px" }}>
                {initials(item.name)}
              </Avatar>
            </Badge>
            <ListItemText
              sx={{ ml: 1.2 }}
              primary={item.name}
              secondary={
                item.is_online
                  ? item.presence === "away"
                    ? "Ausente"
                    : "Online"
                  : item.last_seen_at
                  ? `Visto ${formatTime(item.last_seen_at)}`
                  : "Offline"
              }
              primaryTypographyProps={{ fontSize: "13px", fontWeight: 700 }}
              secondaryTypographyProps={{ fontSize: "11px" }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => setIsOpen(false)}
      variant="temporary"
      PaperProps={{
        className: "lg-sidebar-paper",
        sx: {
          width: mobile ? "100%" : `${PANEL_WIDTH}px`,
          maxWidth: "100vw",
          background: "var(--lg-glass-sidebar)",
          backdropFilter: "var(--lg-blur-sidebar)",
          borderLeft: "1px solid var(--lg-border-sidebar)",
          color: "var(--lg-text-primary)",
        },
      }}
    >
      <Box
        sx={{
          height: 64,
          px: 2,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--lg-border)",
          gap: 1.5,
        }}
      >
        <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
          <FeatherIcon icon="message-circle" width="19" />
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 800 }}>Chat interno</Typography>
          <Typography
            variant="caption"
            sx={{ color: connected ? "success.main" : "var(--lg-text-muted)" }}
          >
            {connected ? "Tempo real conectado" : "Sincronização periódica"}
          </Typography>
        </Box>
        <Box flexGrow={1} />
        <Tooltip title={soundEnabled ? "Desativar som" : "Ativar som"}>
          <IconButton
            aria-label={soundEnabled ? "Desativar som do chat" : "Ativar som do chat"}
            onClick={toggleSound}
            sx={{ color: "inherit" }}
          >
            <FeatherIcon icon={soundEnabled ? "volume-2" : "volume-x"} width="18" />
          </IconButton>
        </Tooltip>
        <IconButton
          aria-label="Fechar chat"
          onClick={() => setIsOpen(false)}
          sx={{ color: "inherit" }}
        >
          <FeatherIcon icon="x" />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", minHeight: 0, flex: 1 }}>
        <Box
          sx={{
            width: mobile && activeConversation ? 0 : mobile ? "100%" : 285,
            overflow: "hidden",
            borderRight: mobile ? 0 : "1px solid var(--lg-border)",
            display: mobile && activeConversation ? "none" : "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Pesquisar usuário"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FeatherIcon icon="search" width="17" />
                  </InputAdornment>
                ),
              }}
            />
            {syncError && (
              <Typography color="error" variant="caption" sx={{ display: "block", mt: 1 }}>
                {syncError}
              </Typography>
            )}
          </Box>
          <Box sx={{ overflowY: "auto", flex: 1 }}>
            <Typography
              sx={{
                px: 2,
                py: 1,
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--lg-text-muted)",
                textTransform: "uppercase",
              }}
            >
              Conversas
            </Typography>
            <List dense disablePadding>
              {conversations.map((conversation) => (
                <ListItemButton
                  key={conversation.id}
                  selected={activeConversation?.id === conversation.id}
                  onClick={() => openConversation(conversation)}
                  sx={{ borderRadius: "10px", mx: 0.5 }}
                >
                  <Avatar sx={{ width: 36, height: 36, fontSize: "12px" }}>
                    {initials(conversation.other_user?.name)}
                  </Avatar>
                  <ListItemText
                    sx={{ ml: 1.2, minWidth: 0 }}
                    primary={conversation.other_user?.name || "Conversa"}
                    secondary={
                      conversation.last_message?.display_body || "Sem mensagens"
                    }
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: conversation.unread_count ? 800 : 600,
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{ fontSize: "11px", noWrap: true }}
                  />
                  {conversation.unread_count > 0 && (
                    <Badge badgeContent={conversation.unread_count} color="primary" />
                  )}
                </ListItemButton>
              ))}
            </List>
            <Divider sx={{ my: 1 }} />
            {renderUsers("Online", onlineUsers)}
            {renderUsers("Offline", offlineUsers)}
          </Box>
        </Box>

        <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
          {activeConversation ? (
            <>
              <Box
                sx={{
                  minHeight: 64,
                  px: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  borderBottom: "1px solid var(--lg-border)",
                }}
              >
                {mobile && (
                  <IconButton
                    onClick={closeConversation}
                    sx={{ color: "inherit" }}
                  >
                    <FeatherIcon icon="arrow-left" />
                  </IconButton>
                )}
                <Avatar sx={{ width: 38, height: 38 }}>
                  {initials(activeConversation.other_user?.name)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "14px" }}>
                    {activeConversation.other_user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typing[activeConversation.id]
                      ? `${typing[activeConversation.id]} está digitando...`
                      : "Conversa privada"}
                  </Typography>
                </Box>
                <Box flexGrow={1} />
                <TextField
                  size="small"
                  placeholder="Buscar mensagens"
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchMessages(historySearch.trim());
                  }}
                  sx={{ width: { xs: 130, md: 190 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="Buscar no histórico"
                          onClick={() => searchMessages(historySearch.trim())}
                        >
                          <FeatherIcon icon="search" width="15" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Tooltip title="Apagar conversa da minha lista">
                  <IconButton
                    aria-label="Apagar conversa"
                    onClick={() => setDeleteRequest({ type: "conversation" })}
                    sx={{ color: "error.main" }}
                  >
                    <FeatherIcon icon="trash-2" width="18" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2,
                  background:
                    "radial-gradient(circle at 20% 0%, rgba(var(--lg-accent-rgb), .08), transparent 34%)",
                }}
              >
                {selectedMessageIds.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      mb: 1.5,
                      p: 1,
                      border: "1px solid var(--lg-border)",
                      borderRadius: "12px",
                      background: "var(--lg-glass-panel)",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedMessageIds.length} mensagem(ns) selecionada(s)
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button size="small" onClick={() => setSelectedMessageIds([])}>
                        Limpar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() => setDeleteRequest({ type: "multiple" })}
                      >
                        Excluir selecionadas
                      </Button>
                    </Box>
                  </Box>
                )}
                {loading ? (
                  <Box sx={{ display: "grid", placeItems: "center", height: "100%" }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <>
                    {hasOlderMessages && (
                      <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                        <Button size="small" variant="outlined" onClick={loadOlderMessages}>
                          Carregar mensagens anteriores
                        </Button>
                      </Box>
                    )}
                    {messages.map((message) => {
                    const mine = String(message.sender_id) === String(currentUserId);
                    return (
                      <Box
                        key={message.id}
                        sx={{
                          display: "flex",
                          justifyContent: mine ? "flex-end" : "flex-start",
                          mb: 1.2,
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            maxWidth: "78%",
                            px: 1.5,
                            py: 1,
                            borderRadius: mine
                              ? "14px 14px 3px 14px"
                              : "14px 14px 14px 3px",
                            bgcolor: mine
                              ? "rgba(var(--lg-accent-rgb), .20)"
                              : "var(--lg-glass-panel)",
                            border: "1px solid var(--lg-border)",
                          }}
                        >
                          {mine &&
                            !message.is_deleted &&
                            !["sending", "failed"].includes(message.status) && (
                              <Checkbox
                                size="small"
                                checked={selectedMessageIds.includes(message.id)}
                                onChange={() => toggleMessageSelection(message.id)}
                                inputProps={{ "aria-label": "Selecionar mensagem" }}
                                sx={{
                                  position: "absolute",
                                  left: -34,
                                  top: 4,
                                  p: 0.5,
                                }}
                              />
                            )}
                          <Typography
                            sx={{
                              fontSize: "13px",
                              whiteSpace: "pre-wrap",
                              fontStyle: message.is_deleted ? "italic" : "normal",
                              color: message.is_deleted
                                ? "var(--lg-text-muted)"
                                : "inherit",
                            }}
                          >
                            {message.display_body}
                          </Typography>
                          {(message.attachments || []).map((attachment) => (
                            <Attachment key={attachment.id} attachment={attachment} />
                          ))}
                          {message.pending_attachment_name && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mt: 1 }}>
                              <FeatherIcon icon="paperclip" width="13" />
                              <Typography variant="caption">
                                {message.pending_attachment_name}
                              </Typography>
                            </Box>
                          )}
                          {mine && message.status === "failed" && (
                            <Box sx={{ mt: 0.7 }}>
                              <Button
                                size="small"
                                color="error"
                                variant="text"
                                startIcon={<FeatherIcon icon="refresh-cw" width="13" />}
                                onClick={() => handleRetry(message)}
                              >
                                Tentar novamente
                              </Button>
                            </Box>
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "9px", color: "var(--lg-text-muted)" }}
                            >
                              {formatTime(message.created_at)}
                            </Typography>
                            {mine && <StatusIcon status={message.status} />}
                            {mine &&
                              !message.is_deleted &&
                              !["sending", "failed"].includes(message.status) && (
                              <IconButton
                                size="small"
                                aria-label="Apagar mensagem"
                                onClick={() =>
                                  setDeleteRequest({
                                    type: "single",
                                    messageId: message.id,
                                  })
                                }
                                sx={{ p: 0.25, ml: 0.5, color: "var(--lg-text-muted)" }}
                              >
                                <FeatherIcon icon="trash" width="11" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </Box>

              <Box sx={{ p: 1.5, borderTop: "1px solid var(--lg-border)" }}>
                {file && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                      color: "var(--lg-text-muted)",
                    }}
                  >
                    <FeatherIcon icon="paperclip" width="15" />
                    <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                      {file.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setFile(null)}>
                      <FeatherIcon icon="x" width="14" />
                    </IconButton>
                  </Box>
                )}
                {error && (
                  <Typography color="error" variant="caption" sx={{ display: "block", mb: 1 }}>
                    {error}
                  </Typography>
                )}
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                  <IconButton
                    component="label"
                    aria-label="Anexar arquivo"
                    sx={{ color: "var(--lg-text-primary)" }}
                  >
                    <FeatherIcon icon="paperclip" />
                    <input
                      hidden
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.txt,.pdf"
                      onChange={(event) => setFile(event.target.files?.[0] || null)}
                    />
                  </IconButton>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Digite uma mensagem"
                    value={body}
                    onChange={handleBodyChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    inputProps={{ maxLength: 4000 }}
                  />
                  <IconButton
                    color="primary"
                    aria-label="Enviar mensagem"
                    disabled={sending || (!body.trim() && !file)}
                    onClick={handleSend}
                  >
                    {sending ? (
                      <CircularProgress size={22} />
                    ) : (
                      <FeatherIcon icon="send" />
                    )}
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                p: 4,
              }}
            >
              <Box>
                <FeatherIcon icon="message-circle" width="52" height="52" />
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 800 }}>
                  Selecione uma conversa
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Escolha um usuário online ou offline para iniciar.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
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
            ? "A conversa será removida apenas da sua lista. O histórico continuará preservado para auditoria."
            : deleteRequest?.type === "multiple"
            ? `As ${selectedMessageIds.length} mensagens selecionadas serão marcadas como apagadas.`
            : "A mensagem será marcada como apagada e permanecerá preservada para auditoria."
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
    </Drawer>
  );
}
