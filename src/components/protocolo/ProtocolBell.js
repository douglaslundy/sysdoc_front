import React, { useEffect, useMemo, useState } from "react";
import FeatherIcon from "feather-icons-react";
import {
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemButton,
  ListItemText,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { api } from "../../services/api";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const ProtocolBell = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState({ novos: 0, vence_em_breve: 0, vencidos: 0, recentes: [] });

  const loadCounts = async () => {
    try {
      const { data: response } = await api.get("/protocolos/contadores");
      setData({
        novos: Number(response?.novos ?? 0),
        vence_em_breve: Number(response?.vence_em_breve ?? 0),
        vencidos: Number(response?.vencidos ?? 0),
        recentes: Array.isArray(response?.recentes) ? response.recentes : [],
      });
    } catch (error) {
      setData((prev) => ({ ...prev, novos: 0, vence_em_breve: 0, vencidos: 0, recentes: [] }));
    }
  };

  useEffect(() => {
    loadCounts();
    const intervalId = setInterval(loadCounts, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const total = useMemo(
    () => Number(data.novos || 0),
    [data.novos]
  );

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Protocolos novos">
        <IconButton
          onClick={handleOpen}
          size="small"
          aria-label="protocolos novos"
          sx={{
            mr: 1,
            color: "var(--lg-text-primary)",
            background: "var(--lg-glass-chip)",
            border: "0.5px solid var(--lg-border)",
            borderRadius: "10px",
            "&:hover": {
              background: "var(--lg-glass-panel-hover)",
            },
          }}
        >
          <Badge badgeContent={total} color="error" max={99}>
            <FeatherIcon icon="bell" width="18" height="18" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 420,
            maxWidth: "calc(100vw - 32px)",
            border: "1px solid var(--lg-border)",
            background: "var(--lg-glass-panel)",
            backdropFilter: "var(--lg-blur-panel)",
            color: "var(--lg-text-primary)",
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--lg-text-primary)" }}>
            Protocolos novos
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">Novos: {data.novos}</Typography>
            <Typography variant="caption" color="text.secondary">Breve: {data.vence_em_breve}</Typography>
            <Typography variant="caption" color="text.secondary">Vencidos: {data.vencidos}</Typography>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
          {data.recentes.length > 0 ? (
            data.recentes.map((protocol) => (
              <ListItemButton
                key={protocol.id}
                onClick={() => {
                  handleClose();
                  router.push(`/protocolo/${protocol.id}`);
                }}
              sx={{
                alignItems: "flex-start",
                py: 1.3,
                borderBottom: "1px solid var(--lg-border)",
                "&:hover": {
                  background: "var(--lg-glass-panel-hover)",
                },
              }}
            >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {protocol.numero}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {protocol.assunto}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {protocol.prioridade || "normal"} • {protocol.status || "novo"} • {formatDateTime(protocol.updated_at)}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum protocolo novo no momento.
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 1.5 }}>
          <ListItemButton
            onClick={() => {
              handleClose();
              router.push("/protocolo/caixa-entrada");
            }}
            sx={{
              borderRadius: 2,
              color: "var(--lg-text-primary)",
              "&:hover": {
                background: "var(--lg-glass-panel-hover)",
              },
            }}
          >
            <ListItemText primary="Ver caixa de entrada" />
          </ListItemButton>
        </Box>
      </Menu>
    </>
  );
};

export default ProtocolBell;
