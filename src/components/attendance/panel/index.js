import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { attendanceApi } from "../../../services/attendanceApi";

export default function AttendancePanel() {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await attendanceApi.getPanelState();
        if (mounted) setState(data);
      } catch (_) {
        if (mounted) setError("Falha ao carregar painel.");
      }
    };

    load();
    const timer = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 5 },
        minHeight: "100vh",
        background: "linear-gradient(120deg, #0f172a 0%, #1e293b 100%)",
        color: "#f8fafc",
      }}
    >
      <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>Painel de Atendimento</Typography>
      {error ? <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> : null}

      <Box sx={{ p: 4, border: "2px solid #93c5fd", borderRadius: 2, mb: 3, backgroundColor: "rgba(15,23,42,0.55)" }}>
        <Typography variant="h6">Senha chamada</Typography>
        {state?.currentCall ? (
          <>
            <Typography variant="h1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{state.currentCall.ticketCode}</Typography>
            <Typography variant="h3">{state.currentCall.clientName}</Typography>
            <Typography variant="h5">Sala: {state.currentCall.roomName}</Typography>
            <Typography>Atendente: {state.currentCall.userName}</Typography>
          </>
        ) : (
          <Typography>Aguardando próxima chamada.</Typography>
        )}
      </Box>

      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Em atendimento</Typography>
      {(state?.currentInService || []).length === 0 ? (
        <Typography sx={{ mb: 2 }}>Nenhum cliente em atendimento.</Typography>
      ) : (
        <Box sx={{ mb: 2 }}>
          {state.currentInService.map((item, idx) => (
            <Typography key={`${item.ticketCode}-${idx}`}>
              {item.ticketCode} - {item.clientName} - {item.roomName} - {item.userName}
            </Typography>
          ))}
        </Box>
      )}

      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Últimas chamadas</Typography>
      {(state?.lastCalls || []).length === 0 ? (
        <Typography>Nenhuma chamada anterior.</Typography>
      ) : (
        state.lastCalls.map((item, idx) => (
          <Typography key={`${item.ticketCode}-${idx}`}>
            {item.ticketCode} - {item.clientName} - {item.roomName}
          </Typography>
        ))
      )}
    </Box>
  );
}
