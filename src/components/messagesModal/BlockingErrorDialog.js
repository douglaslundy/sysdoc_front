import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from "@mui/material";

/**
 * Aviso de erro que PRECISA ser lido: fica na frente de tudo, em destaque (faixa vermelha) e
 * só fecha no botão "Entendi" — clique fora ou Esc não o fecham (ao contrário das faixas
 * temporárias, que somem sozinhas).
 */
export default function BlockingErrorDialog({ open, title = "Atenção", message = "", onClose }) {
  const handleClose = (event, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    onClose && onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disableEscapeKeyDown
      role="alertdialog"
      aria-labelledby="blocking-error-title"
      aria-describedby="blocking-error-message"
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: (theme) => theme.zIndex.modal + 100 }}
      PaperProps={{ sx: { border: "3px solid #d32f2f", borderRadius: 2, overflow: "hidden" } }}
    >
      <Box sx={{ bgcolor: "#d32f2f", color: "#fff", px: 3, py: 2 }}>
        <Typography id="blocking-error-title" variant="h5" sx={{ fontWeight: 800 }}>
          ⚠ {title}
        </Typography>
      </Box>
      <DialogContent sx={{ py: 3 }}>
        <Typography id="blocking-error-message" variant="h6" sx={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onClose && onClose()} variant="contained" color="error" size="large" autoFocus>
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
}
