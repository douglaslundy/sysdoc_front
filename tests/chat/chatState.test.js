import {
  appendMessageOnce,
  applyIncomingMessage,
  applyPresenceEvent,
  applySentMessage,
  createSingleFlight,
  markConversationRead,
  sortConversations,
  unreadTotalOf,
  upsertConversation,
} from "../../src/contexts/chatState";

const conv = (id, extra = {}) => ({
  id,
  last_message_at: `2026-01-0${id}T10:00:00Z`,
  unread_count: 0,
  last_message: null,
  ...extra,
});

test("mensagem recebida atualiza última mensagem, soma não lida e reordena", () => {
  const list = [conv(2), conv(1)];
  const message = { id: 90, conversation_id: 1, sender_id: 5, created_at: "2026-02-01T10:00:00Z" };

  const { conversations, known } = applyIncomingMessage(list, message, { currentUserId: 7 });

  expect(known).toBe(true);
  expect(conversations[0].id).toBe(1);
  expect(conversations[0].last_message).toBe(message);
  expect(conversations[0].unread_count).toBe(1);
  expect(unreadTotalOf(conversations)).toBe(1);
});

test("mensagem recebida com a conversa aberta não soma não lida", () => {
  const list = [conv(1)];
  const message = { id: 91, conversation_id: 1, sender_id: 5, created_at: "2026-02-01T10:00:00Z" };

  const { conversations } = applyIncomingMessage(list, message, { currentUserId: 7, viewing: true });

  expect(conversations[0].unread_count).toBe(0);
});

test("mensagem enviada por mim não soma não lida", () => {
  const list = [conv(1)];
  const message = { id: 92, conversation_id: 1, sender_id: "7", created_at: "2026-02-01T10:00:00Z" };

  const { conversations } = applyIncomingMessage(list, message, { currentUserId: 7 });

  expect(conversations[0].unread_count).toBe(0);
});

test("conversa desconhecida é sinalizada para o chamador buscar uma vez", () => {
  const message = { id: 93, conversation_id: 99, sender_id: 5 };

  expect(applyIncomingMessage([conv(1)], message, { currentUserId: 7 }).known).toBe(false);
  expect(applySentMessage([conv(1)], message).known).toBe(false);
});

test("applySentMessage atualiza a última mensagem sem mexer nas não lidas", () => {
  const list = [conv(1, { unread_count: 3 })];
  const message = { id: 94, conversation_id: 1, sender_id: 7, created_at: "2026-03-01T10:00:00Z" };

  const { conversations } = applySentMessage(list, message);

  expect(conversations[0].last_message).toBe(message);
  expect(conversations[0].unread_count).toBe(3);
});

test("marcar como lida zera só a conversa indicada", () => {
  const list = [conv(1, { unread_count: 2 }), conv(2, { unread_count: 4 })];

  expect(unreadTotalOf(markConversationRead(list, 1))).toBe(4);
});

test("upsertConversation insere nova e atualiza existente sem duplicar", () => {
  const inserted = upsertConversation([conv(1)], conv(3));
  expect(inserted.map((c) => c.id).sort()).toEqual([1, 3]);

  const updated = upsertConversation(inserted, { id: 3, unread_count: 5 });
  expect(updated).toHaveLength(2);
  expect(updated.find((c) => c.id === 3).unread_count).toBe(5);
});

test("presença atualiza apenas o usuário do evento", () => {
  const users = [{ id: 1, is_online: false }, { id: 2, is_online: false }];

  const next = applyPresenceEvent(users, { user_id: 2, presence: "online", is_online: true, last_seen_at: "x" });

  expect(next[0].is_online).toBe(false);
  expect(next[1]).toMatchObject({ presence: "online", is_online: true });
});

test("appendMessageOnce não duplica a mesma mensagem", () => {
  const list = [{ id: 1 }];
  expect(appendMessageOnce(list, { id: 1 })).toBe(list);
  expect(appendMessageOnce(list, { id: 2 })).toHaveLength(2);
});

test("sortConversations ordena da mais recente para a mais antiga", () => {
  expect(sortConversations([conv(1), conv(3), conv(2)]).map((c) => c.id)).toEqual([3, 2, 1]);
});

test("single-flight junta chamadas simultâneas em uma só execução", async () => {
  const flight = createSingleFlight();
  let calls = 0;
  const task = () =>
    new Promise((resolve) => {
      calls += 1;
      setTimeout(() => resolve(calls), 10);
    });

  const results = await Promise.all([flight(task), flight(task), flight(task)]);

  expect(calls).toBe(1);
  expect(results).toEqual([1, 1, 1]);

  await flight(task);
  expect(calls).toBe(2);
});
