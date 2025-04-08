// import React, { useContext } from "react";
// import NextLink from "next/link";
// import PropTypes from "prop-types";
// import {
//   Box,
//   Drawer,
//   useMediaQuery,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
// } from "@mui/material";
// import FeatherIcon from "feather-icons-react";
// import LogoIcon from "../logo/LogoIcon";
// import Menuitems from "./MenuItems";
// import { useRouter } from "next/router";
// import { AuthContext } from "../../contexts/AuthContext";

// const Sidebar = ({ isMobileSidebarOpen, onSidebarClose, isSidebarOpen }) => {

//   const { profile } = useContext(AuthContext);

//   const [open, setOpen] = React.useState(true);

//   const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

//   const handleClick = (index) => {
//     if (open === index) {
//       setOpen((prevopen) => !prevopen);
//     } else {
//       setOpen(index);
//     }
//   };
//   let curl = useRouter();
//   const location = curl.pathname;

//   const Lista = (item, index) => {
//     return (
//       <List component="li" disablePadding key={item.title}>

//         <NextLink href={item.href}>
//           <ListItem
//             onClick={() => handleClick(index)}
//             button
//             selected={location === item.href}
//             sx={{
//               mb: 1,
//               ...(location === item.href && {
//                 color: "white",
//                 backgroundColor: (theme) =>
//                   `${theme.palette.primary.main}!important`,
//               }),
//             }}
//           >
//             <ListItemIcon>
//               <FeatherIcon
//                 style={{
//                   color: `${location === item.href ? "white" : ""} `,
//                 }}
//                 icon={item.icon}
//                 width="20"
//                 height="20"
//               />
//             </ListItemIcon>

//             <ListItemText onClick={onSidebarClose}>
//               {item.title}
//             </ListItemText>
//           </ListItem>
//         </NextLink>

//       </List>
//     )
//   }

//   const SidebarContent = (
//     <Box p={2} height="100%">
//       <LogoIcon />
//       <Box mt={2}>
//         <List>

//           {Menuitems.map((item, index) => (

//             profile == "admin" &&
//             Lista(item, index)
//             ||
//             profile == "user" && item.profile != "admin" &&
//             Lista(item, index)
//             ||
//             profile == "partner" && item.profile == "partner" &&
//             Lista(item, index)

//           ))}

//         </List>
//       </Box>

//     </Box>
//   );
//   if (lgUp) {
//     return (
//       <Drawer
//         anchor="left"
//         open={isSidebarOpen}
//         variant="persistent"
//         PaperProps={{
//           sx: {
//             width: "265px",
//             border: "0 !important",
//             boxShadow: "0px 7px 30px 0px rgb(113 122 131 / 11%)",
//           },
//         }}
//       >
//         {SidebarContent}
//       </Drawer>
//     );
//   }
//   return (
//     <Drawer
//       anchor="left"
//       open={isMobileSidebarOpen}
//       onClose={onSidebarClose}
//       PaperProps={{
//         sx: {
//           width: "265px",
//           border: "0 !important",
//         },
//       }}
//       variant="temporary"
//     >
//       {SidebarContent}
//     </Drawer>
//   );
// };

// Sidebar.propTypes = {
//   isMobileSidebarOpen: PropTypes.bool,
//   onSidebarClose: PropTypes.func,
//   isSidebarOpen: PropTypes.bool,
// };

// export default Sidebar;


import React, { useContext } from "react";
import NextLink from "next/link";
import PropTypes from "prop-types";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FeatherIcon from "feather-icons-react";
import LogoIcon from "../logo/LogoIcon";
import Menuitems from "./MenuItems";
import { useRouter } from "next/router";
import { AuthContext } from "../../contexts/AuthContext";

const Sidebar = ({ isSidebarOpen, onSidebarClose }) => {
  const { profile } = useContext(AuthContext);
  const { pathname } = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const renderMenuItem = (item, index) => (
    <List component="li" disablePadding key={item.title}>
      <NextLink href={item.href} passHref>
        <ListItem
          onClick={onSidebarClose}
          button
          selected={pathname === item.href}
          sx={{
            mb: 1,
            ...(pathname === item.href && {
              color: "white",
              backgroundColor: (theme) =>
                `${theme.palette.primary.main}!important`,
            }),
          }}
        >
          <ListItemIcon>
            <FeatherIcon
              icon={item.icon}
              width="20"
              height="20"
              style={{
                color: pathname === item.href ? "white" : "",
              }}
            />
          </ListItemIcon>
          <ListItemText>{item.title}</ListItemText>
        </ListItem>
      </NextLink>
    </List>
  );

  const SidebarContent = (
    <Box p={2} height="100%" sx={{ mt: "64px" }}>

      <LogoIcon />
      <Box mt={2}>
        <List>
          {Menuitems.map((item, index) => {
            if (
              (profile === "admin") ||
              (profile === "user" && item.profile !== "admin") ||
              (profile === "partner" && item.profile === "partner")
            ) {
              return renderMenuItem(item, index);
            }
            return null;
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="left"
      open={isSidebarOpen}
      onClose={onSidebarClose}
      variant={isDesktop ? "persistent" : "temporary"}
      PaperProps={{
        sx: {
          width: "265px",
          border: "0 !important",
          boxShadow: "0px 7px 30px 0px rgb(113 122 131 / 11%)",
        },
      }}
    >
      {SidebarContent}
    </Drawer>
  );
};

Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  onSidebarClose: PropTypes.func.isRequired,
};

export default Sidebar;
