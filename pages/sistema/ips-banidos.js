import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import BaseCard from "../../src/components/baseCard/BaseCard";
import { modalFormRootSx } from "../../src/components/modal/_shared/modalFormStyles";
import { api } from "../../src/services/api";
import { deviceDetails, deviceSummary } from "../../src/utils/deviceSummary";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const formatDate = (value) => (value ? new Date(value).toLocaleString("pt-BR") : "—");

// Mesmo visual de linha das demais listagens (queue-page).
const StyledTableRow = styled(TableRow)(() => ({
  "& td": {
    background: "var(--queue-row-bg)",
    borderTop: "0.5px solid var(--lg-border)",
    borderBottom: "0.5px solid var(--lg-border)",
    paddingTop: 12,
    paddingBottom: 12,
    color: "var(--queue-text-primary)",
  },
  "& td:first-of-type": { borderLeft: "0.5px solid var(--lg-border)", borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  "& td:last-of-type": { borderRight: "0.5px solid var(--lg-border)", borderTopRightRadius: 14, borderBottomRightRadius: 14 },
  "&:hover td": { background: "var(--queue-row-hover)" },
}));

const toolbarSx = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2, mt: 1 };

export default function IpsBanidosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [limit, setLimit] = useState("5");
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(0); // base 0 (TablePagination); a API usa base 1
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/banned-ips", {
        params: {
          page: page + 1,
          per_page: perPage,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
      // Desbaniu o último item da página: volta uma página.
      if (!res.data.data?.length && page > 0) setPage(page - 1);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.errors?.date_to?.[0] || e?.response?.data?.message || "Não foi possível carregar os IPs banidos.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn) => {
    try {
      await fn();
      setError("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Operação não concluída.");
    }
  };

  const ban = () => act(async () => {
    await api.post("/banned-ips", { ip: ip.trim(), reason: reason.trim() || undefined });
    setIp("");
    setReason("");
  });

  const unban = (item) => act(() => api.delete(`/banned-ips/${item.id}`));

  useEffect(() => {
    api.get("/banned-ips/settings")
      .then((res) => setLimit(String(res.data.strike_limit)))
      .catch(() => setError("Não foi possível carregar a configuração de tentativas."));
  }, []);

  const saveLimit = async () => {
    try {
      const res = await api.put("/banned-ips/settings", { strike_limit: Number(limit) });
      setLimit(String(res.data.strike_limit));
      setError("");
      setSaved(true);
    } catch (e) {
      setSaved(false);
      setError(e?.response?.data?.errors?.strike_limit?.[0] || e?.response?.data?.message || "Não foi possível salvar.");
    }
  };

  return (
    <Box sx={modalFormRootSx} className="queue-page">
      <BaseCard
        title={`IPs banidos — ${total} ${total === 1 ? "registro" : "registros"}`}
        subtitle="Robôs que varrem rotas inexistentes são banidos automaticamente. O limite conta 404 em rotas inexistentes em 10 minutos (padrão 5)."
      >
        {error ? <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert> : null}

        <Box className="queue-page__toolbar" sx={toolbarSx}>
          <TextField
            className="lg-search-field"
            type="number"
            label="Tentativas até bloquear"
            value={limit}
            inputProps={{ min: 1, max: 1000 }}
            sx={{ flex: "0 1 220px", minWidth: 180 }}
            onChange={(e) => { setLimit(e.target.value); setSaved(false); }}
          />
          <Button variant="contained" disabled={!limit || Number(limit) < 1} onClick={saveLimit}>Salvar</Button>
          {saved ? <Typography color="success.main" variant="body2">Salvo.</Typography> : null}
        </Box>

        <Box className="queue-page__toolbar" sx={toolbarSx}>
          <TextField
            className="lg-search-field"
            placeholder="IP a banir"
            value={ip}
            inputProps={{ autoComplete: "off" }}
            sx={{ flex: "0 1 220px", minWidth: 180 }}
            onChange={(e) => setIp(e.target.value)}
          />
          <TextField
            className="lg-search-field"
            placeholder="Motivo"
            value={reason}
            inputProps={{ autoComplete: "off" }}
            sx={{ flex: "1 1 280px", minWidth: 220 }}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button variant="contained" disabled={!ip.trim()} onClick={ban}>Banir IP</Button>
        </Box>

        <Box className="queue-page__toolbar" sx={toolbarSx}>
          <TextField
            className="lg-search-field"
            type="date"
            label="Banido de"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            sx={{ flex: "0 1 200px", minWidth: 180 }}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          />
          <TextField
            className="lg-search-field"
            type="date"
            label="Banido até"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            sx={{ flex: "0 1 200px", minWidth: 180 }}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
          />
          {dateFrom || dateTo ? (
            <Button variant="outlined" onClick={() => { setDateFrom(""); setDateTo(""); setPage(0); }}>Limpar período</Button>
          ) : null}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Typography color="text.secondary" py={3}>Nenhum IP banido.</Typography>
        ) : (
          <TableContainer className="queue-page__table-wrap">
            <Table className="queue-page__table" sx={{ mt: 2, whiteSpace: "nowrap", borderCollapse: "separate", borderSpacing: "0 10px" }}>
              <TableHead>
                <TableRow>
                  <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">IP</Typography></TableCell>
                  <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Origem do IP</Typography></TableCell>
                  <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Motivo</Typography></TableCell>
                  <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Tipo</Typography></TableCell>
                  <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Banido em</Typography></TableCell>
                  <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Expira em</Typography></TableCell>
                  <TableCell align="center" className="queue-page__th"><Typography variant="h6" color="textSecondary">Ações</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <StyledTableRow key={item.id} hover>
                    <TableCell><Typography variant="h6" fontWeight={600}>{item.ip}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }} title={deviceDetails(item.client_info, item.origin)}>{item.origin || "—"}</Typography>{item.client_info ? <Typography variant="caption" color="text.secondary" component="div">{deviceSummary(item.client_info)}</Typography> : null}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis" }} title={item.reason || ""}>{item.reason || "—"}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" color={item.source === "auto" ? "warning" : "info"} label={item.source === "auto" ? "Automático" : "Manual"} />
                    </TableCell>
                    <TableCell><Typography variant="body2">{formatDate(item.created_at)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{item.expires_at ? formatDate(item.expires_at) : "Permanente"}</Typography></TableCell>
                    <TableCell align="center">
                      <Box className="queue-page__actions">
                        <Button className="queue-page__action queue-page__action--danger" onClick={() => unban(item)} color="error" variant="contained" size="small" title="Desbanir">
                          <FeatherIcon icon="trash" width="18" height="18" />
                        </Button>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          className="queue-page__pagination"
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          rowsPerPageOptions={PER_PAGE_OPTIONS}
          onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
        />
      </BaseCard>
    </Box>
  );
}
