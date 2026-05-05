import React, { useEffect } from "react";
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

const PUBLIC_ROUTES = ["/login", "/consulta-exame", "/esqueci-senha", "/redefinir-senha"];

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/showqueue");
}

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();

  // Read non-httpOnly cookies synchronously on the client.
  // During SSR parseCookies() returns {} — layout won't show on server,
  // but React re-renders on the client immediately with real values.
  const { "sysvendas.id": userId, "sysvendas.profile": userProfile } = parseCookies();
  const hasSession = Boolean(userId && userProfile);

  // Layout is visible when the client has valid session cookies and is on a protected route.
  // Compute showLayout based on route only (not cookies) so SSR and client agree.
  // Auth redirect is handled by the useEffect below.
  const showLayout = !isPublicRoute(router.pathname);

  useEffect(() => {
    if (isPublicRoute(router.pathname)) return;

    const { "sysvendas.id": id, "sysvendas.profile": prof } = parseCookies();

    if (!id || !prof) {
      Router.push("/login");
      return;
    }

    // Hydrate axios Authorization header from the httpOnly token via BFF.
    fetch('/api/auth/me')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAuthToken(data.token);
        } else if (res.status === 401) {
          // Confirmed invalid — clear metadata cookies and redirect.
          destroyCookie(null, "sysvendas.id");
          destroyCookie(null, "sysvendas.username");
          destroyCookie(null, "sysvendas.profile");
          Router.push("/login");
        }
        // 5xx / network errors: keep session, axios will fail per-request.
      })
      .catch(() => {
        // Network unreachable — do not destroy valid session cookies.
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
