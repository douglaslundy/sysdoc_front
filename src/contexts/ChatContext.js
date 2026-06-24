import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Router from "next/router";
import { AuthContext } from "./AuthContext";
import { api } from "../services/api";

export const ChatContext = createContext({});

const sortConversations = (items) =>
  [...items].sort(
    (a, b) =>
      new Date(b.last_message_at || b.created_at || 0) -
      new Date(a.last_message_at || a.created_at || 0)
  );

const createConnectionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const createClientMessageId = () => `pending-${createConnectionId()}`;

export function ChatProvider({ children }) {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagePage, setMessagePage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [typing, setTyping] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  const echoRef = useRef(null);
  const connectionIdRef = useRef(createConnectionId());
  const activeConversationRef = useRef(null);
  const isOpenRef = useRef(false);
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const enabled = window.localStorage.getItem("chat.notificationSound") === "true";
    setSoundEnabled(enabled);
    soundEnabledRef.current = enabled;
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      const next = !current;
      soundEnabledRef.current = next;
      window.localStorage.setItem("chat.notificationSound", String(next));
      return next;
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = 720;
      gain.gain.setValueAtTime(0.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.18);
      oscillator.addEventListener("ended", () => audio.close());
    } catch {
      // Browsers may block audio until the user interacts with the page.
    }
  }, []);

  const refreshLists = useCallback(async () => {
    if (!isAuthenticated) return;
    const [usersResult, conversationsResult, unreadResult] =
      await Promise.allSettled([
        api.get("/chat/users"),
        api.get("/chat/conversations"),
        api.get("/chat/unread"),
      ]);

    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value.data || []);
    }
    if (conversationsResult.status === "fulfilled") {
      setConversations(
        sortConversations(conversationsResult.value.data || [])
      );
    }
    if (unreadResult.status === "fulfilled") {
      setUnreadTotal(Number(unreadResult.value.data?.total || 0));
    }

    const failed = [usersResult, conversationsResult, unreadResult].find(
      (result) => result.status === "rejected"
    );
    setSyncError(
      failed
        ? failed.reason?.response?.data?.message ||
            "Alguns dados do chat nao puderam ser sincronizados."
        : ""
    );
  }, [isAuthenticated]);

  const markRead = useCallback(async (conversationId) => {
    await api.post(`/chat/conversations/${conversationId}/read`);
    setUnreadTotal((current) => Math.max(0, current));
    setConversations((current) =>
      current.map((item) =>
        item.id === conversationId ? { ...item, unread_count: 0 } : item
      )
    );
  }, []);

  const openConversation = useCallback(
    async (conversation) => {
      setActiveConversation(conversation);
      setLoading(true);
      try {
        const response = await api.get(
          `/chat/conversations/${conversation.id}/messages`,
          { params: { per_page: 30 } }
        );
        const items = response.data?.data || [];
        setMessages([...items].reverse());
        setMessagePage(Number(response.data?.current_page || 1));
        setHasOlderMessages(
          Number(response.data?.current_page || 1) <
            Number(response.data?.last_page || 1)
        );
        await markRead(conversation.id);
        await refreshLists();
      } finally {
        setLoading(false);
      }
    },
    [markRead, refreshLists]
  );

  const startConversation = useCallback(
    async (userId) => {
      const response = await api.post("/chat/conversations", {
        user_id: userId,
      });
      await refreshLists();
      await openConversation(response.data);
    },
    [openConversation, refreshLists]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!activeConversation || !hasOlderMessages) return;
    const nextPage = messagePage + 1;
    const response = await api.get(
      `/chat/conversations/${activeConversation.id}/messages`,
      { params: { per_page: 30, page: nextPage } }
    );
    const older = [...(response.data?.data || [])].reverse();
    setMessages((current) => [...older, ...current]);
    setMessagePage(nextPage);
    setHasOlderMessages(
      nextPage < Number(response.data?.last_page || nextPage)
    );
  }, [activeConversation, hasOlderMessages, messagePage]);

  const searchMessages = useCallback(
    async (search) => {
      if (!activeConversation) return;
      setLoading(true);
      try {
        const response = await api.get(
          `/chat/conversations/${activeConversation.id}/messages`,
          { params: { per_page: 30, search: search || undefined } }
        );
        setMessages([...(response.data?.data || [])].reverse());
        setMessagePage(Number(response.data?.current_page || 1));
        setHasOlderMessages(
          !search &&
            Number(response.data?.current_page || 1) <
              Number(response.data?.last_page || 1)
        );
      } finally {
        setLoading(false);
      }
    },
    [activeConversation]
  );

  const sendMessage = useCallback(
    async ({ body, file, clientMessageId }) => {
      if (!activeConversation) return null;
      const pendingId = clientMessageId || createClientMessageId();
      const pendingMessage = {
        id: pendingId,
        conversation_id: activeConversation.id,
        sender_id: user,
        body: body || null,
        display_body: body || (file ? file.name : ""),
        status: "sending",
        created_at: new Date().toISOString(),
        attachments: [],
        pending_attachment_name: file?.name || null,
        retry_payload: { body, file },
      };

      setMessages((current) => {
        const exists = current.some((message) => message.id === pendingId);
        return exists
          ? current.map((message) =>
              message.id === pendingId ? pendingMessage : message
            )
          : [...current, pendingMessage];
      });

      const formData = new FormData();
      if (body) formData.append("body", body);
      if (file) formData.append("file", file);
      try {
        const response = await api.post(
          `/chat/conversations/${activeConversation.id}/messages`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId ? response.data : message
          )
        );
        await refreshLists();
        return response.data;
      } catch (error) {
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId
              ? {
                  ...message,
                  status: "failed",
                  error_message:
                    error?.response?.data?.message ||
                    "Não foi possível enviar a mensagem.",
                }
              : message
          )
        );
        throw error;
      }
    },
    [activeConversation, refreshLists, user]
  );

  const retryMessage = useCallback(
    async (message) => {
      if (!message?.retry_payload) return null;
      return sendMessage({
        ...message.retry_payload,
        clientMessageId: message.id,
      });
    },
    [sendMessage]
  );

  const deleteMessage = useCallback(async (messageId) => {
    await api.delete(`/chat/messages/${messageId}`);
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              body: null,
              display_body: "Mensagem apagada",
              is_deleted: true,
              attachments: [],
            }
          : message
      )
    );
  }, []);

  const deleteConversation = useCallback(async () => {
    if (!activeConversation) return;
    await api.delete(`/chat/conversations/${activeConversation.id}`);
    setConversations((current) =>
      current.filter((item) => item.id !== activeConversation.id)
    );
    setActiveConversation(null);
    setMessages([]);
    setMessagePage(1);
    setHasOlderMessages(false);
  }, [activeConversation]);

  const closeConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  const sendTyping = useCallback(
    (isTyping) => {
      if (!activeConversation) return;
      api
        .post(`/chat/conversations/${activeConversation.id}/typing`, {
          typing: isTyping,
        })
        .catch(() => {});
    },
    [activeConversation]
  );

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refreshLists().catch(() => {});
    const fallback = setInterval(() => refreshLists().catch(() => {}), 30000);
    return () => clearInterval(fallback);
  }, [isAuthenticated, refreshLists]);

  useEffect(() => {
    const reloadRealtime = () => setRealtimeVersion((current) => current + 1);
    window.addEventListener("chat-realtime-config-updated", reloadRealtime);
    return () =>
      window.removeEventListener("chat-realtime-config-updated", reloadRealtime);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;
    let cancelled = false;

    const connect = async () => {
      const { data: realtimeConfig } = await api.get("/chat/realtime-config");
      if (!realtimeConfig?.active || !realtimeConfig?.key) {
        setConnected(false);
        return;
      }
      const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import("laravel-echo"),
        import("pusher-js"),
      ]);
      if (cancelled) return;

      window.Pusher = Pusher;
      const echoOptions = {
        broadcaster: "pusher",
        key: realtimeConfig.key,
        cluster: realtimeConfig.cluster || "mt1",
        forceTLS: Boolean(realtimeConfig.use_tls),
        authorizer: (channel) => ({
          authorize: (socketId, callback) => {
            api
              .post("/broadcasting/auth", {
                socket_id: socketId,
                channel_name: channel.name,
              })
              .then((response) => callback(false, response.data))
              .catch((error) => callback(true, error));
          },
        }),
      };

      if (realtimeConfig.engine === "soketi") {
        echoOptions.wsHost = realtimeConfig.host;
        echoOptions.wsPort = Number(realtimeConfig.port || 6001);
        echoOptions.wssPort = Number(realtimeConfig.port || 443);
        echoOptions.enabledTransports = ["ws", "wss"];
        echoOptions.disableStats = true;
      }

      const echo = new Echo(echoOptions);

      echoRef.current = echo;
      echo.connector.pusher.connection.bind("connected", () =>
        setConnected(true)
      );
      echo.connector.pusher.connection.bind("disconnected", () =>
        setConnected(false)
      );

      const channel = echo.private(`chat.user.${user}`);
      channel.listen(".message.new", (message) => {
        api.post(`/chat/messages/${message.id}/delivered`).catch(() => {});
        setMessages((current) =>
          activeConversationRef.current?.id === message.conversation_id
            ? [...current, message]
            : current
        );
        if (
          activeConversationRef.current?.id === message.conversation_id &&
          isOpenRef.current
        ) {
          markRead(message.conversation_id).catch(() => {});
        } else {
          setUnreadTotal((current) => current + 1);
          playNotificationSound();
        }
        refreshLists().catch(() => {});
      });
      channel.listen(".message.sent", () => refreshLists().catch(() => {}));
      channel.listen(".message.delivered", (event) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === event.message_id
              ? {
                  ...message,
                  status: "delivered",
                  delivered_at: event.delivered_at,
                }
              : message
          )
        );
      });
      channel.listen(".message.read", (event) => {
        setMessages((current) =>
          current.map((message) =>
            message.conversation_id === event.conversation_id
              ? { ...message, status: "read", read_at: event.read_at }
              : message
          )
        );
      });
      channel.listen(".message.deleted", (event) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === event.message_id
              ? {
                  ...message,
                  body: null,
                  display_body: "Mensagem apagada",
                  is_deleted: true,
                  attachments: [],
                }
              : message
          )
        );
      });
      const presenceChannel = echo.private("chat.presence");
      presenceChannel.listen(".presence.updated", (event) => {
        setUsers((current) =>
          current.map((item) =>
            item.id === event.user_id
              ? {
                  ...item,
                  presence: event.presence,
                  is_online: event.is_online,
                  last_seen_at: event.last_seen_at,
                }
              : item
          )
        );
      });
      channel.listen(".typing.started", (event) => {
        setTyping((current) => ({
          ...current,
          [event.conversation_id]: event.name,
        }));
      });
      channel.listen(".typing.stopped", (event) => {
        setTyping((current) => {
          const next = { ...current };
          delete next[event.conversation_id];
          return next;
        });
      });
    };

    connect().catch(() => setConnected(false));
    return () => {
      cancelled = true;
      echoRef.current?.leave(`chat.user.${user}`);
      echoRef.current?.leave("chat.presence");
      echoRef.current?.disconnect();
      echoRef.current = null;
    };
  }, [
    isAuthenticated,
    markRead,
    playNotificationSound,
    realtimeVersion,
    refreshLists,
    user,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const updatePresence = (state) =>
      api
        .post("/chat/presence", {
          state,
          path: Router.pathname,
          connection_id: connectionIdRef.current,
        })
        .catch(() => {});

    updatePresence("online");
    const heartbeat = setInterval(() => updatePresence("online"), 60000);
    const onVisibility = () =>
      updatePresence(document.hidden ? "away" : "online");
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      updatePresence("offline");
    };
  }, [isAuthenticated]);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        connected,
        users,
        conversations,
        activeConversation,
        messages,
        hasOlderMessages,
        unreadTotal,
        typing,
        loading,
        syncError,
        soundEnabled,
        refreshLists,
        openConversation,
        loadOlderMessages,
        searchMessages,
        startConversation,
        sendMessage,
        retryMessage,
        deleteMessage,
        deleteConversation,
        closeConversation,
        sendTyping,
        toggleSound,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
