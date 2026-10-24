import { createTheme } from "@mui/material/styles";
import components from "./ComponentOverRide";
import shadows from "./Shadows";
import typography from "./Typoraphy";

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: "#f5a623",
      // dark deve continuar igual a --lg-accent-hover do bloco [data-theme="light"] em styles/theme-liquid-glass.css
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
      primary: "#1a1c21",
      secondary: "#5f6673",
      danger: "#fc4b6c",
    },
    grey: {
      A100: "#ecf0f2",
      A200: "#99abb4",
      A400: "#767e89",
      A700: "#e6f4ff",
    },
    action: {
      disabledBackground: "rgba(73,82,88,0.12)",
      hoverOpacity: 0.02,
      hover: "rgba(245, 166, 35, 0.08)",
    },
    background: {
      default: "#f4f5f7",
      paper: "#FFFFFF",
    },
  },
  mixins: {
    toolbar: {
      color: "#949db2",
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

export default theme;
