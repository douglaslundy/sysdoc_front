import React, { useCallback, useEffect, useState } from "react";
import HistoryDrawer from "../history/HistoryDrawer";
import { api } from "../../services/api";

/** Histórico do cidadão: o servidor já devolve do mais recente para o mais antigo. */
export default function ClientHistoryDrawer({ open, onClose, client }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clientId = client?.id;

  const loadPage = useCallback(
    async (nextPage) => {
      if (!clientId) return;
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/clients/${clientId}/historico`, { params: { page: nextPage } });
        setItems((current) => (nextPage === 1 ? data.data || [] : [...current, ...(data.data || [])]));
        setPage(Number(data.current_page || nextPage));
        setLastPage(Number(data.last_page || 1));
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Não foi possível carregar o histórico.");
      } finally {
        setLoading(false);
      }
    },
    [clientId]
  );

  useEffect(() => {
    if (!open || !clientId) return;
    setItems([]);
    setPage(0);
    setLastPage(1);
    loadPage(1);
  }, [open, clientId, loadPage]);

  return (
    <HistoryDrawer
      open={open}
      onClose={onClose}
      title="Histórico do cidadão"
      subtitle={client?.name || ""}
      items={items}
      loading={loading}
      error={error}
      hasMore={page > 0 && page < lastPage}
      onLoadMore={() => loadPage(page + 1)}
    />
  );
}
