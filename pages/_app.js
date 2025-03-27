import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider } from "@emotion/react";
import theme from "../src/theme/theme";
import createEmotionCache from "../src/createEmotionCache";
import FullLayout from "../src/layouts/FullLayout";
import "../styles/style.css";
import { Provider } from "react-redux";
const clientSideEmotionCache = createEmotionCache();
import store from "../src/store";
import Messages from "../src/components/messages";
import AlertDialog from "../src/components/alertDialog";
import Loading from "../src/components/loading";
import { parseCookies, destroyCookie } from "nookies";
import { AuthContext, AuthProvider } from "../src/contexts/AuthContext";
import { api } from "../src/services/api";
import Router, { useRouter } from "next/router";

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  const [token, setToken] = useState();
  const { "sysvendas.token": cookieToken } = parseCookies();
  const { tokens } = useContext(AuthContext);

  // Considera pública a rota que inicia com "/showqueue"
  const isPublicPage = router.pathname.startsWith("/showqueue");

  useEffect(() => {
    if (!isPublicPage) {
      getToken();
      setToken(cookieToken);
    }
  }, [cookieToken, tokens, isPublicPage]);

  function getToken() {
    const { "sysvendas.token": token } = parseCookies();
    if (token) {
      api.defaults.headers["Authorization"] = `Bearer ${token}`;
    } else {
      Router.push("/login");
    }
    api
      .post("/validate", token)
      .then((res) => {
        // Pode implementar lógica de validação se necessário
      })
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
          <ThemeProvider theme={theme}>
            {isPublicPage ? (
              // Se for página pública, renderiza sem verificação de token
              <Component {...pageProps} />
            ) : token ? (
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
          </ThemeProvider>
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

// getServerSideProps no _app.js não é suportado por padrão, mas se você
// estiver usando-o via alguma estratégia customizada, verifique o token e permita
// acesso sem autenticação para páginas públicas.
export async function getServerSideProps(context) {
  const { req } = context;
  const { "sysvendas.token": token } = parseCookies(context);

  // Se a URL começa com '/showqueue', não exige autenticação.
  if (req.url && req.url.startsWith("/showqueue")) {
    return { props: {} };
  }

  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
}
