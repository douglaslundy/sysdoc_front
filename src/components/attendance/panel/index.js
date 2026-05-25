import React, { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { attendanceApi } from "../../../services/attendanceApi";

const DEFAULT_POLL_MS = 10000;
const MIN_POLL_MS = 5000;
const MAX_POLL_MS = 60000;

function getPollIntervalMs() {
  const raw = Number(process.env.NEXT_PUBLIC_ATTENDANCE_PANEL_POLL_MS || DEFAULT_POLL_MS);
  if (Number.isNaN(raw)) return DEFAULT_POLL_MS;
  return Math.min(MAX_POLL_MS, Math.max(MIN_POLL_MS, raw));
}

export default function AttendancePanel() {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const lastAnnouncedRef = useRef("");

  const playBell = async () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    if (context.state === "suspended") {
      await context.resume().catch(() => null);
    }

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.value = 0.0001;
    gain.connect(context.destination);

    const osc1 = context.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 880;
    osc1.connect(gain);
    osc1.start(now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.stop(now + 0.36);

    const osc2 = context.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 1320;
    osc2.connect(gain);
    osc2.start(now + 0.38);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.42);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    osc2.stop(now + 0.76);

    setTimeout(() => {
      context.close().catch(() => null);
    }, 1000);
  };

  const speakCall = (call) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !call) return;

    const text = `Senha ${call.ticketCode}, ${call.clientName}, dirija-se a sala ${call.roomName}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await attendanceApi.getPanelState();
        if (mounted) {
          const currentCall = data?.currentCall;
          const callKey = currentCall ? `${currentCall.ticketCode || ""}-${currentCall.calledAt || ""}` : "";

          if (callKey && callKey !== lastAnnouncedRef.current) {
            lastAnnouncedRef.current = callKey;
            playBell().finally(() => speakCall(currentCall));
          }

          setState(data);
        }
      } catch (_) {
        if (mounted) setError("Falha ao carregar painel.");
      }
    };

    load();
    const timer = setInterval(load, getPollIntervalMs());
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
            <Typography variant="h3">{(state.currentCall.clientName || "").toUpperCase()}</Typography>
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
