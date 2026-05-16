import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import createEmotionCache from "../src/createEmotionCache";
import FullLayout from "../src/layouts/FullLayout";
import "../styles/style.css";
import "../styles/theme-liquid-glass.css";
import { Provider } from "react-redux";
import store from "../src/store";
import Messages from "../src/components/messages";
import AlertDialog from "../src/components/alertDialog";
import Loading from "../src/components/loading";
import { parseCookies } from "nookies";
import { AuthProvider } from "../src/contexts/AuthContext";
import Router, { useRouter } from "next/router";
import { CustomThemeProvider } from "../src/contexts/ThemeContext";
import { api } from "../src/services/api";

const clientSideEmotionCache = createEmotionCache();

const PUBLIC_ROUTES = ["/login", "/consulta-exame", "/esqueci-senha", "/redefinir-senha", "/transparency/medicines", "/transparency/medicines-panel", "/transparency/medicines-monthly-acquisitions"];

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/showqueue");
}

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  const lastAuditedPathRef = useRef(null);

  // showLayout based on route (not cookies) so SSR and client agree — prevents hydration mismatch.
  // Auth redirect (missing cookies) handled by useEffect; token handling by AuthContext.
  const showLayout = !isPublicRoute(router.pathname);

  useEffect(() => {
    if (isPublicRoute(router.pathname)) return;

    // Guard for client-side SPA navigation: if metadata cookies are gone
    // (e.g. after logout via another tab), redirect before rendering the page.
    // Direct URL access is caught earlier by middleware.server-side.
    const { "sysvendas.id": id, "sysvendas.profile": prof } = parseCookies();
    if (!id || !prof) {
      Router.push("/login");
    }
  }, [router.pathname]);

  useEffect(() => {
    if (isPublicRoute(router.pathname)) return;
    if (lastAuditedPathRef.current === router.pathname) return;

    const { "sysvendas.id": id, "sysvendas.profile": prof } = parseCookies();
    if (!id || !prof) return;

    lastAuditedPathRef.current = router.pathname;
    api.post("/audit/page-view", { path: router.pathname }).catch(() => {});
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
            {showLayout ? (
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

