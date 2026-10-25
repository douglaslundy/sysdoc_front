import React, { useEffect, useRef, useState } from "react";
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
    <main className="min-h-screen bg-background p-4 text-foreground md:p-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold md:text-5xl">Painel de Atendimento</h1>
      {error ? <p className="mb-4 text-danger">{error}</p> : null}

      <section className="mb-6 rounded-xl border-2 border-primary bg-card p-6 md:p-8">
        <h2 className="font-display text-lg font-bold">Senha chamada</h2>
        {state?.currentCall ? (
          <>
            <p className="font-display text-6xl leading-[1.1] font-extrabold md:text-8xl">{state.currentCall.ticketCode}</p>
            <p className="font-display text-3xl font-bold md:text-5xl">{(state.currentCall.clientName || "").toUpperCase()}</p>
            <p className="font-display text-2xl md:text-3xl">Sala: {state.currentCall.roomName}</p>
            <p className="text-muted-foreground">Atendente: {state.currentCall.userName}</p>
          </>
        ) : (
          <p className="text-muted-foreground">Aguardando próxima chamada.</p>
        )}
      </section>

      <h2 className="mb-2 font-display text-2xl font-bold">Em atendimento</h2>
      {(state?.currentInService || []).length === 0 ? (
        <p className="mb-4">Nenhum cliente em atendimento.</p>
      ) : (
        <div className="mb-4">
          {state.currentInService.map((item, idx) => (
            <p key={`${item.ticketCode}-${idx}`}>
              {item.ticketCode} - {item.clientName} - {item.roomName} - {item.userName}
            </p>
          ))}
        </div>
      )}

      <h2 className="mb-2 font-display text-2xl font-bold">Últimas chamadas</h2>
      {(state?.lastCalls || []).length === 0 ? (
        <p>Nenhuma chamada anterior.</p>
      ) : (
        state.lastCalls.map((item, idx) => (
          <p key={`${item.ticketCode}-${idx}`}>
            {item.ticketCode} - {item.clientName} - {item.roomName}
          </p>
        ))
      )}
    </main>
  );
}
