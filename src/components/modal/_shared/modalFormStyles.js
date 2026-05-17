export const modalShellSx = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "960px",
  maxWidth: "96vw",
  maxHeight: "92vh",
  overflow: "auto",
  background: "var(--lg-glass-modal)",
  backdropFilter: "var(--lg-blur-modal)",
  WebkitBackdropFilter: "var(--lg-blur-modal)",
  border: "0.5px solid var(--lg-border)",
  borderTop: "1px solid var(--lg-border-strong)",
  boxShadow: "var(--lg-shadow-modal)",
  borderRadius: "20px",
  p: 3.2,
};

export const modalBackdropSx = {
  background: "var(--lg-overlay-bg)",
  backdropFilter: "var(--lg-blur-overlay)",
  WebkitBackdropFilter: "var(--lg-blur-overlay)",
};

export const modalFormRootSx = {
  "& .MuiCard-root": {
    background: "transparent",
    boxShadow: "none",
  },
  "& .MuiCardContent-root": {
    p: 0,
  },
  "& .MuiInputLabel-root": {
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--lg-text-muted)",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
  },
  "& .MuiInputBase-root": {
    minHeight: 44,
    background: "var(--lg-glass-input)",
    border: "0.5px solid var(--lg-border-input)",
    borderRadius: "10px",
    color: "var(--lg-text-primary)",
    boxShadow:
      "0 1px 3px rgba(var(--lg-accent-rgb), 0.05), 0 1px 0 rgba(255,255,255,0.1) inset",
    alignItems: "center",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiInputBase-root.Mui-focused": {
    background: "var(--lg-glass-input-focus)",
    boxShadow: "var(--lg-focus-ring)",
  },
  "& .MuiInputBase-input": {
    paddingTop: "11px",
    paddingBottom: "11px",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "var(--lg-text-muted)",
    opacity: 1,
  },
};

export const modalPrimaryButtonSx = {
  flex: 1,
  py: 1.2,
  borderRadius: "10px",
  background: "linear-gradient(135deg, var(--lg-accent), #6D28D9)",
  boxShadow: "var(--lg-shadow-btn)",
  textTransform: "none",
  fontSize: "14px",
  "&:hover": {
    opacity: 0.92,
    transform: "translateY(-1px)",
    boxShadow: "var(--lg-shadow-btn-hover)",
    background: "linear-gradient(135deg, var(--lg-accent-hover), #7C3AED)",
  },
};

export const modalSecondaryButtonSx = {
  py: 1.2,
  px: 2.2,
  borderRadius: "10px",
  background: "var(--lg-glass-input)",
  border: "0.5px solid var(--lg-border-input)",
  color: "var(--lg-text-secondary)",
  textTransform: "none",
  "&:hover": {
    background: "var(--lg-glass-input-focus)",
    color: "var(--lg-text-primary)",
    border: "0.5px solid var(--lg-border-input)",
  },
};
