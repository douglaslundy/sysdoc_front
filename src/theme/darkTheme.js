import { createTheme } from "@mui/material/styles";
import components from "./ComponentOverRide";
import shadows from "./Shadows";
import typography from "./Typoraphy";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#f5a623",
      // dark deve continuar igual a --lg-accent-hover do bloco [data-theme="dark"] em styles/theme-liquid-glass.css
      dark: "#e8902a",
      contrastText: "#000000",
    },
    secondary: {
      main: "#7C3AED",
      light: "#8B5CF6",
      dark: "#6D28D9",
      contrastText: "#ffffff",
    },
    success: {
      main: "#43a047",
      dark: "#2e7d32",
      contrastText: "#ffffff",
    },
    danger: {
      main: "#e46a76",
      light: "#fdf3f5",
    },
    info: {
      main: "#1e88e5",
      light: "#93C5FD",
    },
    error: {
      main: "#e53935",
      dark: "#c62828",
    },
    warning: {
      main: "#f5a623",
      dark: "#e8902a",
      contrastText: "#000000",
    },
    text: {
      primary: "#e8eaf0",
      secondary: "#8a90a0",
      danger: "#fc4b6c",
    },
    grey: {
      A100: "#1F2D45",
      A200: "#243044",
      A400: "#4B5563",
      A700: "#6B7280",
    },
    action: {
      disabledBackground: "rgba(255,255,255,0.08)",
      hoverOpacity: 0.05,
      hover: "rgba(245, 166, 35, 0.08)",
    },
    background: {
      default: "#0e0f11",
      paper: "#1c1e21",
    },
  },
  mixins: {
    toolbar: {
      color: "#94A3B8",
      "@media(min-width:1280px)": {
        minHeight: "64px",
        padding: "0 30px",
      },
      "@media(max-width:1280px)": {
        minHeight: "64px",
      },
    },
  },
  components,
  shadows,
  typography,
});

export default darkTheme;

