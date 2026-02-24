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
              color: theme.palette.primary.contrastText,
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
                color: pathname === item.href
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
              }}
            />
          </ListItemIcon>
          <ListItemText>{item.title}</ListItemText>
        </ListItem>
      </NextLink>
    </List>
  );

  const SidebarContent = (
    <Box p={2} height="100%" sx={{ mt: "74px" }}>

      <LogoIcon />
      <Box mt={2}>
        <List>
          {Menuitems.map((item, index) => {
            if (
              (profile === "admin") ||
              (profile === "user" && item.profile === "user") ||
              (profile === "partner" && item.profile === "partner") ||
              (profile === "tfd" && item.profile === "tfd") ||
              (profile === "driver" && item.profile === "driver")
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
