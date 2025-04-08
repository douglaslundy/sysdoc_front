// import React, { useEffect } from "react";
// import {
//   experimentalStyled,
//   useMediaQuery,
//   Container,
//   Box,
// } from "@mui/material";
// import Header from "./header/Header";
// import Sidebar from "./sidebar/Sidebar";
// import Footer from "./footer/Footer";
// import { useRouter } from "next/router";

// const MainWrapper = experimentalStyled("div")(() => ({
//   display: "flex",
//   minHeight: "100vh",
//   overflow: "hidden",
//   width: "100%",
// }));

// const PageWrapper = experimentalStyled("div")(({ theme }) => ({
//   display: "flex",
//   flex: "1 1 auto",
//   overflow: "hidden",

//   backgroundColor: theme.palette.background.default,
//   [theme.breakpoints.up("lg")]: {
//     paddingTop: "64px",
//   },
//   [theme.breakpoints.down("lg")]: {
//     paddingTop: "64px",
//   },
// }));

// const FullLayout = ({ children }) => {
//   const [isSidebarOpen, setSidebarOpen] = React.useState(true);
//   const [isMobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
//   const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

//   let curl = useRouter();
//   const location = curl.pathname;

//   useEffect(() => {
//     if (location === '/panel'){      
//       setSidebarOpen(false)
//     }

//     if (location != '/panel'){      
//       setSidebarOpen(true)
//     }
//   }, [location])

//   return (
//     <MainWrapper>

//       {
//         isSidebarOpen &&
//         <Header
//           sx={{
//             paddingLeft: isSidebarOpen && lgUp ? "265px" : "",
//             backgroundColor: "#fbfbfb",
//           }}
//           toggleMobileSidebar={() => setMobileSidebarOpen(true)}
//         />
//       }

//       <Sidebar
//         isSidebarOpen={isSidebarOpen}
//         isMobileSidebarOpen={isMobileSidebarOpen}
//         onSidebarClose={() => setMobileSidebarOpen(false)}
//       />

//       <PageWrapper>
//         <Container
//           maxWidth={false}
//           sx={{
//             paddingTop: isSidebarOpen ? '20px' : '0px',
//             paddingLeft: isSidebarOpen && lgUp ? "280px!important" : "",
//           }}
//         >
//           <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>

//           {
//             isSidebarOpen &&
//             <Footer />
//           }

//         </Container>
//       </PageWrapper>
//     </MainWrapper>
//   );
// };

// export default FullLayout;



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

const MainWrapper = experimentalStyled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  overflow: "hidden",
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
    <MainWrapper>
      <Header toggleSidebar={toggleSidebar} />

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
      />

      <PageWrapper
        sx={{
          marginLeft: isDesktop && isSidebarOpen ? "265px" : 0,
          transition: "margin-left 0.3s ease",
          paddingTop: "64px", // altura do AppBar fixo
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>

          {isSidebarOpen && <Footer />}
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
};

export default FullLayout;
