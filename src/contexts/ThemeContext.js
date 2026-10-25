import { createContext, useEffect, useState } from "react";

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "dark",
});

const THEME_STORAGE_KEY = "themeMode";
const LEGACY_STORAGE_KEY = "lg-theme";

const getInitialMode = () => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
  const legacyMode = localStorage.getItem(LEGACY_STORAGE_KEY);

  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  if (legacyMode === "light" || legacyMode === "dark") {
    return legacyMode;
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
      localStorage.setItem(LEGACY_STORAGE_KEY, mode);
    }
  }, [mode]);

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      {children}
    </ColorModeContext.Provider>
  );
};
