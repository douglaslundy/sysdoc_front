import React, { useContext } from "react";
import PropTypes from "prop-types";
import { AppBar, Badge, Box, IconButton, Toolbar, Typography } from "@mui/material";
import FeatherIcon from "feather-icons-react";
import { useRouter } from "next/router";
import ProfileDD from "./ProfileDD";
import { getPageTitle } from "../../utils/pageTitle";
import ProtocolBell from "../../components/protocolo/ProtocolBell";
import { ChatContext } from "../../contexts/ChatContext";
import { AuthContext } from "../../contexts/AuthContext";

const Header = ({ sx, customClass, toggleSidebar, position = "fixed" }) => {
  const { pathname } = useRouter();
  const pageTitle = getPageTitle(pathname);
  const { setIsOpen, unreadTotal } = useContext(ChatContext);
  const { canUseChat } = useContext(AuthContext);

  return (
    <AppBar
      sx={{
        ...sx,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: "var(--lg-text-primary)",
      }}
      position={position}
      elevation={0}
      className={`lg-topbar-paper ${customClass || ""}`.trim()}
    >
      <Toolbar sx={{ px: "22px !important", py: "13px", minHeight: "64px !important" }}>
        {canUseChat && <IconButton
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
        </IconButton>}

        <Typography
          sx={{
            fontSize: { xs: "14px", md: "16px" },
            fontWeight: 700,
            color: "var(--lg-text-primary)",
            textTransform: "capitalize",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {pageTitle}
        </Typography>

        <Box flexGrow={1} />

        {canUseChat && <IconButton
          aria-label="Abrir chat interno"
          onClick={() => setIsOpen(true)}
          sx={{
            mr: 0.5,
            color: "inherit",
            background: "var(--lg-glass-chip)",
            border: "0.5px solid var(--lg-border)",
            borderRadius: "10px",
          }}
        >
          <Badge badgeContent={unreadTotal} color="error" max={99}>
            <FeatherIcon icon="message-circle" width="20" height="20" />
          </Badge>
        </IconButton>}
        <ProtocolBell />
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
