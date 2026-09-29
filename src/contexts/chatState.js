// Transformações puras do estado do chat. Ficam fora do ChatContext para que cada
// evento de tempo real atualize a lista local SEM precisar refazer requisições ao
// servidor (antes, toda mensagem disparava 3 consultas + confirmações).

export const sortConversations = (items) =>
  [...items].sort(
    (a, b) =>
      new Date(b.last_message_at || b.created_at || 0) -
      new Date(a.last_message_at || a.created_at || 0)
  );

export const unreadTotalOf = (conversations) =>
  (Array.isArray(conversations) ? conversations : []).reduce(
    (total, item) => total + Number(item?.unread_count || 0),
    0
  );

const sameId = (a, b) => String(a) === String(b);

/**
 * Aplica uma mensagem recebida (message.new) à lista de conversas.
 * `viewing` = o usuário está com essa conversa aberta e visível agora.
 * Retorna `known: false` quando a conversa ainda não existe localmente
 * (nesse caso o chamador busca a lista uma única vez).
 */
export const applyIncomingMessage = (
  conversations,
  message,
  { currentUserId, viewing = false } = {}
) => {
  const index = conversations.findIndex((item) =>
    sameId(item.id, message.conversation_id)
  );
  if (index === -1) {
    return { conversations, known: false };
  }

  const fromOther = !sameId(message.sender_id, currentUserId);
  const current = conversations[index];
  const updated = {
    ...current,
    last_message: message,
    last_message_at: message.created_at || current.last_message_at,
    unread_count:
      fromOther && !viewing
        ? Number(current.unread_count || 0) + 1
        : Number(current.unread_count || 0),
  };

  const next = [...conversations];
  next[index] = updated;

  return { conversations: sortConversations(next), known: true };
};

/** Mensagem enviada por mim (message.sent / resposta do POST): não altera não lidas. */
export const applySentMessage = (conversations, message) => {
  const index = conversations.findIndex((item) =>
    sameId(item.id, message.conversation_id)
  );
  if (index === -1) {
    return { conversations, known: false };
  }

  const next = [...conversations];
  next[index] = {
    ...next[index],
    last_message: message,
    last_message_at: message.created_at || next[index].last_message_at,
  };

  return { conversations: sortConversations(next), known: true };
};

export const markConversationRead = (conversations, conversationId) =>
  conversations.map((item) =>
    sameId(item.id, conversationId) ? { ...item, unread_count: 0 } : item
  );

export const upsertConversation = (conversations, conversation) => {
  if (!conversation?.id) return conversations;
  const exists = conversations.some((item) => sameId(item.id, conversation.id));
  return sortConversations(
    exists
      ? conversations.map((item) =>
          sameId(item.id, conversation.id) ? { ...item, ...conversation } : item
        )
      : [...conversations, conversation]
  );
};

export const applyPresenceEvent = (users, event) =>
  users.map((item) =>
    sameId(item.id, event.user_id)
      ? {
          ...item,
          presence: event.presence,
          is_online: event.is_online,
          last_seen_at: event.last_seen_at,
        }
      : item
  );

export const appendMessageOnce = (messages, message) =>
  messages.some((item) => sameId(item.id, message.id))
    ? messages
    : [...messages, message];

/**
 * Executa `task` sem sobrepor chamadas: se já existe uma em andamento, devolve a
 * mesma promessa (single-flight). Evita rajadas de requisições idênticas.
 */
export const createSingleFlight = () => {
  let inflight = null;
  return (task) => {
    if (inflight) return inflight;
    inflight = Promise.resolve()
      .then(task)
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
};
