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
 * Data exibida na primeira coluna: a data da baixa quando o filtro de realizados está
 * ativo; caso contrário, a data em que entrou na fila.
 */
export const firstColumnDate = (queue, done) => {
  const raw = isDoneFilter(done) ? queue?.done_at : queue?.created_at;
  if (!raw) return "";
  const parsed = parseISO(String(raw));
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "";
};
