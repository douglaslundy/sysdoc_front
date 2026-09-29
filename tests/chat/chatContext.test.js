import React, { useContext } from "react";
import { act, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({ __esModule: true, default: { pathname: "/" } }));

jest.mock("../../src/services/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const mockListeners = {};
jest.mock(
  "laravel-echo",
  () => ({
    __esModule: true,
    default: class Echo {
      constructor() {
        this.connector = { pusher: { connection: { bind: (event, cb) => { mockListeners.__connection = mockListeners.__connection || {}; mockListeners.__connection[event] = cb; } } } };
      }
      private() {
        return {
          listen(event, cb) {
            mockListeners[event] = cb;
            return this;
          },
        };
      }
      leave() {}
      disconnect() {}
    },
  }),
  { virtual: true }
);
jest.mock("pusher-js", () => ({ __esModule: true, default: function Pusher() {} }), { virtual: true });

import { api } from "../../src/services/api";
import { AuthContext } from "../../src/contexts/AuthContext";
import { ChatContext, ChatProvider } from "../../src/contexts/ChatContext";

let ctx;
const Probe = () => {
  ctx = useContext(ChatContext);
  return null;
};

const conversationsPayload = [
  { id: 1, last_message_at: "2026-01-01T10:00:00Z", unread_count: 0, last_message: null },
];

const callsTo = (method, url) => api[method].mock.calls.filter(([u]) => u === url).length;

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(mockListeners).forEach((key) => delete mockListeners[key]);
  api.get.mockImplementation((url) => {
    if (url === "/chat/realtime-config") {
      return Promise.resolve({ data: { active: true, key: "k", engine: "pusher", cluster: "mt1", use_tls: true } });
    }
    if (url === "/chat/conversations") return Promise.resolve({ data: conversationsPayload });
    if (url === "/chat/users") return Promise.resolve({ data: [{ id: 2, name: "Ana", is_online: false }] });
    return Promise.resolve({ data: {} });
  });
  api.post.mockResolvedValue({ data: { ok: true } });
});

const mount = async () => {
  render(
    <AuthContext.Provider value={{ isAuthenticated: true, user: 7, canUseChat: true }}>
      <ChatProvider>
        <Probe />
      </ChatProvider>
    </AuthContext.Provider>
  );
  await waitFor(() => expect(mockListeners[".message.new"]).toBeDefined());
  await waitFor(() => expect(ctx.conversations).toHaveLength(1));
};

test("ao iniciar: 1 busca de conversas, sem usuários e sem /chat/unread", async () => {
  await mount();

  expect(callsTo("get", "/chat/conversations")).toBe(1);
  expect(callsTo("get", "/chat/users")).toBe(0);
  expect(callsTo("get", "/chat/unread")).toBe(0);
  expect(callsTo("post", "/chat/presence")).toBe(1);
});

test("mensagem nova de conversa conhecida atualiza a lista SEM nova busca ao servidor", async () => {
  await mount();
  const getsBefore = api.get.mock.calls.length;

  act(() => {
    mockListeners[".message.new"]({ id: 50, conversation_id: 1, sender_id: 2, body: "oi", display_body: "oi", created_at: "2026-02-01T10:00:00Z" });
  });

  expect(api.get.mock.calls.length).toBe(getsBefore);
  expect(ctx.unreadTotal).toBe(1);
  expect(ctx.conversations[0].last_message.id).toBe(50);
  expect(callsTo("post", "/chat/messages/50/delivered")).toBe(1);
});

test("mensagem nova com a conversa aberta só confirma leitura (1 requisição)", async () => {
  await mount();
  await act(async () => {
    ctx.setIsOpen(true);
    await ctx.openConversation(conversationsPayload[0]);
  });
  api.post.mockClear();

  act(() => {
    mockListeners[".message.new"]({ id: 51, conversation_id: 1, sender_id: 2, body: "x", display_body: "x", created_at: "2026-02-01T11:00:00Z" });
  });

  await waitFor(() => expect(callsTo("post", "/chat/conversations/1/read")).toBe(1));
  expect(callsTo("post", "/chat/messages/51/delivered")).toBe(0);
  expect(ctx.unreadTotal).toBe(0);
});

test("mensagem de conversa desconhecida busca a lista uma única vez", async () => {
  await mount();
  const before = callsTo("get", "/chat/conversations");

  act(() => {
    mockListeners[".message.new"]({ id: 52, conversation_id: 99, sender_id: 2, created_at: "2026-02-01T12:00:00Z" });
  });

  await waitFor(() => expect(callsTo("get", "/chat/conversations")).toBe(before + 1));
});

test("lista de usuários só é buscada ao abrir o painel e respeita o intervalo mínimo", async () => {
  await mount();
  expect(callsTo("get", "/chat/users")).toBe(0);

  await act(async () => ctx.setIsOpen(true));
  await waitFor(() => expect(callsTo("get", "/chat/users")).toBe(1));

  await act(async () => ctx.setIsOpen(false));
  await act(async () => ctx.setIsOpen(true));
  expect(callsTo("get", "/chat/users")).toBe(1);
});

test("evento de presença atualiza o usuário sem buscar a lista de novo", async () => {
  await mount();
  await act(async () => ctx.setIsOpen(true));
  await waitFor(() => expect(ctx.users).toHaveLength(1));

  act(() => {
    mockListeners[".presence.updated"]({ user_id: 2, presence: "online", is_online: true, last_seen_at: "now" });
  });

  expect(ctx.users[0].is_online).toBe(true);
  expect(callsTo("get", "/chat/users")).toBe(1);
});
