import { format, parseISO } from "date-fns";
import {
  DEFAULT_DONE_SORT,
  DONE_SORT_FIELDS,
  SORT_DIRECTIONS,
  defaultDoneRange,
  doneByName,
  firstColumnDate,
  isDoneFilter,
  rangeParams,
  sortParams,
  toApiDate,
} from "../../src/components/queue/queueDates";

const queue = {
  created_at: "2026-03-05T12:00:00.000000Z",
  done_at: "2026-05-10T15:30:00.000000Z",
};

test("com o filtro de realizados a primeira coluna mostra data e hora da baixa", () => {
  const expected = format(parseISO(queue.done_at), "dd/MM/yyyy HH:mm");
  expect(expected).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  expect(firstColumnDate(queue, 1)).toBe(expected);
  expect(firstColumnDate(queue, "1")).toBe(expected);
});

test("nos demais filtros continua mostrando a data de entrada na fila", () => {
  expect(firstColumnDate(queue, 0)).toBe("05/03/2026");
  expect(firstColumnDate(queue, 2)).toBe("05/03/2026");
});

test("sem data da baixa não quebra nem inventa data", () => {
  expect(firstColumnDate({ created_at: queue.created_at, done_at: null }, 1)).toBe("");
  expect(firstColumnDate({}, 0)).toBe("");
  expect(firstColumnDate({ done_at: "lixo" }, 1)).toBe("");
});

test("ordenação só é enviada à API com o filtro de realizados", () => {
  expect(sortParams(1, "date_of_realized", "asc")).toEqual({ sort_by: "date_of_realized", sort_dir: "asc" });
  expect(sortParams(0, "id", "desc")).toEqual({});
  expect(sortParams(2, "id", "desc")).toEqual({});
  expect(isDoneFilter(1)).toBe(true);
  expect(isDoneFilter(0)).toBe(false);
});

test("opções de ordenação: data da baixa, data realização e id, crescente e decrescente", () => {
  expect(DONE_SORT_FIELDS.map((item) => item.id)).toEqual(["done_at", "date_of_realized", "id"]);
  expect(SORT_DIRECTIONS.map((item) => item.id)).toEqual(["asc", "desc"]);
  expect(DEFAULT_DONE_SORT).toEqual({ sortBy: "done_at", sortDir: "desc" });
});

test("nome de quem deu a baixa", () => {
  expect(doneByName({ done_by_user: { name: "Maria" } })).toBe("Maria");
  expect(doneByName({ done_by_user: null })).toBe("");
  expect(doneByName({})).toBe("");
});

test("intervalo padrão: primeiro dia do mês corrente até hoje", () => {
  const { from, to } = defaultDoneRange(new Date(2026, 8, 29, 15, 40));
  expect(toApiDate(from)).toBe("2026-09-01");
  expect(toApiDate(to)).toBe("2026-09-29");
});

test("intervalo só é enviado com o filtro de realizados e ignora datas vazias", () => {
  const from = new Date(2026, 8, 1);
  const to = new Date(2026, 8, 29);
  expect(rangeParams(1, from, to)).toEqual({ date_from: "2026-09-01", date_to: "2026-09-29" });
  expect(rangeParams(0, from, to)).toEqual({});
  expect(rangeParams(2, from, to)).toEqual({});
  expect(rangeParams(1, null, to)).toEqual({ date_to: "2026-09-29" });
  expect(toApiDate(null)).toBe("");
  expect(toApiDate(new Date("x"))).toBe("");
});
