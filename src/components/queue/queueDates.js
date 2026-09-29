import { format, isValid, parseISO } from "date-fns";

// Ordenação disponível quando o filtro "Realizado?" está em SIM.
export const DONE_SORT_FIELDS = [
  { id: "done_at", name: "DATA DA BAIXA" },
  { id: "date_of_realized", name: "DATA REALIZAÇÃO" },
  { id: "id", name: "ID" },
];

export const SORT_DIRECTIONS = [
  { id: "asc", name: "CRESCENTE" },
  { id: "desc", name: "DECRESCENTE" },
];

export const DEFAULT_DONE_SORT = { sortBy: "done_at", sortDir: "desc" };

// Só o filtro "Realizado? = SIM" (valor 1) mostra data da baixa e permite ordenar.
export const isDoneFilter = (done) => Number(done) === 1;

/** Parâmetros de ordenação para a API (vazio fora do filtro de realizados). */
export const sortParams = (done, sortBy, sortDir) =>
  isDoneFilter(done) ? { sort_by: sortBy, sort_dir: sortDir } : {};

/**
 * Data exibida na primeira coluna: a data E HORA da baixa quando o filtro de realizados
 * está ativo; caso contrário, a data em que entrou na fila.
 */
export const firstColumnDate = (queue, done) => {
  const showDone = isDoneFilter(done);
  const raw = showDone ? queue?.done_at : queue?.created_at;
  if (!raw) return "";
  const parsed = parseISO(String(raw));
  if (!isValid(parsed)) return "";
  return format(parsed, showDone ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
};

/** Nome de quem deu a baixa (vazio quando não há registro, ex.: baixas antigas). */
export const doneByName = (queue) => queue?.done_by_user?.name || "";

// ---- intervalo de datas da baixa --------------------------------------------------
export const toApiDate = (value) =>
  value instanceof Date && isValid(value) ? format(value, "yyyy-MM-dd") : "";

/** Padrão do filtro: do primeiro dia do mês corrente até hoje. */
export const defaultDoneRange = (now = new Date()) => ({
  from: new Date(now.getFullYear(), now.getMonth(), 1),
  to: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
});

/** Parâmetros do intervalo para a API (só com o filtro de realizados). */
export const rangeParams = (done, from, to) => {
  if (!isDoneFilter(done)) return {};
  const params = {};
  const fromValue = toApiDate(from);
  const toValue = toApiDate(to);
  if (fromValue) params.date_from = fromValue;
  if (toValue) params.date_to = toValue;
  return params;
};
