import React, { useContext, useEffect, useState } from "react";
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
import { AuthContext, AuthProvider } from "../src/contexts/AuthContext";
import { api } from "../src/services/api";
import Router, { useRouter } from "next/router";
import { CustomThemeProvider } from "../src/contexts/ThemeContext"; // ← novo

const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  const [token, setToken] = useState();
  const { "sysvendas.token": cookieToken } = parseCookies();
  const { tokens } = useContext(AuthContext);

  useEffect(() => {
    getToken();
    setToken(cookieToken);
  }, [cookieToken, tokens]);

  function getToken() {
    const { "sysvendas.token": token } = parseCookies();
    if (token) {
      api.defaults.headers["Authorization"] = `Bearer ${token}`;
    } else {
      Router.push("/login");
    }

    api
      .post("/validate", token)
      .catch((error) => {
        const erro = "Request failed with status code 401";
        if (erro === error.message) {
          destroyCookie(null, "sysvendas.id");
          destroyCookie(null, "sysvendas.token");
          destroyCookie(null, "sysvendas.username");
          destroyCookie(null, "sysvendas.profile");
          Router.push("/login");
        }
      });
  }

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>SysDoc - Controle de Documentos</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <Provider store={store}>
        <AuthProvider>
          <CustomThemeProvider> {/* ← agora o tema vem daqui */}
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
