import { createTheme } from "@mui/material/styles";
import components from "./ComponentOverRide";
import shadows from "./Shadows";
import typography from "./Typoraphy";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2563EB",
      light: "#3B82F6",
      dark: "#1D4ED8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#7C3AED",
      light: "#8B5CF6",
      dark: "#6D28D9",
      contrastText: "#ffffff",
    },
    success: {
      main: "#00c292",
      dark: "#00964b",
      contrastText: "#ffffff",
    },
    danger: {
      main: "#e46a76",
      light: "#fdf3f5",
    },
    info: {
      main: "#60A5FA",
      light: "#93C5FD",
    },
    error: {
      main: "#e46a76",
      dark: "#e45a68",
    },
    warning: {
      main: "#fec90f",
      dark: "#dcb014",
      contrastText: "#0F172A",
    },
    text: {
      primary: "#E2E8F0",
      secondary: "#94A3B8",
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
      hover: "rgba(37,99,235,0.08)",
    },
    background: {
      default: "#030712",
      paper: "#071122",
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

