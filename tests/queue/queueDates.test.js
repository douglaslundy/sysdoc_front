import {
  DEFAULT_DONE_SORT,
  DONE_SORT_FIELDS,
  SORT_DIRECTIONS,
  firstColumnDate,
  isDoneFilter,
  sortParams,
} from "../../src/components/queue/queueDates";

const queue = {
  created_at: "2026-03-05T12:00:00.000000Z",
  done_at: "2026-05-10T15:30:00.000000Z",
};

test("com o filtro de realizados a primeira coluna mostra a data da baixa", () => {
  expect(firstColumnDate(queue, 1)).toBe("10/05/2026");
  expect(firstColumnDate(queue, "1")).toBe("10/05/2026");
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
