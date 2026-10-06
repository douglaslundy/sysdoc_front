import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Chip,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import BaseCard from "../../src/components/baseCard/BaseCard";
import { getMessageLogs } from "../../src/store/fetchActions/messageLogs";

const CANAIS = [
  { value: "", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
];

const formatDate = (value) => (value ? new Date(value).toLocaleString("pt-BR") : "—");

export default function MensagensEnviadasPage() {
  const dispatch = useDispatch();
  const { items, page, lastPage, loading } = useSelector((state) => state.messageLogs);
  const [canal, setCanal] = useState("");
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const load = (nextPage = 1) => {
    const params = { page: nextPage };
    if (canal) params.canal = canal;
    if (busca.trim()) params.busca = busca.trim();
    if (de) params.de = de;
    if (ate) params.ate = ate;
    dispatch(getMessageLogs(params));
  };

  useEffect(() => {
    const timer = setTimeout(() => load(1), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, busca, de, ate]);

  return (
    <BaseCard title="Mensagens enviadas" subtitle="Histórico de mensagens enviadas pelo sistema por WhatsApp e e-mail">
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={canal}
          onChange={(_, value) => {
            if (value !== null) setCanal(value);
          }}
        >
          {CANAIS.map((c) => (
            <ToggleButton key={c.value || "todos"} value={c.value}>
              {c.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField size="small" label="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <TextField
          size="small"
          type="date"
          label="De"
          InputLabelProps={{ shrink: true }}
          value={de}
          onChange={(e) => setDe(e.target.value)}
        />
        <TextField
          size="small"
          type="date"
          label="Até"
          InputLabelProps={{ shrink: true }}
          value={ate}
          onChange={(e) => setAte(e.target.value)}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" py={3}>
          Nenhuma mensagem encontrada.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Canal</TableCell>
                <TableCell>Destinatário</TableCell>
                <TableCell>Mensagem</TableCell>
                <TableCell>Origem</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(item.created_at)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.canal === "whatsapp" ? "WhatsApp" : "E-mail"}
                      color={item.canal === "whatsapp" ? "success" : "info"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {item.user?.name ? <div>{item.user.name}</div> : null}
                    <Typography variant="caption" color="text.secondary">
                      {item.destino}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    {item.assunto ? (
                      <strong>
                        {item.assunto}
                        <br />
                      </strong>
                    ) : null}
                    <Tooltip title={item.mensagem}>
                      <span>{item.mensagem.length > 120 ? `${item.mensagem.slice(0, 120)}…` : item.mensagem}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{item.origem || "—"}</TableCell>
                  <TableCell>
                    <Tooltip title={item.erro || ""}>
                      <Chip
                        size="small"
                        label={item.status === "enviado" ? "Enviado" : "Erro"}
                        color={item.status === "enviado" ? "success" : "error"}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {lastPage > 1 ? (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={lastPage} page={page} onChange={(_, value) => load(value)} />
        </Box>
      ) : null}
    </BaseCard>
  );
}
