import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";
import { format, isValid, parseISO } from "date-fns";

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = parseISO(String(value));
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy HH:mm") : "—";
};

/**
 * Painel lateral de histórico (mesmo padrão visual da "Movimentação" de protocolos e
 * documentos). Genérico: quem usa fornece os itens já na ordem de exibição
 * (mais recente em cima) no formato { id, titulo, detalhe, usuario, data }.
 */
export default function HistoryDrawer({
  open,
  onClose,
  title = "Histórico",
  subtitle = "",
  items = [],
  loading = false,
  error = "",
  hasMore = false,
  onLoadMore,
  extra = null,
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 480 },
          maxWidth: "100vw",
          bgcolor: "var(--lg-glass-panel)",
          color: "var(--lg-text-primary)",
          borderLeft: "1px solid var(--lg-border)",
          backdropFilter: "var(--lg-blur-panel)",
        },
      }}
    >
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            ) : null}
          </Box>
          <Button size="small" variant="outlined" onClick={onClose}>Fechar</Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {extra ? <Box sx={{ mb: 2 }}>{extra}</Box> : null}

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Stack spacing={0} divider={<Divider flexItem />}>
          {items.map((item) => (
            <Box key={item.id} sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                <Stack direction="row" spacing={0.75}>
                  <Chip size="small" variant="outlined" label={item.usuario || "Sistema"} />
                  {item.badge ? <Chip size="small" color="info" label={item.badge} /> : null}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(item.data)}
                </Typography>
              </Stack>
              <Typography data-testid="history-item-title" variant="body2" sx={{ fontWeight: 700, mt: 0.75 }}>
                {item.titulo}
              </Typography>
              {item.detalhe ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, whiteSpace: "pre-wrap" }}>
                  {item.detalhe}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
            <CircularProgress size={22} />
            <Typography variant="body2">Carregando histórico...</Typography>
          </Box>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>Nenhum registro.</Typography>
        ) : null}

        {hasMore && !loading ? (
          <Button variant="outlined" onClick={onLoadMore} sx={{ mt: 2, alignSelf: "center" }}>
            Carregar mais
          </Button>
        ) : null}
      </Box>
    </Drawer>
  );
}
