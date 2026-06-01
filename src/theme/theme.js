import { createTheme } from "@mui/material/styles";
import components from "./ComponentOverRide";
import shadows from "./Shadows";
import typography from "./Typoraphy";

// Create a theme instance.
const theme = createTheme({
  palette: {
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
      main: "#3B82F6",
      light: "#93C5FD",
    },
    error: {
      main: "#e46a76",

      dark: "#e45a68",
    },
    warning: {
      main: "#fec90f",

      dark: "#dcb014",
      contrastText: "#ffffff",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
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
      hover: "rgba(37, 99, 235, 0.08)",
    },
    background: {
      default: "#F8FAFC",
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
