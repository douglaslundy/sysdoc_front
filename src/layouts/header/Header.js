import React from "react";
import PropTypes from "prop-types";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { useRouter } from "next/router";
import ProfileDD from "./ProfileDD";

const Header = ({ sx, customClass, toggleSidebar, position = "fixed" }) => {
  const router = useRouter();

  const pageTitle = router.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ");

  return (
    <AppBar
      sx={{
        ...sx,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "var(--lg-glass-topbar)",
        backdropFilter: "var(--lg-blur-topbar)",
        WebkitBackdropFilter: "var(--lg-blur-topbar)",
        borderBottom: "0.5px solid var(--lg-border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset",
        color: "var(--lg-text-primary)",
      }}
      position={position}
      elevation={0}
      className={customClass}
    >
      <Toolbar sx={{ px: "22px !important", py: "13px", minHeight: "64px !important" }}>
        <IconButton
          size="large"
          color="inherit"
          aria-label="open sidebar"
          edge="start"
          onClick={toggleSidebar}
          sx={{
            mr: 2,
            display: "flex",
            background: "var(--lg-glass-chip)",
            border: "0.5px solid var(--lg-border)",
            borderRadius: "10px",
            "&:hover": {
              background: "var(--lg-glass-panel-hover)",
            },
          }}
        >
          <FeatherIcon icon="menu" width="20" height="20" />
        </IconButton>

        <Typography
          sx={{
            fontSize: "17px",
            fontWeight: 600,
            color: "var(--lg-text-primary)",
            letterSpacing: "-0.01em",
            textTransform: "capitalize",
          }}
        >
          {pageTitle || "dashboard"}
        </Typography>

        <Box flexGrow={1} />

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
