import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import createEmotionCache from "../src/createEmotionCache";
import FullLayout from "../src/layouts/FullLayout";
import "../styles/style.css";
import { Provider } from "react-redux";
import store from "../src/store";
import Messages from "../src/components/messages";
import AlertDialog from "../src/components/alertDialog";
import Loading from "../src/components/loading";
import { parseCookies, destroyCookie } from "nookies";
import { AuthProvider } from "../src/contexts/AuthContext";
import { setAuthToken } from "../src/services/api";
import Router, { useRouter } from "next/router";
import { CustomThemeProvider } from "../src/contexts/ThemeContext";

const clientSideEmotionCache = createEmotionCache();

// Rotas que não requerem autenticação
const PUBLIC_ROUTES = ["/login", "/consulta-exame", "/esqueci-senha", "/redefinir-senha"];

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/showqueue");
}

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  // sysvendas.id is a non-httpOnly cookie — safe to read client-side, used only to
  // detect "probably authenticated" so the layout renders immediately without a flash.
  const { "sysvendas.id": userId } = parseCookies();
  const [token, setToken] = useState(
    isPublicRoute(router.pathname) ? 'public' : (userId ? 'hydrating' : undefined)
  );

  useEffect(() => {
    if (isPublicRoute(router.pathname)) {
      setToken('public');
      return;
    }

    // Token is httpOnly — cannot be read via parseCookies() on client.
    // BFF /api/auth/me reads the httpOnly cookie server-side and validates it.
    fetch('/api/auth/me')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAuthToken(data.token);
          setToken(data.token);
        } else {
          destroyCookie(null, "sysvendas.id");
          destroyCookie(null, "sysvendas.username");
          destroyCookie(null, "sysvendas.profile");
          setToken(undefined);
          Router.push("/login");
        }
      })
      .catch(() => {
        // Network error — keep current session to avoid unnecessary logouts
        setToken('unknown');
      });
  }, [router.pathname]);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>SysDoc - Controle de Documentos</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <Provider store={store}>
        <AuthProvider>
          <CustomThemeProvider>
            {token ? (
              <>
                <CssBaseline />
                <FullLayout>
                  <Loading />
                  <AlertDialog />
                  <Messages />
                  <Component {...pageProps} />
                </FullLayout>
              </>
            ) : (
              <Component {...pageProps} />
            )}
          </CustomThemeProvider>
        </AuthProvider>
      </Provider>
    </CacheProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};
