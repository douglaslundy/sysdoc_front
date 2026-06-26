import React, { useEffect, useState } from "react";
import Router from "next/router";
import {
  experimentalStyled,
  useMediaQuery,
  Badge,
  Container,
  Box,
  IconButton,
  useTheme,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import Footer from "./footer/Footer";
import AuthGuard from "../components/authGuard";
import NoticeModal from "../components/systemNotices/NoticeModal";
import ChatPanel from "../components/chat/ChatPanel";
import { AuthContext } from "../contexts/AuthContext";
import { ChatContext } from "../contexts/ChatContext";
import { useContext } from "react";

const SIDEBAR_WIDTH = 318;

const MainWrapper = experimentalStyled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  overflowX: "hidden",
  width: "100%",
  flexDirection: "column",
}));

const PageWrapper = experimentalStyled("div")(({ theme }) => ({
  display: "flex",
  flex: "1 1 auto",
  backgroundColor: theme.palette.background.default,
}));

const FullLayout = ({ children }) => {
  const theme = useTheme();
  const { canUseChat } = useContext(AuthContext);
  const { isOpen, setIsOpen, unreadTotal } = useContext(ChatContext);
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true);
    }
  }, [isDesktop]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const closeMobileSidebar = () => {
      if (!isDesktop) {
        setSidebarOpen(false);
      }
    };

    Router.events.on("routeChangeStart", closeMobileSidebar);

    return () => {
      Router.events.off("routeChangeStart", closeMobileSidebar);
    };
  }, [isDesktop]);

  return (
    <>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
      />
      {canUseChat && <ChatPanel />}
      {canUseChat && !isOpen && (
        <Box
          sx={{
            position: "fixed",
            right: { xs: 16, md: 24 },
            bottom: { xs: 16, md: 24 },
            zIndex: (currentTheme) => currentTheme.zIndex.drawer + 2,
          }}
        >
          <IconButton
            aria-label="Abrir chat interno"
            onClick={() => setIsOpen(true)}
            sx={{
              width: 58,
              height: 58,
              color: "var(--lg-text-primary)",
              background:
                theme.palette.mode === "light"
                  ? "rgba(226, 232, 240, 0.96)"
                  : "var(--lg-glass-chip)",
              border: "1px solid var(--lg-border)",
              boxShadow: "0 18px 35px rgba(15, 23, 42, 0.18)",
              backdropFilter: "var(--lg-blur-panel)",
              "&:hover": {
                background:
                  theme.palette.mode === "light"
                    ? "rgba(203, 213, 225, 0.98)"
                    : "var(--lg-glass-panel-hover)",
              },
            }}
          >
            <Badge badgeContent={unreadTotal} color="error" max={99}>
              <FeatherIcon icon="message-circle" width="22" height="22" />
            </Badge>
          </IconButton>
        </Box>
      )}
      <MainWrapper>
        <Header toggleSidebar={toggleSidebar} />

        <PageWrapper
        id="page-wrapper"
        sx={{
          marginLeft: isDesktop && isSidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
          paddingTop: "64px",
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>
            <AuthGuard>
              <NoticeModal />
              {children}
            </AuthGuard>
          </Box>

          {isSidebarOpen && <Footer />}
        </Container>
      </PageWrapper>
      </MainWrapper>
    </>
  );
};

export default FullLayout;
