import React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import {
  modalFormRootSx,
  modalSecondaryButtonSx,
  modalShellSx,
} from "../modal/_shared/modalFormStyles";

export default function DestructiveConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  loading = false,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          ...modalShellSx,
          ...modalFormRootSx,
          position: "relative",
          transform: "none",
          inset: "auto",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FeatherIcon icon="alert-triangle" width="22" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={modalSecondaryButtonSx}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Excluindo..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
