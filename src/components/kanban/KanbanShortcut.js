import React, { useContext, useEffect, useMemo, useState } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "../ui/button";
import { Contador } from "../ui/contador";
import { useRouter } from "next/router";
import { api } from "../../services/api";
import { AuthContext } from "../../contexts/AuthContext";

const normalizePath = (value) => String(value || "").split("?")[0].replace(/\/+$/, "");

const hasPermissionForPath = (allowedPaths, targetPath) => {
  const normalizedTarget = normalizePath(targetPath);
  return (Array.isArray(allowedPaths) ? allowedPaths : []).some((allowed) => {
    const normalizedAllowed = normalizePath(allowed);
    return (
      normalizedAllowed === normalizedTarget ||
      normalizedTarget.startsWith(`${normalizedAllowed}/`)
    );
  });
};

const KanbanShortcut = () => {
  const router = useRouter();
  const isKanbanPage = router.pathname === "/kanban";
  const { profile, myPermissions, authorizedPages, permissionsLoaded } = useContext(AuthContext);
  const [total, setTotal] = useState(0);

  const canAccessKanban = useMemo(() => {
    // profile vem de um cookie lido de forma sincrona: no servidor (SSR) ele
    // ainda nao existe, mas no cliente ja esta disponivel no primeiro render.
    // So confiamos nele apos permissionsLoaded para o SSR e o primeiro render
    // do cliente baterem e evitar warning de hidratacao.
    if (permissionsLoaded && profile === "admin") return true;

    const hasDirectPermission = hasPermissionForPath(myPermissions, "/kanban");
    const hasAuthorizedPage = Array.isArray(authorizedPages)
      && authorizedPages.some((page) => page?.ativo && normalizePath(page?.path) === "/kanban");

    return isKanbanPage || hasDirectPermission || hasAuthorizedPage;
  }, [authorizedPages, isKanbanPage, myPermissions, profile, permissionsLoaded]);

  useEffect(() => {
    if (!permissionsLoaded || !canAccessKanban) return undefined;

    const loadCount = async () => {
      try {
        const { data } = await api.get("/kanban", { params: { pending_only: 1 } });
        setTotal(Array.isArray(data) ? data.length : 0);
      } catch (_) {
        setTotal(0);
      }
    };

    loadCount();
    // Não consulta com a aba oculta; ao voltar, atualiza na hora.
    const intervalId = setInterval(() => {
      if (!document.hidden) loadCount();
    }, 60000);
    const onVisible = () => {
      if (!document.hidden) loadCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [canAccessKanban, permissionsLoaded]);

  if (!canAccessKanban) {
    return null;
  }

  return (
    <Button variant="ghost" size="icon" className="relative" aria-label="abrir kanban" title="Tarefas do Kanban" onClick={() => router.push("/kanban")}>
      <Columns3 className="size-5" aria-hidden />
      <Contador valor={total} tom="primario" />
    </Button>
  );
};

export default KanbanShortcut;
