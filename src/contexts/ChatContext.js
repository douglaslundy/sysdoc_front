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
  const echoRef = useRef(null);
  const connectionIdRef = useRef(createConnectionId());
  const activeConversationRef = useRef(null);
  const isOpenRef = useRef(false);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

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
    async ({ body, file }) => {
      if (!activeConversation) return null;
      const formData = new FormData();
      if (body) formData.append("body", body);
      if (file) formData.append("file", file);
      const response = await api.post(
        `/chat/conversations/${activeConversation.id}/messages`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessages((current) => [...current, response.data]);
      await refreshLists();
      return response.data;
    },
    [activeConversation, refreshLists]
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
    if (!isAuthenticated || !user) return undefined;
    let cancelled = false;
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;

    const connect = async () => {
      if (!key) return;
      const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import("laravel-echo"),
        import("pusher-js"),
      ]);
      if (cancelled) return;

      window.Pusher = Pusher;
      const echo = new Echo({
        broadcaster: "pusher",
        key,
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "mt1",
        forceTLS: true,
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
      });

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
        refreshLists,
        openConversation,
        loadOlderMessages,
        searchMessages,
        startConversation,
        sendMessage,
        deleteMessage,
        deleteConversation,
        closeConversation,
        sendTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
