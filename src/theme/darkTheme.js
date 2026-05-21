import { createTheme } from "@mui/material/styles";
import components from "./ComponentOverRide";
import shadows from "./Shadows";
import typography from "./Typoraphy";

// Criação do tema em modo dark — paleta Elite da IA
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2563EB",       // azul vibrante (botões CTA, ativo)
      light: "#60A5FA",      // azul claro (ícones, acentos)
      dark: "#1D3A6B",       // azul médio (sidebar ativo, hover)
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1E40AF",       // azul badge/destaque secundário
      light: "#3B82F6",      // azul intermediário
      dark: "#162032",       // azul-escuro profundo
      contrastText: "#ffffff",
    },
    success: {
      main: "#00c292",       // mantido (não havia equivalente no tema)
      dark: "#00964b",
      contrastText: "#ffffff",
    },
    danger: {
      main: "#e46a76",
      light: "#fdf3f5",
    },
    info: {
      main: "#60A5FA",       // azul claro de acento
      light: "#93C5FD",      // azul mais suave
    },
    error: {
      main: "#e46a76",
      dark: "#e45a68",
    },
    warning: {
      main: "#fec90f",       // mantido (sem equivalente no tema)
      dark: "#dcb014",
      contrastText: "#000000",
    },
    text: {
      primary: "#ffffff",        // branco puro
      secondary: "#8B9EC7",      // cinza-azulado (textos secundários)
      danger: "#fc4b6c",
    },
    grey: {
      A100: "#1F2D45",       // bordas/divisores
      A200: "#243044",       // bordas mais suaves
      A400: "#4B5563",       // labels de seção
      A700: "#6B7280",       // cinza médio
    },
    action: {
      disabledBackground: "rgba(255,255,255,0.08)",
      hoverOpacity: 0.05,
      hover: "rgba(37,99,235,0.08)",   // hover com tom azul primário
    },
    background: {
      default: "#0D1117",    // fundo base (azul-escuro profundo)
      paper: "#1A2235",      // fundo de cards, drawers, etc.
    },
  },
  mixins: {
    toolbar: {
      color: "#8B9EC7",      // cinza-azulado (texto do toolbar)
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