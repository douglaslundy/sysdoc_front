import { createTheme } from "@mui/material/styles";
import components from "./ComponentOverRide";
import shadows from "./Shadows";
import typography from "./Typoraphy";

// Criação do tema em modo dark
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#03c9d7",
      light: "#26d8e0",
      dark: "#02acb6",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#fb9678",
      light: "#fdbaa0",
      dark: "#e67e5f",
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
      main: "#0bb2fb",
      light: "#a7e3f4",
    },
    error: {
      main: "#e46a76",
      dark: "#e45a68",
    },
    warning: {
      main: "#fec90f",
      dark: "#dcb014",
      contrastText: "#000000", // contraste melhor em fundo escuro
    },
    text: {
      primary: "#ffffff",
      secondary: "#cfd8dc",
      danger: "#fc4b6c",
    },
    grey: {
      A100: "#2a2a2a",
      A200: "#424242",
      A400: "#616161",
      A700: "#757575",
    },
    action: {
      disabledBackground: "rgba(255,255,255,0.12)",
      hoverOpacity: 0.05,
      hover: "rgba(255,255,255,0.08)",
    },
    background: {
      default: "#121212",      // fundo base
      paper: "#1e1e1e",        // fundo de cards, drawers, etc.
    },
  },
  mixins: {
    toolbar: {
      color: "#cfd8dc",
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
