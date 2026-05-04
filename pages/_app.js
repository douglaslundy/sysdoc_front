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
import { api } from "../src/services/api";
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
  const [token, setToken] = useState();

  useEffect(() => {
    const { "sysvendas.token": cookieToken } = parseCookies();
    setToken(cookieToken);

    if (cookieToken) {
      api.defaults.headers["Authorization"] = `Bearer ${cookieToken}`;
      // Validar token apenas em rotas protegidas
      if (!isPublicRoute(router.pathname)) {
        api.post("/validate").catch((error) => {
          if (error.response && error.response.status === 401) {
            destroyCookie(null, "sysvendas.id");
            destroyCookie(null, "sysvendas.token");
            destroyCookie(null, "sysvendas.username");
            destroyCookie(null, "sysvendas.profile");
            setToken(undefined);
            Router.push("/login");
          }
          // Erros de rede (500, timeout) não destroem a sessão
        });
      }
    } else if (!isPublicRoute(router.pathname)) {
      Router.push("/login");
    }
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
