import React, { useContext, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Contador } from "../ui/contador";
import { Popover, PopoverConteudo, PopoverFechar, PopoverTrigger } from "../ui/popover";
import { useRouter } from "next/router";
import { api } from "../../services/api";
import { AuthContext } from "../../contexts/AuthContext";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const isProtocolPath = (value) => /^\/protocolo(\/|$)/.test(String(value || "").split("?")[0]);

const ProtocolBell = () => {
  const router = useRouter();
  const { permissionsLoaded, profile, myPermissions, authorizedPages } = useContext(AuthContext);

  // O backend só responde a quem tem alguma página de protocolo; sem ela o sino nem consulta.
  const canAccess = useMemo(() => {
    if (!permissionsLoaded) return false;
    if (profile === "admin") return true;
    return (
      (Array.isArray(myPermissions) && myPermissions.some(isProtocolPath)) ||
      (Array.isArray(authorizedPages) && authorizedPages.some((page) => page?.ativo && isProtocolPath(page?.path)))
    );
  }, [permissionsLoaded, profile, myPermissions, authorizedPages]);
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
    if (!canAccess) return undefined;

    loadCounts();
    // Não consulta com a aba oculta; ao voltar, atualiza na hora.
    const intervalId = setInterval(() => {
      if (!document.hidden) loadCounts();
    }, 60000);
    const onVisible = () => {
      if (!document.hidden) loadCounts();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [canAccess]);

  const total = useMemo(
    () => Number(data.novos || 0),
    [data.novos]
  );

  if (!canAccess) return null;

  return (
    <Popover>
      <PopoverTrigger
        aria-label="protocolos novos"
        title="Protocolos novos"
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <Bell className="size-5" aria-hidden />
        <Contador valor={total} />
      </PopoverTrigger>
      <PopoverConteudo className="w-[min(420px,calc(100vw-16px))]">
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-base font-extrabold">Protocolos novos</p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span>Novos: {data.novos}</span>
            <span>Breve: {data.vence_em_breve}</span>
            <span>Vencidos: {data.vencidos}</span>
          </p>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {data.recentes.length > 0 ? (
            data.recentes.map((protocol) => (
              <PopoverFechar
                key={protocol.id}
                onClick={() => router.push(`/protocolo/${protocol.id}`)}
                className="block w-full border-b border-border px-4 py-3 text-left hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
              >
                <span className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-semibold">{protocol.numero}</span>
                  <span className="min-w-0 text-muted-foreground">{protocol.assunto}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {protocol.prioridade || "normal"} • {protocol.status || "novo"} • {formatDateTime(protocol.updated_at)}
                </span>
              </PopoverFechar>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Nenhum protocolo novo no momento.</p>
          )}
        </div>
        <div className="p-2">
          <PopoverFechar
            onClick={() => router.push("/protocolo/caixa-entrada")}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
          >
            Ver caixa de entrada
          </PopoverFechar>
        </div>
      </PopoverConteudo>
    </Popover>
  );
};

export default ProtocolBell;
