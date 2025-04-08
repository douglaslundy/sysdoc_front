// import React from "react";
// import FeatherIcon from "feather-icons-react";
// import { AppBar, Box, IconButton, Toolbar } from "@mui/material";
// import PropTypes from "prop-types";
// // Dropdown Component
// import SearchDD from "./SearchDD";
// import ProfileDD from "./ProfileDD";

// const Header = ({ sx, customClass, toggleMobileSidebar, position }) => {
//   return (
//     <AppBar sx={sx} position={position} elevation={0} className={customClass}>
//       <Toolbar>
//         <IconButton
//           size="large"
//           color="inherit"
//           aria-label="menu"
//           onClick={toggleMobileSidebar}
//           sx={{
//             display: {
//               lg: "none",
//               xs: "flex",
//             },
//           }}
//         >
//           <FeatherIcon icon="menu" width="20" height="20" />
//         </IconButton>
//         {/* ------------------------------------------- */}
//         {/* Search Dropdown */}
//         {/* ------------------------------------------- */}
//         {/* <SearchDD /> */}
//         {/* ------------ End Menu icon ------------- */}

//         <Box flexGrow={1} />

//         <ProfileDD />
//         {/* ------------------------------------------- */}
//         {/* Profile Dropdown */}
//         {/* ------------------------------------------- */}
//       </Toolbar>
//     </AppBar>
//   );
// };

// Header.propTypes = {
//   sx: PropTypes.object,
//   customClass: PropTypes.string,
//   position: PropTypes.string,
//   toggleSidebar: PropTypes.func,
//   toggleMobileSidebar: PropTypes.func,
// };

// export default Header;



import React from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
// import SearchDD from "./SearchDD"; // Ative se quiser
import ProfileDD from "./ProfileDD";

const Header = ({ sx, customClass, toggleSidebar, position = "fixed" }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  return (
    <AppBar
      sx={{
        ...sx,
        zIndex: (theme) => theme.zIndex.drawer + 1, // Garante que fique acima do Drawer
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
      position={position}
      elevation={0}
      className={customClass}
    >
      <Toolbar>
        {/* Ícone de menu sempre visível */}
        <IconButton
          size="large"
          color="inherit"
          aria-label="open sidebar"
          edge="start"
          onClick={toggleSidebar}
          sx={{
            mr: 2,
            display: "flex",
          }}
        >
          <FeatherIcon icon="menu" width="20" height="20" />
        </IconButton>

        {/* Se quiser usar dropdown de busca, descomente abaixo */}
        {/* <SearchDD /> */}

        <Box flexGrow={1} />

        {/* Menu de perfil */}
        <ProfileDD />
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
  customClass: PropTypes.string,
  position: PropTypes.string,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Header;
