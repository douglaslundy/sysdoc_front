import React, { useEffect, useState } from "react";
import {
  experimentalStyled,
  useMediaQuery,
  Container,
  Box,
  useTheme,
} from "@mui/material";
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import Footer from "./footer/Footer";
import { useRouter } from "next/router";
import Menuitems from "./sidebar/MenuItems";
import AuthGuard from "../components/authGuard";

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
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [isSidebarOpen, setSidebarOpen] = useState(isDesktop);
  const router = useRouter();

  // Esconde sidebar na rota "/panel"
  useEffect(() => {
    if (router.pathname === "/panel") {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(isDesktop);
    }
  }, [router.pathname, isDesktop]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
      />
      <MainWrapper>
        <Header toggleSidebar={toggleSidebar} />

        <PageWrapper
        sx={{
          marginLeft: isDesktop && isSidebarOpen ? "265px" : 0,
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
            <AuthGuard
              requiredProfiles={
                Menuitems.flatMap(g => g.children)
                  .find(item => item.href === router.pathname)?.profile || []
              }
            >
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
