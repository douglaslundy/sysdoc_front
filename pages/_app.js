import React, { useContext, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import createEmotionCache from "../src/createEmotionCache";
import FullLayout from "../src/layouts/FullLayout";
import "../styles/style.css";
import "../styles/theme-liquid-glass.css";
import "../styles/dashboard-neon.css";
import "../styles/queue-page.css";
import "leaflet/dist/leaflet.css";
import { Provider } from "react-redux";
import store from "../src/store";
import Messages from "../src/components/messages";
import AlertDialog from "../src/components/alertDialog";
import Loading from "../src/components/loading";
import { parseCookies } from "nookies";
import { AuthContext, AuthProvider } from "../src/contexts/AuthContext";
import Router, { useRouter } from "next/router";
import { CustomThemeProvider } from "../src/contexts/ThemeContext";
import { api } from "../src/services/api";
import { getPageTitle } from "../src/utils/pageTitle";

const clientSideEmotionCache = createEmotionCache();

const PUBLIC_ROUTES = ["/login", "/consulta-exame", "/esqueci-senha", "/redefinir-senha", "/attendance/panel", "/transparency/medicines", "/transparency/medicines-panel", "/transparency/medicines-monthly-acquisitions"];

function AuditPageView() {
  const { permissionsLoaded } = useContext(AuthContext);
  const router = useRouter();
  const lastRef = useRef(null);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (isPublicRoute(router.pathname)) return;
    if (lastRef.current === router.pathname) return;
    lastRef.current = router.pathname;
    api.post("/audit/page-view", { path: router.pathname }).catch(() => {});
  }, [router.pathname, permissionsLoaded]);

  return null;
}

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/showqueue") || pathname.startsWith("/painel-esus");
}

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();

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

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>{`SysDoc - ${getPageTitle(router.pathname)}`}</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var saved=localStorage.getItem('lg-theme')||localStorage.getItem('themeMode');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=(saved==='light'||saved==='dark')?saved:(prefersDark?'dark':'light');document.documentElement.setAttribute('data-theme',theme);})();`,
          }}
        />
      </Head>
      <Provider store={store}>
        <AuthProvider>
          <AuditPageView />
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
