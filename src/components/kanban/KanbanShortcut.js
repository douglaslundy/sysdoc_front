import React, { useContext, useEffect, useMemo, useState } from "react";
import FeatherIcon from "feather-icons-react";
import { Badge, IconButton, Tooltip } from "@mui/material";
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
  const { profile, myPermissions, authorizedPages } = useContext(AuthContext);
  const [total, setTotal] = useState(0);

  const canAccessKanban = useMemo(() => {
    if (profile === "admin") return true;

    const hasDirectPermission = hasPermissionForPath(myPermissions, "/kanban");
    const hasAuthorizedPage = Array.isArray(authorizedPages)
      && authorizedPages.some((page) => page?.ativo && normalizePath(page?.path) === "/kanban");

    return isKanbanPage || hasDirectPermission || hasAuthorizedPage;
  }, [authorizedPages, isKanbanPage, myPermissions, profile]);

  useEffect(() => {
    if (!canAccessKanban) return undefined;

    const loadCount = async () => {
      try {
        const { data } = await api.get("/kanban");
        setTotal(Array.isArray(data) ? data.length : 0);
      } catch (_) {
        setTotal(0);
      }
    };

    loadCount();
    const intervalId = setInterval(loadCount, 60000);
    return () => clearInterval(intervalId);
  }, [canAccessKanban]);

  if (!canAccessKanban) {
    return null;
  }

  return (
    <Tooltip title="Tarefas do Kanban">
      <IconButton
        onClick={() => router.push("/kanban")}
        size="small"
        aria-label="abrir kanban"
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
        <Badge badgeContent={total} color="primary" max={99}>
          <FeatherIcon icon="trello" width="18" height="18" />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default KanbanShortcut;
