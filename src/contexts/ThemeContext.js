import { createContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";

import themeLight from "../../src/theme/theme";
import themeDark from "../../src/theme/darkTheme";

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "dark",
});

const THEME_STORAGE_KEY = "themeMode";
const LIQUID_GLASS_STORAGE_KEY = "lg-theme";

const getInitialMode = () => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
  const storedLiquidGlassMode = localStorage.getItem(LIQUID_GLASS_STORAGE_KEY);

  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  if (storedLiquidGlassMode === "light" || storedLiquidGlassMode === "dark") {
    return storedLiquidGlassMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", mode);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      localStorage.setItem(LIQUID_GLASS_STORAGE_KEY, mode);
    }
  }, [mode]);

  const theme = useMemo(() => (mode === "light" ? themeLight : themeDark), [mode]);

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
