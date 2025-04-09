import { createContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";

// src/contexts/ThemeContext.js
import themeLight from "../../src/theme/theme";
import themeDark from "../../src/theme/darkTheme";


export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "light",
});

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("themeMode");
    if (stored) setMode(stored);
  }, []);

  const toggleColorMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

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
