export const systemConfigPageSx = {
  maxWidth: 980,
  mx: "auto",
  "& .system-config-container": {
    maxWidth: 920,
    margin: "0 auto",
    padding: "24px 16px 40px",
    color: "var(--lg-text-primary)",
  },
  "& .system-config-surface": {
    background: "var(--lg-glass-panel)",
    border: "1px solid var(--lg-border)",
    borderRadius: "14px",
    boxShadow: "var(--lg-shadow-panel)",
    overflow: "hidden",
  },
  "& .system-config-section": {
    padding: "22px",
  },
  "& .system-config-section-header": {
    padding: "16px 20px",
    borderBottom: "1px solid var(--lg-border)",
  },
  "& .system-config-label": {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "var(--lg-text-muted)",
    marginBottom: "6px",
  },
  "& .system-config-input": {
    width: "100%",
    minHeight: "48px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "var(--lg-glass-input)",
    border: "0.5px solid var(--lg-border-input)",
    color: "var(--lg-text-primary)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    boxShadow:
      "0 1px 3px rgba(var(--lg-accent-rgb), 0.05), 0 1px 0 rgba(255,255,255,0.1) inset",
    transition: "background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
  },
  "& .system-config-input:focus": {
    background: "var(--lg-glass-input-focus)",
    boxShadow: "var(--lg-focus-ring)",
  },
  "& .system-config-input::placeholder": {
    color: "var(--lg-text-muted)",
    opacity: 1,
  },
  "& .MuiTextField-root .MuiOutlinedInput-root, & .MuiFormControl-root .MuiOutlinedInput-root": {
    minHeight: "48px",
    background: "var(--lg-glass-input)",
    border: "0.5px solid var(--lg-border-input)",
    borderRadius: "10px",
    boxShadow:
      "0 1px 3px rgba(var(--lg-accent-rgb), 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset",
  },
  "& .MuiTextField-root .MuiOutlinedInput-root:hover, & .MuiFormControl-root .MuiOutlinedInput-root:hover": {
    background: "var(--lg-glass-input)",
  },
  "& .MuiTextField-root .MuiOutlinedInput-root.Mui-focused, & .MuiFormControl-root .MuiOutlinedInput-root.Mui-focused": {
    background: "var(--lg-glass-input-focus)",
    boxShadow: "var(--lg-focus-ring)",
  },
  "& .MuiTextField-root .MuiOutlinedInput-notchedOutline, & .MuiFormControl-root .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiTextField-root .MuiInputBase-input, & .MuiFormControl-root .MuiInputBase-input, & .MuiFormControl-root .MuiSelect-select": {
    color: "var(--lg-text-primary)",
    WebkitTextFillColor: "var(--lg-text-primary)",
    background: "transparent",
  },
  "& .MuiFormControl-root .MuiSelect-icon": {
    color: "var(--lg-text-muted)",
  },
  "& .MuiTextField-root .MuiInputBase-input::placeholder, & .MuiFormControl-root .MuiInputBase-input::placeholder": {
    color: "var(--lg-text-muted)",
    opacity: 1,
  },
  "& .system-config-inline-actions": {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  "& .system-config-action": {
    minHeight: "44px",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
  },
  "& .system-config-action--primary": {
    background: "var(--lg-accent)",
    color: "#000",
    border: "none",
  },
  "& .system-config-action--secondary": {
    background: "var(--lg-glass-input)",
    border: "0.5px solid var(--lg-border-input)",
    color: "var(--lg-text-secondary)",
  },
  "& .system-config-action--success": {
    background: "var(--success)",
    color: "#fff",
    border: "none",
  },
  "& .system-config-action--danger": {
    background: "transparent",
    border: "1px solid var(--danger)",
    color: "var(--danger)",
  },
  "& .system-config-checkbox-label": {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--lg-text-primary)",
  },
  "& .system-config-note": {
    fontSize: "13px",
    color: "var(--lg-text-muted)",
  },
};
