const ICON_ALIASES = {
  alerttriangle: "alert-triangle",
  "alert-triangle": "alert-triangle",
  warningamber: "alert-triangle",
  warning_amber: "alert-triangle",
  warning: "alert-triangle",
  reportproblem: "alert-circle",
  report_problem: "alert-circle",
  erroroutline: "alert-circle",
  error_outline: "alert-circle",
  error: "alert-circle",
};

export const normalizeIconName = (iconName, fallback = "circle") => {
  if (typeof iconName !== "string") return fallback;
  const raw = iconName.trim();
  if (!raw) return fallback;

  const kebab = raw.toLowerCase().replace(/[_\s]+/g, "-");
  const compact = kebab.replace(/-/g, "");

  return ICON_ALIASES[kebab] || ICON_ALIASES[compact] || kebab || fallback;
};

