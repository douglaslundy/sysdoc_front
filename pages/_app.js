import React, {useContext, useEffect, useState} from "react";
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
// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();
import store from "../src/store";
import Messages from "../src/components/messages";
import AlertDialog from "../src/components/alertDialog";
import Loading from "../src/components/loading";
import { parseCookies, destroyCookie } from 'nookies';
import { AuthContext, AuthProvider } from "../src/contexts/AuthContext";
import { api } from "../src/services/api";
import Router from "next/router";

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const [token, setToken] = useState();
  const { 'sysvendas.token': value } = parseCookies();
  const { tokens } = useContext(AuthContext);

  useEffect(() => {
    getToken();
    setToken(value);
  },[value, tokens])

  function getToken() {
    const { 'sysvendas.token': token } = parseCookies();
    token ? api.defaults.headers['Authorization'] = `Bearer ${token}` : Router.push('/login');

    api
        .post('/validate', token)
        .then((res) => {
          // desenvover aqui se o usuario existe
        })
        .catch((error) => {
            const erro = 'Request failed with status code 401';

            if (erro == error.message) {
                destroyCookie(null, 'sysvendas.id'),
                    destroyCookie(null, 'sysvendas.token'),
                    destroyCookie(null, 'sysvendas.username'),
                    destroyCookie(null, 'sysvendas.profile'),

                    Router.push('/login')
            }

        })

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
            {token ?
              <>
                <CssBaseline />
                <FullLayout>

                  <Loading />
                  <AlertDialog />
                  <Messages />

                  <Component {...pageProps} />

                </FullLayout>
              </>
              :
              <Component {...pageProps} />
            }
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


export async function getServerSideProps(context) {

  const { 'sysvendas.token': token } = parseCookies(context);
  
  if(!token){
    return {
      redirect: {
        destination: '/login',
        permanent: false, 
      }
    }
  }
  return {
    props: {}, // will be passed to the page component as props
  }
}